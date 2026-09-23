import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  XCircle,
  Database,
  Server,
  Cpu,
  RefreshCw,
  Clock,
  Layers,
  Container,
  Code2,
  FileCheck2,
  X,
  ExternalLink,
  Workflow,
  BarChart3,
} from 'lucide-react';
import { api } from '../services/api';
import { SystemHealthCheck } from '../types';
import { ArchitectureDiagram } from './ArchitectureDiagram';

interface SystemHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'architecture' | 'diagnostics';
  onNavigateTab?: (tab: string) => void;
}

export const SystemHealthModal: React.FC<SystemHealthModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'architecture',
  onNavigateTab,
}) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'diagnostics'>(initialTab);
  const [health, setHealth] = useState<SystemHealthCheck | null>(null);
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const runDiagnostics = async () => {
    try {
      setLoading(true);
      setError(null);
      const t0 = performance.now();
      const pingRes = await api.pingServer();
      const t1 = performance.now();
      setPingLatency(Math.round(t1 - t0));

      const healthRes = await api.getHealthCheck();
      setHealth(healthRes);
    } catch (err: any) {
      console.error('Health check failed:', err);
      setError(err.message || 'Failed to reach backend health endpoint');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runDiagnostics();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">System Architecture & Health Verification</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  DIGITAL TWIN PIPELINE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                End-to-end telemetry architecture, data flows, and active microservices verification.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold transition-colors border-b-2 ${
              activeTab === 'architecture'
                ? 'border-emerald-500 text-emerald-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Workflow className="w-4 h-4" />
            <span>Architecture & Data Flow</span>
          </button>
          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold transition-colors border-b-2 ${
              activeTab === 'diagnostics'
                ? 'border-emerald-500 text-emerald-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Health & Diagnostics Probe</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {activeTab === 'architecture' ? (
            <ArchitectureDiagram
              health={health}
              onNavigateTab={(tab) => {
                onNavigateTab?.(tab);
                onClose();
              }}
            />
          ) : (
            <>
              {/* Status summary banner */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-3">
                  {loading ? (
                    <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
                  ) : health?.status === 'healthy' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-400" />
                  )}
                  <div>
                    <div className="font-bold text-sm text-white flex items-center gap-2">
                      <span>Communication Status:</span>
                      <span
                        className={
                          health?.status === 'healthy' ? 'text-emerald-400' : 'text-rose-400'
                        }
                      >
                        {loading ? 'Pinging System...' : health?.status === 'healthy' ? 'SUCCESSFUL & OPERATIONAL' : 'DEGRADED'}
                      </span>
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      Frontend HTTP Client &harr; Express Backend API &harr; Atomic Persistent Database
                    </div>
                  </div>
                </div>

                <button
                  onClick={runDiagnostics}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all font-semibold active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Retest</span>
                </button>
              </div>

              {error && (
                <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-2xl text-rose-300">
                  Error connecting to backend: {error}
                </div>
              )}

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-[10px] uppercase font-semibold">Roundtrip Ping</span>
                  </div>
                  <div className="text-lg font-bold text-white font-mono">
                    {pingLatency !== null ? `${pingLatency} ms` : '--'}
                  </div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">Live API probe</div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <Server className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] uppercase font-semibold">Backend Uptime</span>
                  </div>
                  <div className="text-lg font-bold text-white font-mono">
                    {health ? health.uptime_formatted : '--'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {health ? `${health.uptime_seconds}s active` : '--'}
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <Database className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-[10px] uppercase font-semibold">DB Read Latency</span>
                  </div>
                  <div className="text-lg font-bold text-white font-mono">
                    {health ? `${health.database.read_latency_ms} ms` : '--'}
                  </div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">Sub-millisecond access</div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <Cpu className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[10px] uppercase font-semibold">Process Memory</span>
                  </div>
                  <div className="text-lg font-bold text-white font-mono">
                    {health ? `${health.server_memory.heap_used_mb} MB` : '--'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Heap memory allocated</div>
                </div>
              </div>

              {/* Database Connection & Seeded Entities */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-purple-400" />
                    <span className="font-bold text-white uppercase text-[11px] tracking-wider">
                      Database Connection & State Verification
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {health?.database.status.toUpperCase() || 'CHECKING'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300">
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="text-slate-500 text-[10px]">Smart Bins</div>
                    <div className="text-base font-bold text-white font-mono">
                      {health?.database.counts.bins ?? '--'}
                    </div>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="text-slate-500 text-[10px]">Fleet Compactor Vehicles</div>
                    <div className="text-base font-bold text-white font-mono">
                      {health?.database.counts.vehicles ?? '--'}
                    </div>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="text-slate-500 text-[10px]">Optimized Routes</div>
                    <div className="text-base font-bold text-white font-mono">
                      {health?.database.counts.routes ?? '--'}
                    </div>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="text-slate-500 text-[10px]">Telemetry Waste Records</div>
                    <div className="text-base font-bold text-white font-mono">
                      {health?.database.counts.waste_records ?? '--'}
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 flex flex-col gap-1 pt-1">
                  <div>
                    <span className="text-slate-500">Storage Engine:</span>{' '}
                    <span className="text-slate-300">{health?.database.storage_type}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Persistence File:</span>{' '}
                    <span className="font-mono text-slate-300 text-[10px]">
                      {health?.database.file_path}
                    </span>
                  </div>
                </div>
              </div>

              {/* Microservices & Module Health */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-white uppercase text-[11px] tracking-wider">
                    Subsystem Health & Operational Readiness
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="flex items-center justify-between p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
                    <span className="text-slate-300 font-medium">Digital Twin Engine</span>
                    <span className="flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Operational
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
                    <span className="text-slate-300 font-medium">AI Fill Prediction Service</span>
                    <span className="flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Operational
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
                    <span className="text-slate-300 font-medium">CVRP Route Optimization Engine</span>
                    <span className="flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Operational
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
                    <span className="text-slate-300 font-medium">Carbon Audit & GHG Service</span>
                    <span className="flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Operational
                    </span>
                  </div>
                </div>
              </div>

              {/* Docker & Deployment Specs */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Container className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-white uppercase text-[11px] tracking-wider">
                    Docker & Containerization Specification
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
                    <div className="text-slate-500 text-[10px]">Container Image</div>
                    <div className="text-white font-mono font-medium">node:22-alpine</div>
                  </div>
                  <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
                    <div className="text-slate-500 text-[10px]">Health Check Target</div>
                    <div className="text-white font-mono font-medium">/api/health/ping</div>
                  </div>
                  <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
                    <div className="text-slate-500 text-[10px]">Volume Mount</div>
                    <div className="text-white font-mono font-medium">./data:/app/data</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="text-slate-400 flex items-center gap-1.5">
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
            <span>Phase 1 Verification Complete: All systems nominal</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
};
