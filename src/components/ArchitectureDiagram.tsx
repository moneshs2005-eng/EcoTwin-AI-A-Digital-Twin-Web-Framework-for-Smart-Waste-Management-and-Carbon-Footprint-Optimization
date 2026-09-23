import React from 'react';
import {
  User,
  LayoutDashboard,
  Trash2,
  BrainCircuit,
  Truck,
  Activity,
  Route,
  Leaf,
  FileSpreadsheet,
  Database,
  Cpu,
  Navigation as NavIcon,
  Flame,
  ArrowDown,
  Layers,
  CheckCircle2,
  Server,
  Zap,
} from 'lucide-react';
import { SystemHealthCheck } from '../types';

interface ArchitectureDiagramProps {
  health?: SystemHealthCheck | null;
  onNavigateTab?: (tab: string) => void;
}

export const ArchitectureDiagram: React.FC<ArchitectureDiagramProps> = ({ health, onNavigateTab }) => {
  return (
    <div className="space-y-6 text-slate-100">
      {/* Intro Header */}
      <div className="flex items-center justify-between bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>Live End-to-End System Pipeline & Data Flow Architecture</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Real-time Synced</span>
        </div>
      </div>

      {/* NODE 1: USER */}
      <div className="flex flex-col items-center">
        <div className="w-full max-w-md bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-xl text-center relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500" />
          <div className="flex items-center justify-center gap-2 mb-1">
            <User className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm tracking-wide text-white uppercase">User / Municipal Operator</h3>
          </div>
          <p className="text-[11px] text-slate-400">
            Role-Based Access Control (Admin / Dispatcher / Fleet Operator)
          </p>
        </div>

        {/* Connector */}
        <div className="flex flex-col items-center my-1 text-slate-500">
          <div className="w-0.5 h-4 bg-emerald-500/40" />
          <ArrowDown className="w-4 h-4 text-emerald-400" />
        </div>
      </div>

      {/* NODE 2: REACT FRONTEND */}
      <div className="flex flex-col items-center">
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                CLIENT LAYER
              </span>
              <h3 className="font-bold text-sm text-white">React 19 Single Page Application</h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Tailwind CSS + Recharts + Leaflet</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'bins', label: 'Bins', icon: Trash2 },
              { id: 'predictions', label: 'Predictions', icon: BrainCircuit },
              { id: 'vehicles', label: 'Vehicles', icon: Truck },
              { id: 'digital-twin', label: 'Digital Twin', icon: Activity },
              { id: 'routes', label: 'Routes', icon: Route },
              { id: 'carbon', label: 'Carbon', icon: Leaf },
              { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
            ].map((v) => {
              const Icon = v.icon;
              return (
                <div
                  key={v.id}
                  onClick={() => onNavigateTab && onNavigateTab(v.id)}
                  className="flex items-center gap-2 p-2 bg-slate-950/60 rounded-xl border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition-colors text-slate-300 hover:text-white"
                >
                  <Icon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="text-[11px] font-medium truncate">{v.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Connector */}
        <div className="flex flex-col items-center my-1 text-slate-500">
          <div className="text-[10px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40 my-1">
            REST API (JSON / HTTP)
          </div>
          <ArrowDown className="w-4 h-4 text-cyan-400" />
        </div>
      </div>

      {/* NODE 3: BACKEND API (FASTAPI / EXPRESS ROUTER) */}
      <div className="flex flex-col items-center">
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                API GATEWAY
              </span>
              <h3 className="font-bold text-sm text-white">Full-Stack Backend Services</h3>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">
              Status: {health?.status === 'healthy' ? 'Active & Healthy' : 'Online'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 text-[11px]">
            {[
              { name: 'Authentication', path: '/api/auth/*' },
              { name: 'Bin Service', path: '/api/bins' },
              { name: 'Waste Service', path: '/api/waste' },
              { name: 'Prediction Service', path: '/api/predictions' },
              { name: 'Route Service', path: '/api/routes' },
              { name: 'Carbon Service', path: '/api/carbon' },
              { name: 'Digital Twin Service', path: '/api/digital-twin' },
              { name: 'System Settings', path: '/api/settings' },
            ].map((svc) => (
              <div key={svc.name} className="p-2 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <div className="font-semibold text-slate-200">{svc.name}</div>
                <div className="text-[10px] text-emerald-400 font-mono mt-0.5">{svc.path}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Connector */}
        <div className="flex flex-col items-center my-1 text-slate-500">
          <div className="w-0.5 h-4 bg-emerald-500/40" />
          <ArrowDown className="w-4 h-4 text-emerald-400" />
        </div>
      </div>

      {/* NODE 4: CORE THREE ENGINES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Subnode 4A: Database */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between hover:border-purple-500/40 transition-all">
          <div>
            <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-800">
              <Database className="w-4 h-4 text-purple-400" />
              <h4 className="font-bold text-xs text-white uppercase tracking-wider">
                Database Store
              </h4>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Thread-safe atomic document store & persistence engine
            </p>
            <ul className="space-y-1 text-[11px] text-slate-300">
              <li className="flex items-center justify-between">
                <span>Bins Collection:</span>
                <span className="font-mono text-purple-400 font-bold">{health?.database.counts.bins ?? 25}</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Vehicles Collection:</span>
                <span className="font-mono text-purple-400 font-bold">{health?.database.counts.vehicles ?? 4}</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Waste Records:</span>
                <span className="font-mono text-purple-400 font-bold">{health?.database.counts.waste_records ?? 228}</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Optimized Routes:</span>
                <span className="font-mono text-purple-400 font-bold">{health?.database.counts.routes ?? 8}</span>
              </li>
            </ul>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono">
            Latency: {health?.database.read_latency_ms ?? 0.08} ms
          </div>
        </div>

        {/* Subnode 4B: AI / ML Engine */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between hover:border-amber-500/40 transition-all">
          <div>
            <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-800">
              <Cpu className="w-4 h-4 text-amber-400" />
              <h4 className="font-bold text-xs text-white uppercase tracking-wider">
                AI / ML Engine
              </h4>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Diurnal fill-level regression & hazard detection
            </p>
            <ul className="space-y-1.5 text-[11px] text-slate-300">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>12h Predictive Trajectory</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Risk Level Categorization</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Overflow Anomaly Detection</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Confidence & R² Calibration</span>
              </li>
            </ul>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-amber-400 font-mono">
            Multi-variate ML Inference Active
          </div>
        </div>

        {/* Subnode 4C: Route Engine */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between hover:border-blue-500/40 transition-all">
          <div>
            <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-800">
              <NavIcon className="w-4 h-4 text-blue-400" />
              <h4 className="font-bold text-xs text-white uppercase tracking-wider">
                Route Engine
              </h4>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Capacitated Vehicle Routing & TSP heuristic solver
            </p>
            <ul className="space-y-1.5 text-[11px] text-slate-300">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>2-Opt Local Search Algorithm</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Haversine Distance Matrix</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Vehicle Payload Constraints</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Dispatch ETA & Turn-by-Turn</span>
              </li>
            </ul>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-blue-400 font-mono">
            Average Savings: 45% - 60%
          </div>
        </div>
      </div>

      {/* Connector */}
      <div className="flex flex-col items-center my-1 text-slate-500">
        <div className="w-0.5 h-4 bg-emerald-500/40" />
        <ArrowDown className="w-4 h-4 text-emerald-400" />
      </div>

      {/* NODE 5: DIGITAL TWIN */}
      <div className="flex flex-col items-center">
        <div className="w-full bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-700/50 rounded-2xl p-4 shadow-xl hover:border-emerald-500 transition-all">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
              <h3 className="font-bold text-sm text-white uppercase tracking-wider">
                Digital Twin Physical City Model
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              GIS TWIN ACTIVE
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <div className="text-slate-400 text-[10px] uppercase font-semibold">Virtual Bins</div>
              <div className="text-sm font-bold text-white mt-1">25 Smart Receptacles</div>
              <div className="text-[10px] text-emerald-400 mt-0.5">Fill, battery, temp live</div>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <div className="text-slate-400 text-[10px] uppercase font-semibold">Virtual Vehicles</div>
              <div className="text-sm font-bold text-white mt-1">4 Fleet Compactor Units</div>
              <div className="text-[10px] text-cyan-400 mt-0.5">GPS location, fuel & payload</div>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <div className="text-slate-400 text-[10px] uppercase font-semibold">Waste State Engine</div>
              <div className="text-sm font-bold text-white mt-1">Dynamic Diurnal Model</div>
              <div className="text-[10px] text-purple-400 mt-0.5">Weather & event sensitivity</div>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <div className="text-slate-400 text-[10px] uppercase font-semibold">Dispatch Routes</div>
              <div className="text-sm font-bold text-white mt-1">Real-time Polylines</div>
              <div className="text-[10px] text-amber-400 mt-0.5">Automated stop progression</div>
            </div>
          </div>
        </div>

        {/* Connector */}
        <div className="flex flex-col items-center my-1 text-slate-500">
          <div className="w-0.5 h-4 bg-emerald-500/40" />
          <ArrowDown className="w-4 h-4 text-emerald-400" />
        </div>
      </div>

      {/* NODE 6: CARBON ENGINE */}
      <div className="flex flex-col items-center">
        <div className="w-full bg-slate-900/90 border border-emerald-800/60 rounded-2xl p-4 shadow-xl hover:border-emerald-400 transition-all">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-sm text-white uppercase tracking-wider">
                Carbon Engine & GHG Mitigation
              </h3>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono font-semibold">
              DEFRA Factors (2.68 kg CO2/L)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <div className="text-slate-400 text-[10px] uppercase font-semibold">Distance Saved</div>
              <div className="text-sm font-bold text-white mt-1">&Delta; km vs Baseline</div>
              <div className="text-[10px] text-slate-400 mt-0.5">35-50% travel reduction</div>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <div className="text-slate-400 text-[10px] uppercase font-semibold">Fuel Conserved</div>
              <div className="text-sm font-bold text-white mt-1">Liters Saved</div>
              <div className="text-[10px] text-emerald-400 mt-0.5">Heavy-duty fleet fuel economy</div>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <div className="text-slate-400 text-[10px] uppercase font-semibold">CO2 Reductions</div>
              <div className="text-sm font-bold text-white mt-1">kg CO2 Avoided</div>
              <div className="text-[10px] text-emerald-400 mt-0.5">Scope 1 direct emission cuts</div>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <div className="text-slate-400 text-[10px] uppercase font-semibold">ESG Equivalency</div>
              <div className="text-sm font-bold text-white mt-1">Urban Tree Equiv.</div>
              <div className="text-[10px] text-cyan-400 mt-0.5">Annual absorption offset</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
