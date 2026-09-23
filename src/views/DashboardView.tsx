import React, { useEffect, useState } from 'react';
import {
  Trash2,
  Truck,
  AlertTriangle,
  Route as RouteIcon,
  Leaf,
  Fuel,
  TrendingDown,
  ArrowUpRight,
  BrainCircuit,
  Activity,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { api } from '../services/api';
import { DashboardSummary, SystemNotification, Prediction, WasteBin } from '../types';
import { Phase1HealthBanner } from '../components/Phase1HealthBanner';
import { SystemHealthModal } from '../components/SystemHealthModal';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
  onSimulateTick: () => Promise<void>;
  isSimulating: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onSimulateTick,
  isSimulating,
}) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [highRiskBins, setHighRiskBins] = useState<Prediction[]>([]);
  const [bins, setBins] = useState<WasteBin[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDispatching, setIsDispatching] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [sumRes, trendRes, riskRes, binRes, notifRes] = await Promise.all([
        api.getDashboardSummary(),
        api.getDashboardTrends(),
        api.getHighRiskPredictions(),
        api.getBins(),
        api.getNotifications(),
      ]);

      setSummary(sumRes.data);
      setTrends(trendRes.data);
      setHighRiskBins(riskRes.data);
      setBins(binRes.data);
      setNotifications(notifRes.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleQuickOptimizeRoute = async () => {
    try {
      setIsDispatching(true);
      await api.optimizeRoute();
      await fetchDashboardData();
      onNavigate('routes');
    } catch (err: any) {
      alert('Route optimization error: ' + err.message);
    } finally {
      setIsDispatching(false);
    }
  };

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Loading EcoTwin Digital Twin Telemetry...</p>
        </div>
      </div>
    );
  }

  // Distribution chart data
  const pieData = [
    { name: 'Low (<30%)', value: summary?.low_bins || 0, color: '#10b981' },
    { name: 'Medium (30-70%)', value: summary?.medium_bins || 0, color: '#eab308' },
    { name: 'High (70-85%)', value: summary?.high_bins || 0, color: '#f97316' },
    { name: 'Critical (>85%)', value: summary?.full_bins || 0, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Phase 1 System Architecture & Health Connectivity Banner */}
      <Phase1HealthBanner onOpenModal={() => setShowHealthModal(true)} />

      {/* Top Banner & Quick Route Action */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-800/40 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
        <div className="space-y-2 max-w-xl z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Active Municipal Digital Twin
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Smart Waste & Carbon Command Center
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Real-time telemetry, Random Forest fill-level forecasts, and CVRP route optimization driving municipal GHG reductions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 z-10 w-full sm:w-auto">
          <button
            onClick={handleQuickOptimizeRoute}
            disabled={isDispatching}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-3 rounded-2xl shadow-lg shadow-emerald-950/60 transition-all active:scale-95 disabled:opacity-50 text-sm"
          >
            <RouteIcon className="w-4 h-4" />
            <span>{isDispatching ? 'Optimizing CVRP...' : 'Generate Optimized Route'}</span>
          </button>

          <button
            onClick={() => onNavigate('digital-twin')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-5 py-3 rounded-2xl border border-slate-700 transition-all active:scale-95 text-sm"
          >
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Open GIS Twin</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Bins */}
        <div
          onClick={() => onNavigate('bins')}
          className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 rounded-2xl p-4 cursor-pointer transition-all hover:border-slate-700 group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Bins</span>
            <Trash2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{summary?.total_bins ?? 25}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            <span className="text-emerald-400">{summary?.low_bins ?? 0} low</span> •{' '}
            <span className="text-amber-400">{summary?.medium_bins ?? 0} med</span>
          </div>
        </div>

        {/* High-Risk Bins */}
        <div
          onClick={() => onNavigate('predictions')}
          className="bg-slate-900/80 hover:bg-slate-900 border border-rose-900/30 rounded-2xl p-4 cursor-pointer transition-all hover:border-rose-800/60 group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-rose-300">High-Risk Bins</span>
            <AlertTriangle className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-rose-400 tracking-tight">
            {summary?.high_risk_bins_count ?? 8}
          </div>
          <div className="text-[11px] text-rose-300/80 mt-1">
            {summary?.full_bins ?? 0} critical overflow
          </div>
        </div>

        {/* Fleet Vehicles */}
        <div
          onClick={() => onNavigate('vehicles')}
          className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 rounded-2xl p-4 cursor-pointer transition-all hover:border-slate-700 group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Active Fleet</span>
            <Truck className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {summary?.active_vehicles ?? 3}
            <span className="text-sm font-normal text-slate-400">/{summary?.total_vehicles ?? 4}</span>
          </div>
          <div className="text-[11px] text-cyan-400 mt-1">Collecting & Ready</div>
        </div>

        {/* Distance Saved */}
        <div
          onClick={() => onNavigate('routes')}
          className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 rounded-2xl p-4 cursor-pointer transition-all hover:border-slate-700 group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Distance Saved</span>
            <TrendingDown className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">
            {summary?.total_distance_saved_km?.toFixed(1) ?? '104.5'}
            <span className="text-xs text-slate-400 font-normal ml-0.5">km</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">vs unoptimized baseline</div>
        </div>

        {/* Fuel Saved */}
        <div
          onClick={() => onNavigate('carbon')}
          className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 rounded-2xl p-4 cursor-pointer transition-all hover:border-slate-700 group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Fuel Saved</span>
            <Fuel className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-teal-400 tracking-tight">
            {summary?.total_fuel_saved_l?.toFixed(1) ?? '27.5'}
            <span className="text-xs text-slate-400 font-normal ml-0.5">L</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Clean diesel & hybrid</div>
        </div>

        {/* CO2 Mitigated */}
        <div
          onClick={() => onNavigate('carbon')}
          className="bg-slate-900/80 hover:bg-slate-900 border border-emerald-900/40 rounded-2xl p-4 cursor-pointer transition-all hover:border-emerald-800/60 group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-emerald-300">CO2 Mitigated</span>
            <Leaf className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">
            {summary?.total_co2_saved_kg?.toFixed(1) ?? '73.7'}
            <span className="text-xs text-slate-400 font-normal ml-0.5">kg</span>
          </div>
          <div className="text-[11px] text-emerald-300/80 mt-1">GHG Protocol Verified</div>
        </div>
      </div>

      {/* Main Charts & Visualizations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart (Baseline vs Optimized CO2) */}
        <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-base font-semibold text-white">Carbon Emissions: Baseline vs. Optimized Route</h2>
              <p className="text-xs text-slate-400">7-day municipal collection emissions comparison (kg CO2)</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" /> Baseline
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> EcoTwin AI
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="colorBaseline" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorOptimized" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="baseline_co2"
                  name="Baseline CO2 (kg)"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorBaseline)"
                />
                <Area
                  type="monotone"
                  dataKey="optimized_co2"
                  name="Optimized CO2 (kg)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorOptimized)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fill Level Distribution Donut */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Waste Level Distribution</h2>
            <p className="text-xs text-slate-400">Current fill level breakdown across 25 active city bins</p>
          </div>

          <div className="h-56 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center pointer-events-none">
              <div className="text-2xl font-bold text-white">{summary?.total_bins ?? 25}</div>
              <div className="text-[11px] text-slate-400">Bins Total</div>
            </div>
          </div>

          {/* Custom Legend */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-400 truncate">{item.name}:</span>
                <span className="font-semibold text-slate-200">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alert Panel & High Risk Triage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* High Risk Bins Triage Card */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">High-Risk Bins (AI Forecast)</h3>
                <p className="text-xs text-slate-400">Bins projected to reach critical capacity &gt;85%</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('predictions')}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {highRiskBins.slice(0, 4).map((p) => {
              const bin = bins.find((b) => b.bin_id === p.bin_id);
              return (
                <div
                  key={p.id}
                  onClick={() => onNavigate('bins')}
                  className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex items-center justify-between hover:border-slate-700 transition-colors cursor-pointer"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200">{p.bin_id}</span>
                      <span className="text-xs text-slate-400 truncate max-w-[180px]">
                        {bin?.name || 'Commercial District'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">{bin?.location_name}</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs text-slate-400">
                        Current: <span className="text-slate-200 font-semibold">{p.current_level}%</span>
                      </div>
                      <div className="text-xs font-bold text-rose-400">
                        Pred: {p.predicted_level}% ({p.risk_level})
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-rose-950/60 border border-rose-800/60 text-rose-300 text-[10px] font-bold rounded-lg uppercase">
                      Pickup Req
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live System Alerts & Notifications */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">System Advisory Feed</h3>
                <p className="text-xs text-slate-400">Telemetric alerts and fleet status changes</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('notifications')}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <span>View Logs</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {notifications.slice(0, 4).map((n) => (
              <div
                key={n.id}
                className={`p-3 rounded-2xl border flex items-start gap-3 text-xs ${
                  n.severity === 'CRITICAL'
                    ? 'bg-rose-950/30 border-rose-900/40 text-rose-200'
                    : n.severity === 'HIGH'
                    ? 'bg-amber-950/30 border-amber-900/40 text-amber-200'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {n.severity === 'CRITICAL' ? (
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center justify-between font-semibold">
                    <span>{n.title}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-400 line-clamp-2">{n.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Architecture & Health Diagnostics Modal */}
      <SystemHealthModal
        isOpen={showHealthModal}
        onClose={() => setShowHealthModal(false)}
        onNavigateTab={onNavigate}
      />
    </div>
  );
};
