/**
 * EcoTwin AI - Digital Twin State Engine
 * Synchronizes physical sensors with virtual twin representations and simulates real-time diurnal physics.
 */

import { WasteBin, Vehicle, OptimizedRoute, SystemNotification, WasteRecord } from '../../types';
import { db, calculateBinStatus } from '../db';
import { aiPredictionService } from './aiPredictionService';

export interface DigitalTwinSnapshot {
  timestamp: string;
  depot: {
    name: string;
    latitude: number;
    longitude: number;
  };
  bins: WasteBin[];
  vehicles: Vehicle[];
  active_routes: OptimizedRoute[];
  system_metrics: {
    total_bins: number;
    critical_bins_count: number;
    high_bins_count: number;
    collecting_vehicles_count: number;
    city_ambient_temp_c: number;
    simulation_speed_multiplier: number;
  };
}

export class DigitalTwinService {
  /**
   * Produce high-fidelity digital twin snapshot representing synchronized city state
   */
  public getSnapshot(): DigitalTwinSnapshot {
    const bins = db.getBins();
    const vehicles = db.getVehicles();
    const routes = db.getRoutes().filter((r) => r.status === 'ACTIVE' || r.status === 'PLANNED');
    const settings = db.getSettings();

    const criticalCount = bins.filter((b) => b.waste_percentage >= settings.threshold_critical).length;
    const highCount = bins.filter(
      (b) => b.waste_percentage >= settings.threshold_medium && b.waste_percentage < settings.threshold_critical
    ).length;
    const collectingVehicles = vehicles.filter((v) => v.status === 'COLLECTING').length;

    return {
      timestamp: new Date().toISOString(),
      depot: {
        name: settings.depot_name,
        latitude: settings.depot_latitude,
        longitude: settings.depot_longitude,
      },
      bins,
      vehicles,
      active_routes: routes,
      system_metrics: {
        total_bins: bins.length,
        critical_bins_count: criticalCount,
        high_bins_count: highCount,
        collecting_vehicles_count: collectingVehicles,
        city_ambient_temp_c: 19.4,
        simulation_speed_multiplier: 1.0,
      },
    };
  }

  /**
   * Advance simulation by elapsed minutes: applies diurnal accumulation curves,
   * vehicle transit physics, and triggers automated alerts.
   */
  public simulateStep(elapsedMinutes = 30): { updatedBins: number; alertsGenerated: number } {
    const bins = db.getBins();
    const settings = db.getSettings();
    const wasteRecords = db.getWasteRecords();
    const notifications = db.getNotifications();
    const vehicles = db.getVehicles();
    const routes = db.getRoutes();

    const currentHour = new Date().getHours();
    let diurnalRate = 1.0;
    if (currentHour >= 11 && currentHour <= 14) diurnalRate = 1.5;
    else if (currentHour >= 18 && currentHour <= 21) diurnalRate = 1.35;
    else if (currentHour >= 1 && currentHour <= 6) diurnalRate = 0.25;

    let alertsGenerated = 0;
    const newNotifications: SystemNotification[] = [];
    const newRecords: WasteRecord[] = [];

    // 1. Advance Bin fill levels
    const updatedBins = bins.map((bin) => {
      // If currently being collected by a route, it gets emptied
      const activeRoute = routes.find((r) => r.status === 'ACTIVE');
      const isBeingCollected =
        activeRoute &&
        activeRoute.stops.some((s) => s.bin_id === bin.bin_id && !s.collected);

      if (isBeingCollected && Math.random() < 0.35) {
        // Empty bin to 5-10%
        const emptiedLevel = Math.round(bin.capacity * 0.08);
        return {
          ...bin,
          current_waste_level: emptiedLevel,
          waste_percentage: 8,
          status: 'LOW' as const,
          last_collection_time: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      // Normal gradual accumulation
      const ratePerHour = bin.waste_type === 'ORGANIC' ? 3.2 : bin.waste_type === 'GENERAL' ? 2.5 : 1.8;
      const pctIncrease = Math.max(
        0.2,
        +((ratePerHour * (elapsedMinutes / 60) * diurnalRate) + (Math.random() * 0.8 - 0.4)).toFixed(1)
      );

      const oldPct = bin.waste_percentage;
      const newPct = Math.min(100, Math.round(oldPct + pctIncrease));
      const newLevel = Math.round((newPct / 100) * bin.capacity);
      const newStatus = calculateBinStatus(newPct, settings);

      // Check alert trigger if crossing into critical/full
      if (oldPct < settings.threshold_critical && newPct >= settings.threshold_critical) {
        newNotifications.push({
          id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          title: 'Critical Fill Level Warning',
          message: `Bin ${bin.bin_id} (${bin.name}) reached ${newPct}%. Overflow risk is critical.`,
          severity: 'CRITICAL',
          category: 'BIN_OVERFLOW',
          related_id: bin.bin_id,
          read: false,
          created_at: new Date().toISOString(),
        });
        alertsGenerated++;
      } else if (oldPct < settings.threshold_high && newPct >= settings.threshold_high) {
        newNotifications.push({
          id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          title: 'High Capacity Alert',
          message: `Bin ${bin.bin_id} (${bin.name}) is now at ${newPct}%. Dispatch required.`,
          severity: 'HIGH',
          category: 'BIN_OVERFLOW',
          related_id: bin.bin_id,
          read: false,
          created_at: new Date().toISOString(),
        });
        alertsGenerated++;
      }

      // Log waste history reading occasionally
      if (Math.random() > 0.4) {
        newRecords.push({
          id: `REC-${bin.bin_id}-${Date.now()}`,
          bin_id: bin.bin_id,
          timestamp: new Date().toISOString(),
          waste_level: newLevel,
          waste_percentage: newPct,
          temperature: +(bin.temperature_c + (Math.random() * 0.4 - 0.2)).toFixed(1),
          rainfall_mm: 0,
          humidity: 65,
          collection_status: newPct >= 95 ? 'OVERFLOW_ALERT' : 'NORMAL',
        });
      }

      return {
        ...bin,
        current_waste_level: newLevel,
        waste_percentage: newPct,
        status: newStatus,
        updated_at: new Date().toISOString(),
      };
    });

    // 2. Advance Vehicle Physics (if collecting on a route, move towards next stop)
    const updatedVehicles = vehicles.map((v) => {
      if (v.status === 'COLLECTING' && v.assigned_route_id) {
        const route = routes.find((r) => r.route_id === v.assigned_route_id);
        if (route && route.stops.length > 0) {
          const nextStop = route.stops.find((s) => !s.collected) || route.stops[0];
          // Nudge vehicle position 20% closer to the target stop
          const newLat = +(v.latitude + (nextStop.latitude - v.latitude) * 0.25).toFixed(6);
          const newLng = +(v.longitude + (nextStop.longitude - v.longitude) * 0.25).toFixed(6);
          // Consume a small fraction of fuel
          const newFuel = Math.max(5, +(v.current_fuel_l - 0.4).toFixed(1));

          return {
            ...v,
            latitude: newLat,
            longitude: newLng,
            current_fuel_l: newFuel,
            updated_at: new Date().toISOString(),
          };
        }
      }
      return v;
    });

    db.setBins(updatedBins);
    db.setVehicles(updatedVehicles);
    if (newNotifications.length > 0) {
      db.setNotifications([...newNotifications, ...notifications]);
    }
    if (newRecords.length > 0) {
      db.setWasteRecords([...wasteRecords, ...newRecords]);
    }

    // Refresh AI predictions automatically if enabled
    if (settings.auto_predict_enabled) {
      aiPredictionService.runBatchPredictions();
    }

    db.save();

    return {
      updatedBins: updatedBins.length,
      alertsGenerated,
    };
  }

  /**
   * Reset simulation state to baseline conditions
   */
  public resetSimulation(): void {
    const settings = db.getSettings();
    const bins = db.getBins().map((b) => ({
      ...b,
      current_waste_level: Math.round(b.capacity * 0.35),
      waste_percentage: 35,
      status: calculateBinStatus(35, settings),
      updated_at: new Date().toISOString(),
    }));

    const vehicles = db.getVehicles().map((v) => ({
      ...v,
      status: 'AVAILABLE' as const,
      current_load_kg: 0,
      latitude: settings.depot_latitude,
      longitude: settings.depot_longitude,
      assigned_route_id: null,
      updated_at: new Date().toISOString(),
    }));

    db.setBins(bins);
    db.setVehicles(vehicles);
    aiPredictionService.runBatchPredictions();
    db.save();
  }
}

export const digitalTwinService = new DigitalTwinService();
