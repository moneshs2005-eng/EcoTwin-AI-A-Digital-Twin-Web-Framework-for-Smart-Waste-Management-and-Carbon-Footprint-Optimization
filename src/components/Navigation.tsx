import React, { useState } from 'react';
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
  LogOut,
  Play,
  Shield,
  UserCheck,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import { User, SystemNotification } from '../types';
import { SystemHealthModal } from './SystemHealthModal';

interface NavigationProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  user: User | null;
  onLogout: () => void;
  onSwitchRole: (role: 'ADMIN' | 'OPERATOR') => void;
  notifications: SystemNotification[];
  onSimulateTick: () => Promise<void>;
  isSimulating: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  user,
  onLogout,
  onSwitchRole,
  notifications,
  onSimulateTick,
  isSimulating,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [healthModalOpen, setHealthModalOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const navItems = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    { id: 'digital-twin', label: 'Digital Twin GIS', icon: Activity, badge: 'LIVE' },
    { id: 'bins', label: 'Waste Bins', icon: Trash2 },
    { id: 'vehicles', label: 'Fleet Management', icon: Truck },
    { id: 'predictions', label: 'AI Waste Predictor', icon: BrainCircuit },
    { id: 'routes', label: 'Route Optimization', icon: Route },
    { id: 'carbon', label: 'Carbon & ESG', icon: Leaf },
    { id: 'reports', label: 'Audit Reports', icon: FileSpreadsheet },
    { id: 'notifications', label: 'Alert Center', icon: Bell, badge: unreadCount > 0 ? `${unreadCount}` : undefined },
    ...(user?.role === 'ADMIN' ? [{ id: 'settings', label: 'System Settings', icon: Settings }] : []),
  ];

  return (
    <>
      {/* Top App Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-md"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onSelectTab('dashboard')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-950/50">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                  EcoTwin AI
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-emerald-950 text-emerald-300 border border-emerald-800/60 rounded-full">
                  Digital Twin v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Smart City Waste & Carbon Engine</p>
            </div>
          </div>
        </div>

        {/* Right action controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Digital Twin Simulation Tick Button */}
          <button
            onClick={onSimulateTick}
            disabled={isSimulating}
            title="Advance simulated waste generation & vehicle movement by 30 minutes"
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 fill-emerald-400 ${isSimulating ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Simulate</span>
            <span>+30m</span>
          </button>

          {/* Quick Role Switcher Demo Tool */}
          <div className="hidden sm:flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => onSwitchRole('ADMIN')}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                user?.role === 'ADMIN'
                  ? 'bg-emerald-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-3 h-3" />
              Admin
            </button>
            <button
              onClick={() => onSwitchRole('OPERATOR')}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                user?.role === 'OPERATOR'
                  ? 'bg-teal-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserCheck className="w-3 h-3" />
              Operator
            </button>
          </div>

          {/* System Health / Phase 1 Status Button */}
          <button
            onClick={() => setHealthModalOpen(true)}
            title="System Architecture & Health Verification (Phase 1)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-lg text-xs font-semibold transition-all active:scale-95"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">Health</span>
          </button>

          {/* Alert Bell */}
          <div className="relative">
            <button
              onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg relative transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Preview */}
            {notifDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                  <span className="font-semibold text-sm text-slate-100">Live System Alerts</span>
                  <button
                    onClick={() => {
                      setNotifDropdownOpen(false);
                      onSelectTab('notifications');
                    }}
                    className="text-xs text-emerald-400 hover:underline"
                  >
                    View All ({notifications.length})
                  </button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {notifications.slice(0, 4).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        setNotifDropdownOpen(false);
                        onSelectTab('notifications');
                      }}
                      className={`p-2.5 rounded-lg text-xs cursor-pointer transition-colors ${
                        n.severity === 'CRITICAL'
                          ? 'bg-rose-950/40 border border-rose-800/40 text-rose-200'
                          : n.severity === 'HIGH'
                          ? 'bg-amber-950/40 border border-amber-800/40 text-amber-200'
                          : 'bg-slate-800/60 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold mb-0.5">
                        <span>{n.title}</span>
                        <span className="text-[10px] opacity-70">
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-400 line-clamp-2">{n.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="hidden lg:block text-right">
              <div className="text-xs font-semibold text-slate-200">{user?.name || 'Authorized User'}</div>
              <div className="text-[10px] text-emerald-400 font-mono tracking-wider">{user?.role}</div>
            </div>
            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="w-72 h-full bg-slate-900 border-r border-slate-800 p-4 space-y-1"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Navigation</div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-800 text-emerald-400">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* System Architecture & Diagnostics Modal */}
      <SystemHealthModal
        isOpen={healthModalOpen}
        onClose={() => setHealthModalOpen(false)}
        onNavigateTab={onSelectTab}
      />
    </>
  );
};
