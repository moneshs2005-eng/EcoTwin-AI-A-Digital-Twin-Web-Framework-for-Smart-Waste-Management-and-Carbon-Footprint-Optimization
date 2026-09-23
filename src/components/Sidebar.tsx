import React from 'react';
import {
  LayoutDashboard,
  Activity,
  Trash2,
  Truck,
  BrainCircuit,
  Route,
  Leaf,
  FileSpreadsheet,
  Bell,
  Settings,
  Sparkles,
  Zap,
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  user: User | null;
  unreadAlertCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  user,
  unreadAlertCount,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    { id: 'digital-twin', label: 'Digital Twin GIS', icon: Activity, badge: 'SYNCED' },
    { id: 'bins', label: 'Waste Bins', icon: Trash2 },
    { id: 'vehicles', label: 'Vehicle Fleet', icon: Truck },
    { id: 'predictions', label: 'AI Waste Predictor', icon: BrainCircuit, highlight: true },
    { id: 'routes', label: 'Route Optimization', icon: Route },
    { id: 'carbon', label: 'Carbon & ESG', icon: Leaf },
    { id: 'reports', label: 'Audit Reports', icon: FileSpreadsheet },
    { id: 'notifications', label: 'Alert Center', icon: Bell, badge: unreadAlertCount > 0 ? `${unreadAlertCount}` : undefined },
    ...(user?.role === 'ADMIN' ? [{ id: 'settings', label: 'System Settings', icon: Settings }] : []),
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-slate-900/60 border-r border-slate-800/80 p-4 shrink-0 min-h-[calc(100vh-61px)]">
      <div className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase px-3 py-2">
        Platform Operations
      </div>

      <nav className="space-y-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    item.id === 'notifications'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                      : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Live Digital Twin Status Card */}
      <div className="mt-4 p-3 rounded-xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 text-xs text-slate-300 space-y-2">
        <div className="flex items-center justify-between font-medium">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
            Digital Twin Active
          </span>
          <span className="text-[10px] font-mono text-slate-400">REST + GIS</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          State synchronization active. ML inference calibrated on 1,500 diurnal telemetry records.
        </p>
      </div>
    </aside>
  );
};
