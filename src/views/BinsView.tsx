import React, { useEffect, useState } from 'react';
import {
  Trash2,
  Search,
  Plus,
  Filter,
  ArrowUpDown,
  Eye,
  Edit2,
  Trash,
  Battery,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { WasteBin, UserRole } from '../types';
import { BinDetailModal } from './BinDetailModal';

interface BinsViewProps {
  userRole?: UserRole;
}

export const BinsView: React.FC<BinsViewProps> = ({ userRole = 'ADMIN' }) => {
  const [bins, setBins] = useState<WasteBin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('waste_percentage');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

  const [inspectBinId, setInspectBinId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBin, setNewBin] = useState({
    name: '',
    location_name: '',
    latitude: 37.7780,
    longitude: -122.4180,
    capacity: 1100,
    waste_type: 'GENERAL',
  });

  const fetchBins = async () => {
    try {
      setLoading(true);
      const res = await api.getBins({
        search: search || undefined,
        status: statusFilter || undefined,
        waste_type: typeFilter || undefined,
        sort_by: sortBy,
        order,
      });
      setBins(res.data);
    } catch (err) {
      console.error('Failed to load bins:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBins();
  }, [search, statusFilter, typeFilter, sortBy, order]);

  const handleCreateBin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createBin({
        ...newBin,
        waste_type: newBin.waste_type as any,
      });
      setShowAddModal(false);
      setNewBin({
        name: '',
        location_name: '',
        latitude: 37.7780,
        longitude: -122.4180,
        capacity: 1100,
        waste_type: 'GENERAL',
      });
      fetchBins();
    } catch (err: any) {
      alert('Failed to create bin: ' + err.message);
    }
  };

  const handleDeleteBin = async (id: string) => {
    if (!confirm(`Are you sure you want to decommission bin ${id}?`)) return;
    try {
      await api.deleteBin(id);
      fetchBins();
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header with Title and Add Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Smart Waste Bins Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitoring, telemetric telemetry, and capacity management across active metropolitan bins.
          </p>
        </div>

        {userRole === 'ADMIN' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2.5 rounded-2xl shadow-lg shadow-emerald-950/60 transition-all text-xs active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Deploy New Bin</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by Bin ID, Name, or District..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="LOW">Low (&lt;30%)</option>
            <option value="MEDIUM">Medium (31-70%)</option>
            <option value="HIGH">High (71-85%)</option>
            <option value="FULL">Critical/Full (&gt;85%)</option>
          </select>

          {/* Waste Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Streams</option>
            <option value="ORGANIC">Organic</option>
            <option value="RECYCLABLE">Recyclable</option>
            <option value="GENERAL">General</option>
            <option value="HAZARDOUS">Hazardous</option>
            <option value="ELECTRONIC">Electronic</option>
          </select>

          {/* Sort Order Toggle */}
          <button
            onClick={() => setOrder(order === 'desc' ? 'asc' : 'desc')}
            className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 hover:text-white"
            title="Toggle sort direction"
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bins Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Bin ID</th>
                <th className="py-3.5 px-4">Asset Name & Location</th>
                <th className="py-3.5 px-4">Stream</th>
                <th className="py-3.5 px-4">Fill Percentage</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Battery</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <span className="inline-block w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mr-2" />
                    Loading bins database...
                  </td>
                </tr>
              ) : bins.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No bins found matching current filter parameters.
                  </td>
                </tr>
              ) : (
                bins.map((bin) => {
                  let statusBg = 'bg-emerald-950/70 text-emerald-300 border-emerald-800/60';
                  if (bin.status === 'FULL' || bin.waste_percentage >= 85) {
                    statusBg = 'bg-rose-950/80 text-rose-300 border-rose-800/80 animate-pulse';
                  } else if (bin.status === 'HIGH') {
                    statusBg = 'bg-orange-950/70 text-orange-300 border-orange-800/60';
                  } else if (bin.status === 'MEDIUM') {
                    statusBg = 'bg-amber-950/70 text-amber-300 border-amber-800/60';
                  }

                  return (
                    <tr key={bin.bin_id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-white">{bin.bin_id}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200">{bin.name}</div>
                        <div className="text-[11px] text-slate-400">{bin.location_name}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-medium border border-slate-700">
                          {bin.waste_type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                            <div
                              className={`h-full rounded-full ${
                                bin.waste_percentage >= 85
                                  ? 'bg-rose-500'
                                  : bin.waste_percentage >= 70
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${bin.waste_percentage}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-200">{bin.waste_percentage}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase ${statusBg}`}>
                          {bin.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Battery className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{bin.battery_level}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setInspectBinId(bin.bin_id)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
                            title="Inspect Telemetry & Ingest Sensor Data"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {userRole === 'ADMIN' && (
                            <button
                              onClick={() => handleDeleteBin(bin.bin_id)}
                              className="p-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded-lg transition-colors"
                              title="Decommission Bin"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect / Telemetry Modal */}
      {inspectBinId && (
        <BinDetailModal
          binId={inspectBinId}
          onClose={() => setInspectBinId(null)}
          onUpdated={fetchBins}
        />
      )}

      {/* Add Bin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold text-white">Deploy New Smart Bin</h2>
            <form onSubmit={handleCreateBin} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Asset Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Waterfront North EcoStation"
                  value={newBin.name}
                  onChange={(e) => setNewBin({ ...newBin, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Location District</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marina Blvd & Scott St"
                  value={newBin.location_name}
                  onChange={(e) => setNewBin({ ...newBin, location_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={newBin.latitude}
                    onChange={(e) => setNewBin({ ...newBin, latitude: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={newBin.longitude}
                    onChange={(e) => setNewBin({ ...newBin, longitude: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Capacity (L)</label>
                  <input
                    type="number"
                    required
                    value={newBin.capacity}
                    onChange={(e) => setNewBin({ ...newBin, capacity: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Waste Stream</label>
                  <select
                    value={newBin.waste_type}
                    onChange={(e) => setNewBin({ ...newBin, waste_type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="GENERAL">General</option>
                    <option value="ORGANIC">Organic</option>
                    <option value="RECYCLABLE">Recyclable</option>
                    <option value="HAZARDOUS">Hazardous</option>
                    <option value="ELECTRONIC">Electronic</option>
                  </select>
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
                  Deploy Bin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
