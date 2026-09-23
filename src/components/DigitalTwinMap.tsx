import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { WasteBin, Vehicle, OptimizedRoute } from '../types';

interface DigitalTwinMapProps {
  bins: WasteBin[];
  vehicles: Vehicle[];
  activeRoute?: OptimizedRoute | null;
  depot: { name: string; latitude: number; longitude: number };
  onSelectBin?: (bin: WasteBin) => void;
  onSelectVehicle?: (vehicle: Vehicle) => void;
  selectedBinId?: string | null;
  selectedVehicleId?: string | null;
  height?: string;
}

export const DigitalTwinMap: React.FC<DigitalTwinMapProps> = ({
  bins,
  vehicles,
  activeRoute,
  depot,
  onSelectBin,
  onSelectVehicle,
  selectedBinId,
  selectedVehicleId,
  height = '600px',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Initialize map centered around depot or central bins
      const map = L.map(mapContainerRef.current, {
        center: [depot.latitude || 37.7749, depot.longitude || -122.4194],
        zoom: 13,
        zoomControl: true,
      });

      // CartoDB Dark Matter tiles for professional environmental dark UI
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers and route polyline when data changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    // 1. Depot Marker
    const depotIconHtml = `
      <div style="background:#8b5cf6; width:34px; height:34px; border-radius:10px; border:2px solid #fff; display:flex; align-items:center; justify-content:center; box-shadow:0 0 16px rgba(139,92,246,0.6); color:white; font-size:16px;">
        🏛️
      </div>
    `;
    const depotMarker = L.marker([depot.latitude, depot.longitude], {
      icon: L.divIcon({
        className: 'custom-depot-marker',
        html: depotIconHtml,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      }),
    });
    depotMarker.bindPopup(`
      <div style="color:#0f172a; font-family:sans-serif; padding:4px;">
        <strong style="font-size:13px; color:#4c1d95;">${depot.name}</strong>
        <div style="font-size:11px; margin-top:2px; color:#64748b;">Central Fleet Dispatch & Resource Recovery</div>
      </div>
    `);
    markersGroup.addLayer(depotMarker);

    // 2. Bin Markers
    bins.forEach((bin) => {
      const isSelected = selectedBinId === bin.bin_id;
      let bg = '#10b981'; // LOW = emerald
      let pulseClass = '';

      if (bin.status === 'FULL' || bin.waste_percentage >= 95) {
        bg = '#ef4444'; // Red
        pulseClass = 'animate-pulse';
      } else if (bin.status === 'HIGH' || bin.waste_percentage >= 75) {
        bg = '#f97316'; // Orange
      } else if (bin.status === 'MEDIUM' || bin.waste_percentage >= 35) {
        bg = '#eab308'; // Amber
      }

      const binHtml = `
        <div style="
          position:relative;
          background:${bg};
          width:${isSelected ? '32px' : '26px'};
          height:${isSelected ? '32px' : '26px'};
          border-radius:50%;
          border:2.5px solid ${isSelected ? '#38bdf8' : '#ffffff'};
          display:flex;
          align-items:center;
          justify-content:center;
          box-shadow:0 0 ${isSelected ? '16px #38bdf8' : '8px rgba(0,0,0,0.5)'};
          color:white;
          font-weight:bold;
          font-size:${isSelected ? '11px' : '10px'};
          cursor:pointer;
          transition: transform 0.2s;
        " class="${pulseClass}">
          ${bin.waste_percentage}
        </div>
      `;

      const marker = L.marker([bin.latitude, bin.longitude], {
        icon: L.divIcon({
          className: 'custom-bin-marker',
          html: binHtml,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        }),
      });

      marker.on('click', () => {
        if (onSelectBin) onSelectBin(bin);
      });

      marker.bindTooltip(`
        <div style="font-family:sans-serif; font-size:12px; font-weight:600;">
          <span>${bin.bin_id}: ${bin.name}</span><br/>
          <span style="color:${bg};">${bin.waste_percentage}% Fill (${bin.status})</span>
        </div>
      `);

      markersGroup.addLayer(marker);
    });

    // 3. Vehicle Markers
    vehicles.forEach((vehicle) => {
      const isSelected = selectedVehicleId === vehicle.vehicle_id;
      const isCollecting = vehicle.status === 'COLLECTING';

      const vehicleHtml = `
        <div style="
          background:${isCollecting ? '#06b6d4' : '#3b82f6'};
          width:${isSelected ? '34px' : '28px'};
          height:${isSelected ? '34px' : '28px'};
          border-radius:8px;
          border:2px solid ${isSelected ? '#fbbf24' : '#ffffff'};
          display:flex;
          align-items:center;
          justify-content:center;
          box-shadow:0 0 12px rgba(6,182,212,0.7);
          color:white;
          font-size:14px;
          cursor:pointer;
        ">
          🚛
        </div>
      `;

      const marker = L.marker([vehicle.latitude, vehicle.longitude], {
        icon: L.divIcon({
          className: 'custom-vehicle-marker',
          html: vehicleHtml,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        }),
      });

      marker.on('click', () => {
        if (onSelectVehicle) onSelectVehicle(vehicle);
      });

      marker.bindTooltip(`
        <div style="font-family:sans-serif; font-size:12px;">
          <strong>${vehicle.vehicle_id} (${vehicle.registration_number})</strong><br/>
          <span>Status: ${vehicle.status}</span><br/>
          <span>Fuel: ${vehicle.current_fuel_l}L / ${vehicle.fuel_capacity_l}L</span>
        </div>
      `);

      markersGroup.addLayer(marker);
    });

    // 4. Render Active Route Polyline
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    if (activeRoute && activeRoute.stops && activeRoute.stops.length > 0) {
      const latLngs: [number, number][] = [
        [depot.latitude, depot.longitude],
        ...activeRoute.stops.map((s) => [s.latitude, s.longitude] as [number, number]),
        [depot.latitude, depot.longitude],
      ];

      const polyline = L.polyline(latLngs, {
        color: '#10b981',
        weight: 3.5,
        opacity: 0.85,
        dashArray: '6, 8',
      }).addTo(map);

      routeLayerRef.current = polyline;
    }
  }, [bins, vehicles, activeRoute, depot, selectedBinId, selectedVehicleId, onSelectBin, onSelectVehicle]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
      <div ref={mapContainerRef} style={{ width: '100%', height }} />

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-[400] bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-3 text-xs shadow-xl space-y-1.5 pointer-events-auto">
        <div className="font-semibold text-slate-200 text-[11px] uppercase tracking-wider mb-1">GIS Digital Twin</div>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
          <span>Low Waste (&lt;30%)</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
          <span>Medium (31-70%)</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-3 h-3 rounded-full bg-orange-500 inline-block" />
          <span>High (71-85%)</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse inline-block" />
          <span>Critical / Full (&gt;85%)</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300 pt-1 border-t border-slate-800">
          <span className="text-sm">🚛</span>
          <span>Active Fleet Unit</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="text-sm">🏛️</span>
          <span>Central EcoDepot</span>
        </div>
      </div>
    </div>
  );
};
