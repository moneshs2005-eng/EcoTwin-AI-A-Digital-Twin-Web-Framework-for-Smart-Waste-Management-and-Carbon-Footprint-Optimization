import React, { useEffect, useState } from 'react';
import {
  Truck,
  Plus,
  Fuel,
  Weight,
  Gauge,
  MapPin,
  CheckCircle,
  Wrench,
  PowerOff,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { Vehicle, UserRole } from '../types';

interface VehiclesViewProps {
  userRole?: UserRole;
}

export const VehiclesView: React.FC<VehiclesViewProps> = ({ userRole = 'ADMIN' }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    registration_number: '',
    vehicle_type: 'COMPACTOR_TRUCK',
    capacity_kg: 8500,
    fuel_capacity_l: 180,
    fuel_efficiency_km_per_l: 3.8,
  });

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await api.getVehicles();
      setVehicles(res.data);
    } catch (err) {
      console.error('Failed to load vehicles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleUpdateStatus = async (vehicleId: string, status: any) => {
    try {
      await api.updateVehicle(vehicleId, { status });
      fetchVehicles();
    } catch (err: any) {
      alert('Status update failed: ' + err.message);
    }
  };

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createVehicle(newVehicle as any);
      setShowAddModal(false);
      setNewVehicle({
        registration_number: '',
        vehicle_type: 'COMPACTOR_TRUCK',
        capacity_kg: 8500,
        fuel_capacity_l: 180,
        fuel_efficiency_km_per_l: 3.8,
      });
      fetchVehicles();
    } catch (err: any) {
      alert('Failed to add vehicle: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Collection Fleet Operations</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time tracking of fuel levels, payload capacity, and route assignments.
          </p>
        </div>

        {userRole === 'ADMIN' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2.5 rounded-2xl shadow-lg shadow-emerald-950/60 transition-all text-xs active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Vehicle</span>
          </button>
        )}
      </div>

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 text-center py-12 text-slate-400">
            <span className="inline-block w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mr-2" />
            Loading municipal fleet...
          </div>
        ) : (
          vehicles.map((v) => {
            const fuelPct = Math.round((v.current_fuel_l / v.fuel_capacity_l) * 100);
            const loadPct = Math.round((v.current_load_kg / v.capacity_kg) * 100);

            let statusColor = 'bg-emerald-950 text-emerald-300 border-emerald-800';
            if (v.status === 'COLLECTING') statusColor = 'bg-cyan-950 text-cyan-300 border-cyan-800';
            if (v.status === 'MAINTENANCE') statusColor = 'bg-amber-950 text-amber-300 border-amber-800';
            if (v.status === 'OFFLINE') statusColor = 'bg-slate-800 text-slate-400 border-slate-700';

            return (
              <div
                key={v.vehicle_id}
                className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-lg hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                      <Truck className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-base">{v.vehicle_id}</span>
                        <span className="text-xs text-slate-400 font-mono">({v.registration_number})</span>
                      </div>
                      <p className="text-xs text-slate-400 capitalize">{v.vehicle_type.replace('_', ' ').toLowerCase()}</p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border uppercase ${statusColor}`}>
                    {v.status}
                  </span>
                </div>

                {/* Telemetry Gauges */}
                <div className="space-y-4 text-xs">
                  {/* Fuel Reserve */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Fuel className="w-3.5 h-3.5 text-teal-400" />
                        Fuel / Battery Reserve
                      </span>
                      <span className="font-bold text-white">
                        {v.current_fuel_l}L / {v.fuel_capacity_l}L ({fuelPct}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full rounded-full transition-all ${
                          fuelPct < 25 ? 'bg-rose-500' : fuelPct < 50 ? 'bg-amber-500' : 'bg-teal-500'
                        }`}
                        style={{ width: `${fuelPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Load Capacity */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Weight className="w-3.5 h-3.5 text-cyan-400" />
                        Payload Utilization
                      </span>
                      <span className="font-bold text-white">
                        {v.current_load_kg} kg / {v.capacity_kg} kg ({loadPct}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full rounded-full bg-cyan-500 transition-all"
                        style={{ width: `${loadPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Efficiency & Specs Grid */}
                <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80">
                    <div className="text-[10px] text-slate-500">Efficiency</div>
                    <div className="font-bold text-slate-200 mt-0.5">{v.fuel_efficiency_km_per_l} km/L</div>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80">
                    <div className="text-[10px] text-slate-500">Emission Factor</div>
                    <div className="font-bold text-emerald-400 mt-0.5">{v.emission_factor_kg_per_l} kg/L</div>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80">
                    <div className="text-[10px] text-slate-500">Route Link</div>
                    <div className="font-semibold text-slate-300 mt-0.5 truncate">
                      {v.assigned_route_id || 'Unassigned'}
                    </div>
                  </div>
                </div>

                {/* Action controls */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Operational Status:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleUpdateStatus(v.vehicle_id, 'AVAILABLE')}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                        v.status === 'AVAILABLE'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Available
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(v.vehicle_id, 'MAINTENANCE')}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                        v.status === 'MAINTENANCE'
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Maintenance
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Vehicle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold text-white">Register Municipal Vehicle</h2>
            <form onSubmit={handleCreateVehicle} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Registration Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ECO-TRK-882"
                  value={newVehicle.registration_number}
                  onChange={(e) => setNewVehicle({ ...newVehicle, registration_number: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Vehicle Classification</label>
                <select
                  value={newVehicle.vehicle_type}
                  onChange={(e) => setNewVehicle({ ...newVehicle, vehicle_type: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="COMPACTOR_TRUCK">Compactor Truck (Heavy)</option>
                  <option value="ELECTRIC_VAN">Electric / Hybrid Van</option>
                  <option value="STANDARD_TRUCK">Standard Collector</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Capacity (kg)</label>
                  <input
                    type="number"
                    required
                    value={newVehicle.capacity_kg}
                    onChange={(e) => setNewVehicle({ ...newVehicle, capacity_kg: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Fuel Cap (L)</label>
                  <input
                    type="number"
                    required
                    value={newVehicle.fuel_capacity_l}
                    onChange={(e) => setNewVehicle({ ...newVehicle, fuel_capacity_l: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors shadow-md"
                >
                  Register Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
