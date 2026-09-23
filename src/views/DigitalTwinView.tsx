import React, { useEffect, useState } from 'react';
import {
  Activity,
  Trash2,
  Truck,
  Battery,
  Thermometer,
  Calendar,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Info,
  X,
  Compass,
  CheckCircle,
} from 'lucide-react';
import { DigitalTwinMap } from '../components/DigitalTwinMap';
import { api } from '../services/api';
import { WasteBin, Vehicle, OptimizedRoute } from '../types';

interface DigitalTwinViewProps {
  onSimulateTick: () => Promise<void>;
  isSimulating: boolean;
}

export const DigitalTwinView: React.FC<DigitalTwinViewProps> = ({
  onSimulateTick,
  isSimulating,
}) => {
  const [snapshot, setSnapshot] = useState<any | null>(null);
  const [selectedBin, setSelectedBin] = useState<WasteBin | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('ALL');

  const loadTwinState = async () => {
    try {
      setLoading(true);
      const res = await api.getDigitalTwinSnapshot();
      setSnapshot(res.data);
      // Select first high-risk bin by default for immediate inspection
      const critical = res.data.bins.find((b: WasteBin) => b.waste_percentage >= 85) || res.data.bins[0];
      setSelectedBin(critical || null);
    } catch (err) {
      console.error('Error fetching digital twin snapshot:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTwinState();
  }, []);

  const handleEmptyBin = async (bin: WasteBin) => {
    try {
      await api.updateBin(bin.bin_id, {
        waste_percentage: 5,
        current_waste_level: Math.round(bin.capacity * 0.05),
      });
      await loadTwinState();
      setSelectedBin({ ...bin, waste_percentage: 5, current_waste_level: Math.round(bin.capacity * 0.05) });
    } catch (err: any) {
      alert('Failed to update bin: ' + err.message);
    }
  };

  const handleAdjustFill = async (bin: WasteBin, newPct: number) => {
    try {
      const pct = Math.max(0, Math.min(100, newPct));
      await api.updateBin(bin.bin_id, {
        waste_percentage: pct,
        current_waste_level: Math.round((pct / 100) * bin.capacity),
      });
      await loadTwinState();
      setSelectedBin({ ...bin, waste_percentage: pct, current_waste_level: Math.round((pct / 100) * bin.capacity) });
    } catch (err: any) {
      alert('Failed to adjust level: ' + err.message);
    }
  };

  if (loading && !snapshot) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Synchronizing Digital Twin GIS Telemetry...</p>
        </div>
      </div>
    );
  }

  const filteredBins: WasteBin[] = (snapshot?.bins || []).filter((b: WasteBin) => {
    if (filterType === 'CRITICAL') return b.waste_percentage >= 85;
    if (filterType === 'ORGANIC') return b.waste_type === 'ORGANIC';
    if (filterType === 'RECYCLABLE') return b.waste_type === 'RECYCLABLE';
    if (filterType === 'GENERAL') return b.waste_type === 'GENERAL';
    return true;
  });

  const activeRoute = snapshot?.active_routes?.[0] || null;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Digital Twin Sync Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <h1 className="text-xl sm:text-2xl font-bold text-white">Digital Twin Spatial Command</h1>
          </div>
          <p className="text-xs text-slate-400">
            Bidirectional state mirror between physical city assets and virtual telemetry twin.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Filter Buttons */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
            {['ALL', 'CRITICAL', 'ORGANIC', 'RECYCLABLE'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
                  filterType === type
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <button
            onClick={async () => {
              await onSimulateTick();
              await loadTwinState();
            }}
            disabled={isSimulating}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 fill-emerald-400 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>Step Simulator (+30m)</span>
          </button>
        </div>
      </div>

      {/* Main Twin Layout: Map + Inspector Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Interactive Map Viewport */}
        <div className="lg:col-span-2 space-y-3">
          <DigitalTwinMap
            bins={filteredBins}
            vehicles={snapshot?.vehicles || []}
            activeRoute={activeRoute}
            depot={snapshot?.depot || { name: 'EcoDepot', latitude: 37.7749, longitude: -122.4194 }}
            selectedBinId={selectedBin?.bin_id}
            selectedVehicleId={selectedVehicle?.vehicle_id}
            onSelectBin={(bin) => {
              setSelectedBin(bin);
              setSelectedVehicle(null);
            }}
            onSelectVehicle={(veh) => {
              setSelectedVehicle(veh);
              setSelectedBin(null);
            }}
            height="620px"
          />

          <div className="flex items-center justify-between text-xs text-slate-400 px-2">
            <span>Click any marker on the map to inspect live twin state.</span>
            <span className="font-mono text-[11px] text-slate-500">
              Synced: {new Date(snapshot?.timestamp || Date.now()).toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Digital Twin Inspector Panel */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-5">
          {selectedBin ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{selectedBin.bin_id}</h3>
                    <p className="text-xs text-slate-400">{selectedBin.name}</p>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase ${
                    selectedBin.status === 'FULL' || selectedBin.waste_percentage >= 85
                      ? 'bg-rose-950/80 text-rose-300 border border-rose-800/80'
                      : selectedBin.status === 'HIGH'
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-800/80'
                      : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80'
                  }`}
                >
                  {selectedBin.status}
                </span>
              </div>

              {/* Waste Fill Visual Gauge */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Fill Level Gauge</span>
                  <span className="text-sm font-bold text-white">{selectedBin.waste_percentage}%</span>
                </div>

                <div className="w-full h-4 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      selectedBin.waste_percentage >= 85
                        ? 'bg-rose-500'
                        : selectedBin.waste_percentage >= 70
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${selectedBin.waste_percentage}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Current: {selectedBin.current_waste_level}L</span>
                  <span>Max Capacity: {selectedBin.capacity}L</span>
                </div>
              </div>

              {/* Sensor Telemetry Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Battery className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Battery</span>
                  </div>
                  <div className="text-base font-bold text-slate-200">{selectedBin.battery_level}%</div>
                  <div className="text-[10px] text-emerald-400">Sensor Nominal</div>
                </div>

                <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                    <span>Internal Temp</span>
                  </div>
                  <div className="text-base font-bold text-slate-200">{selectedBin.temperature_c}°C</div>
                  <div className="text-[10px] text-slate-400">Ambient Normal</div>
                </div>

                <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-1">
                  <span className="text-slate-400">Waste Type</span>
                  <div className="text-sm font-bold text-emerald-400">{selectedBin.waste_type}</div>
                  <div className="text-[10px] text-slate-500">Dedicated Stream</div>
                </div>

                <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-1">
                  <span className="text-slate-400">Last Collection</span>
                  <div className="text-xs font-semibold text-slate-300">
                    {new Date(selectedBin.last_collection_time).toLocaleDateString()}
                  </div>
                  <div className="text-[10px] text-slate-500">Scheduled</div>
                </div>
              </div>

              {/* Location Details */}
              <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl text-xs space-y-1.5">
                <div className="font-semibold text-slate-300">Geodetic Location</div>
                <div className="text-slate-400">{selectedBin.location_name}</div>
                <div className="font-mono text-[11px] text-slate-500">
                  {selectedBin.latitude.toFixed(5)}, {selectedBin.longitude.toFixed(5)}
                </div>
              </div>

              {/* Interactive Twin Mutation Controls */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-slate-300">Digital Twin Interactive Actions</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleEmptyBin(selectedBin)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors text-center"
                  >
                    Simulate Empty (5%)
                  </button>
                  <button
                    onClick={() => handleAdjustFill(selectedBin, selectedBin.waste_percentage + 15)}
                    className="px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold border border-emerald-500/30 rounded-xl transition-colors text-center"
                  >
                    Add Waste (+15%)
                  </button>
                </div>
              </div>
            </div>
          ) : selectedVehicle ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{selectedVehicle.vehicle_id}</h3>
                    <p className="text-xs text-slate-400">{selectedVehicle.registration_number}</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 text-[10px] font-bold rounded-lg uppercase">
                  {selectedVehicle.status}
                </span>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Fuel Reserve</span>
                    <span className="font-bold text-white">
                      {selectedVehicle.current_fuel_l}L / {selectedVehicle.fuel_capacity_l}L
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div
                      className="h-full rounded-full bg-cyan-500"
                      style={{
                        width: `${(selectedVehicle.current_fuel_l / selectedVehicle.fuel_capacity_l) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl">
                    <span className="text-slate-400">Vehicle Type</span>
                    <div className="font-bold text-slate-200 mt-1">{selectedVehicle.vehicle_type}</div>
                  </div>
                  <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl">
                    <span className="text-slate-400">Max Payload</span>
                    <div className="font-bold text-slate-200 mt-1">{selectedVehicle.capacity_kg} kg</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              Select any marker on the map to inspect telemetry and simulation parameters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
