import React, { useEffect, useState } from 'react';
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCheck,
  Filter,
  Trash2,
} from 'lucide-react';
import { api } from '../services/api';
import { SystemNotification, NotificationSeverity } from '../types';

export const NotificationsView: React.FC = () => {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  const fetchNotifs = async () => {
    try {
      setLoading(true);
      const res = await api.getNotifications();
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(
        notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err: any) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
    } catch (err: any) {
      console.error('Failed to mark all read:', err);
    }
  };

  const filtered = notifications.filter((n) => {
    if (filterSeverity === 'ALL') return true;
    return n.severity === filterSeverity;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Bell className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">System Advisory & Alert Center</h1>
          </div>
          <p className="text-xs text-slate-400">
            Real-time notifications for bin capacity overshoots, vehicle maintenance, and route dispatches.
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-2.5 rounded-2xl border border-slate-700 transition-all text-xs active:scale-95"
        >
          <CheckCheck className="w-4 h-4 text-emerald-400" />
          <span>Mark All Read</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 bg-slate-900/70 border border-slate-800 rounded-2xl p-2 text-xs overflow-x-auto">
        {['ALL', 'CRITICAL', 'HIGH', 'WARNING', 'INFO'].map((sev) => (
          <button
            key={sev}
            onClick={() => setFilterSeverity(sev)}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
              filterSeverity === sev
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {sev}
          </button>
        ))}
      </div>

      {/* Notifications list */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading notifications...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400">No alerts found under this filter.</div>
        ) : (
          filtered.map((n) => {
            let borderClass = 'border-slate-800';
            let icon = <Info className="w-4 h-4 text-cyan-400" />;

            if (n.severity === 'CRITICAL') {
              borderClass = 'border-rose-800/80 bg-rose-950/20';
              icon = <AlertTriangle className="w-4 h-4 text-rose-400" />;
            } else if (n.severity === 'HIGH') {
              borderClass = 'border-amber-800/80 bg-amber-950/20';
              icon = <AlertTriangle className="w-4 h-4 text-amber-400" />;
            } else if (n.severity === 'WARNING') {
              borderClass = 'border-amber-800/50 bg-amber-950/10';
              icon = <AlertCircle className="w-4 h-4 text-amber-400" />;
            }

            return (
              <div
                key={n.id}
                onClick={() => handleMarkRead(n.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${borderClass} ${
                  n.read ? 'opacity-70 bg-slate-900/40' : 'bg-slate-900/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">{icon}</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{n.title}</span>
                      <span className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-slate-800 text-slate-300 uppercase">
                        {n.category}
                      </span>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                      )}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
                    <div className="text-[10px] text-slate-500">
                      {new Date(n.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    {n.severity}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
