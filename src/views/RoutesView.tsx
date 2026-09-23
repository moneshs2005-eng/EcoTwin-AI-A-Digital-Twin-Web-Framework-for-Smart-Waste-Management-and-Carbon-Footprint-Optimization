import React, { useEffect, useState } from 'react';
import {
  Route as RouteIcon,
  Play,
  TrendingDown,
  Fuel,
  Leaf,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  ChevronRight,
  ArrowRight,
  Truck,
} from 'lucide-react';
import { DigitalTwinMap } from '../components/DigitalTwinMap';
import { api } from '../services/api';
import { OptimizedRoute, Vehicle, WasteBin } from '../types';

export const RoutesView: React.FC = () => {
  const [routes, setRoutes] = useState<OptimizedRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<OptimizedRoute | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [bins, setBins] = useState<WasteBin[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');

  const loadRouteData = async () => {
    try {
      setLoading(true);
      const [routeRes, vehRes, binRes] = await Promise.all([
        api.getRoutes(),
        api.getVehicles(),
        api.getBins(),
      ]);
      setRoutes(routeRes.data);
      if (routeRes.data.length > 0) {
        setSelectedRoute(routeRes.data[0]);
      }
      setVehicles(vehRes.data);
      setBins(binRes.data);
      if (vehRes.data.length > 0) {
        setSelectedVehicleId(vehRes.data[0].vehicle_id);
      }
    } catch (err) {
      console.error('Failed to load routes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRouteData();
  }, []);

  const handleGenerateRoute = async () => {
    try {
      setIsOptimizing(true);
      const res = await api.optimizeRoute({
        vehicle_id: selectedVehicleId || undefined,
      });
      setRoutes([res.data, ...routes]);
      setSelectedRoute(res.data);
    } catch (err: any) {
      alert('Route optimization error: ' + err.message);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleToggleStopCollected = async (stopNumber: number) => {
    if (!selectedRoute) return;
    const updatedStops = selectedRoute.stops.map((s) =>
      s.stop_number === stopNumber ? { ...s, collected: !s.collected } : s
    );
    const isAllDone = updatedStops.every((s) => s.collected);
    const updatedRoute: OptimizedRoute = {
      ...selectedRoute,
      stops: updatedStops,
      status: isAllDone ? 'COMPLETED' : 'ACTIVE',
    };
    setSelectedRoute(updatedRoute);
    if (isAllDone) {
      await api.updateRouteStatus(selectedRoute.route_id, 'COMPLETED');
    }
  };

  if (loading && !selectedRoute) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Loading CVRP Route Optimization Engine...</p>
        </div>
      </div>
    );
  }

  const routeBins = selectedRoute
    ? bins.filter((b) => selectedRoute.stops.some((s) => s.bin_id === b.bin_id))
    : bins;

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Optimization Dispatch Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <RouteIcon className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Dynamic Route Optimization (CVRP & 2-Opt)</h1>
          </div>
          <p className="text-xs text-slate-400">
            Heuristic vehicle routing prioritizing high-risk bins to minimize travel distance, fuel burn, and CO2.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Select vehicle */}
          <select
            value={selectedVehicleId}
            onChange={(e) => setSelectedVehicleId(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            {vehicles.map((v) => (
              <option key={v.vehicle_id} value={v.vehicle_id}>
                {v.vehicle_id} ({v.registration_number}) - {v.status}
              </option>
            ))}
          </select>

          <button
            onClick={handleGenerateRoute}
            disabled={isOptimizing}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-950/60 transition-all text-xs active:scale-95 disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 fill-white ${isOptimizing ? 'animate-spin' : ''}`} />
            <span>{isOptimizing ? 'Running Heuristic...' : 'Compute Optimized Tour'}</span>
          </button>
        </div>
      </div>

      {selectedRoute && (
        <>
          {/* Baseline vs. Optimized Route Comparison Card */}
          <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-emerald-900/50 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Baseline vs. Optimized Route Performance Comparison
                </h2>
              </div>
              <div className="px-3 py-1 bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 font-bold text-xs rounded-full">
                {selectedRoute.savings_percentage}% Total Efficiency Gain
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Distance Comparison */}
              <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <TrendingDown className="w-4 h-4 text-emerald-400" />
                    Distance Traveled
                  </span>
                  <span className="text-emerald-400 font-bold">-{selectedRoute.distance_saved_km} km</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-bold text-white">{selectedRoute.total_distance_km}</span>
                    <span className="text-xs text-slate-400 ml-1">km (Optimized)</span>
                  </div>
                  <div className="text-right text-xs text-slate-500 line-through">
                    {selectedRoute.baseline_distance_km} km
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">Eliminates zigzagging across city sectors</p>
              </div>

              {/* Fuel Comparison */}
              <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Fuel className="w-4 h-4 text-teal-400" />
                    Diesel Consumed
                  </span>
                  <span className="text-teal-400 font-bold">-{selectedRoute.fuel_saved_l} L</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-bold text-teal-400">{selectedRoute.optimized_fuel_l}</span>
                    <span className="text-xs text-slate-400 ml-1">L (Optimized)</span>
                  </div>
                  <div className="text-right text-xs text-slate-500 line-through">
                    {selectedRoute.baseline_fuel_l} L
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">Calculated via fleet compactor consumption curve</p>
              </div>

              {/* CO2 Emissions Comparison */}
              <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Leaf className="w-4 h-4 text-emerald-400" />
                    CO2 GHG Output
                  </span>
                  <span className="text-emerald-400 font-bold">-{selectedRoute.co2_saved_kg} kg</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-bold text-emerald-400">{selectedRoute.optimized_co2_kg}</span>
                    <span className="text-xs text-slate-400 ml-1">kg CO2</span>
                  </div>
                  <div className="text-right text-xs text-slate-500 line-through">
                    {selectedRoute.baseline_co2_kg} kg
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">DEFRA standard emission factor (2.68 kg/L)</p>
              </div>
            </div>
          </div>

          {/* Map and Manifest Two-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* GIS Map with Polyline */}
            <div className="lg:col-span-2 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300 pb-1">
                <span className="font-semibold">Optimized Circuit Polyline (Depot ➔ Stops ➔ Depot)</span>
                <span className="font-mono text-slate-500">Route ID: {selectedRoute.route_id}</span>
              </div>

              <DigitalTwinMap
                bins={routeBins}
                vehicles={vehicles.filter((v) => v.vehicle_id === selectedRoute.vehicle_id)}
                activeRoute={selectedRoute}
                depot={selectedRoute.depot_location}
                height="540px"
              />
            </div>

            {/* Turn-by-Turn Manifest */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white">Driver Collection Manifest</h3>
                  <p className="text-xs text-slate-400">{selectedRoute.stops.length} Bins Scheduled</p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>~{selectedRoute.estimated_time_minutes} mins</span>
                  </div>
                  <div className="text-[10px] text-slate-500">{selectedRoute.total_waste_collected_kg} kg payload</div>
                </div>
              </div>

              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                {/* Depot Start */}
                <div className="p-3 bg-purple-950/30 border border-purple-800/40 rounded-2xl flex items-center gap-3 text-xs">
                  <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-[10px]">
                    0
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-purple-200">{selectedRoute.depot_location.name}</div>
                    <div className="text-[10px] text-purple-400/80">Vehicle Departure & Weigh Station</div>
                  </div>
                </div>

                {/* Individual Stops */}
                {selectedRoute.stops.map((stop) => (
                  <div
                    key={stop.stop_number}
                    className={`p-3 rounded-2xl border transition-colors flex items-center justify-between text-xs ${
                      stop.collected
                        ? 'bg-slate-950/40 border-slate-800/40 opacity-60'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">
                        {stop.stop_number}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-200">
                          {stop.bin_id}: {stop.name}
                        </div>
                        <div className="text-[10px] text-slate-400">{stop.location_name}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right text-[11px]">
                        <span className="font-bold text-amber-400">{stop.waste_level_pct}%</span>
                        <div className="text-[9px] text-slate-500">{stop.waste_kg} kg</div>
                      </div>
                      <button
                        onClick={() => handleToggleStopCollected(stop.stop_number)}
                        className={`p-1.5 rounded-lg border text-xs transition-colors ${
                          stop.collected
                            ? 'bg-emerald-600 border-emerald-500 text-white'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                        title={stop.collected ? 'Mark as Uncollected' : 'Mark as Picked Up'}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Depot Return */}
                <div className="p-3 bg-purple-950/30 border border-purple-800/40 rounded-2xl flex items-center gap-3 text-xs">
                  <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-[10px]">
                    🏁
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-purple-200">{selectedRoute.depot_location.name}</div>
                    <div className="text-[10px] text-purple-400/80">Recycling Recovery & Material Deposit</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
