import React, { useEffect, useState } from 'react';
import {
  Settings,
  Save,
  CheckCircle2,
  MapPin,
  Gauge,
  Shield,
  Sparkles,
  Users,
  UserPlus,
  Trash2,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../services/api';
import { SystemSettings, User } from '../types';

export const SettingsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'calibration' | 'users'>('calibration');
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New user form state
  const [showAddUser, setShowAddUser] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'ADMIN' | 'OPERATOR'>('OPERATOR');
  const [userError, setUserError] = useState<string | null>(null);
  const [userSuccess, setUserSuccess] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [settingsRes, usersRes] = await Promise.allSettled([
        api.getSettings(),
        api.getUsers(),
      ]);
      if (settingsRes.status === 'fulfilled') {
        setSettings(settingsRes.value.data);
      }
      if (usersRes.status === 'fulfilled') {
        setUsers(usersRes.value.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      setSaving(true);
      await api.updateSettings(settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError(null);
    setUserSuccess(null);
    try {
      await api.createUser({
        name: newName,
        email: newEmail,
        password: newPassword,
        role: newRole,
      });
      setUserSuccess(`User "${newName}" registered successfully.`);
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setShowAddUser(false);
      const res = await api.getUsers();
      setUsers(res.data);
    } catch (err: any) {
      setUserError(err.message || 'Failed to create user.');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to remove user "${userName}"?`)) return;
    try {
      await api.deleteUser(userId);
      setUsers(users.filter((u) => u.id !== userId));
    } catch (err: any) {
      alert('Failed to delete user: ' + err.message);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Settings className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">System Settings & Administration</h1>
          </div>
          <p className="text-xs text-slate-400">
            Configure municipal recovery depot geodetic coordinates, sensor thresholds, emissions parameters, and role-based access.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-semibold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings Saved</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('calibration')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'calibration'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Gauge className="w-3.5 h-3.5" />
          <span>Depot & Sensor Calibration</span>
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'users'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>User Accounts & RBAC</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
            {users.length}
          </span>
        </button>
      </div>

      {activeTab === 'calibration' && (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Central Depot Configuration */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <MapPin className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Central Municipal Recovery Depot & Weigh Station
              </h2>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Depot Facility Name</label>
                <input
                  type="text"
                  value={settings.depot_name}
                  onChange={(e) => setSettings({ ...settings, depot_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Depot Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={settings.depot_latitude}
                    onChange={(e) => setSettings({ ...settings, depot_latitude: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Depot Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={settings.depot_longitude}
                    onChange={(e) => setSettings({ ...settings, depot_longitude: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Fill Level Risk Thresholds */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Gauge className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Waste Bin Capacity Classification Thresholds (%)
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Low Fill Ceiling (&lt; %)</label>
                <input
                  type="number"
                  value={settings.threshold_low}
                  onChange={(e) => setSettings({ ...settings, threshold_low: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Medium Fill Floor (% to 70)</label>
                <input
                  type="number"
                  value={settings.threshold_medium}
                  onChange={(e) => setSettings({ ...settings, threshold_medium: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">High Fill Floor (% to 85)</label>
                <input
                  type="number"
                  value={settings.threshold_high}
                  onChange={(e) => setSettings({ ...settings, threshold_high: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Critical Overflow Risk (&gt; %)</label>
                <input
                  type="number"
                  value={settings.threshold_critical}
                  onChange={(e) => setSettings({ ...settings, threshold_critical: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Emissions & Environmental Parameters */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Shield className="w-4 h-4 text-teal-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Carbon Emissions & Vehicle Efficiency Parameters
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">DEFRA Diesel Factor (kg CO2 / L)</label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.default_emission_factor}
                  onChange={(e) => setSettings({ ...settings, default_emission_factor: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Default Truck Fuel Efficiency (km / L)</label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.default_fuel_efficiency}
                  onChange={(e) => setSettings({ ...settings, default_fuel_efficiency: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-3 rounded-2xl shadow-lg shadow-emerald-950/60 transition-all text-xs active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Applying...' : 'Save Configuration Changes'}</span>
            </button>
          </div>
        </form>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* User management banner */}
          <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Authorized System Accounts</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage administrators and field collection operators with salted bcrypt password hashing and signed JWT authentication.
              </p>
            </div>
            <button
              onClick={() => setShowAddUser(!showAddUser)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-950/40 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add User</span>
            </button>
          </div>

          {userSuccess && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800/60 rounded-2xl text-xs text-emerald-300">
              {userSuccess}
            </div>
          )}

          {userError && (
            <div className="p-3 bg-rose-950/60 border border-rose-800/60 rounded-2xl text-xs text-rose-300">
              {userError}
            </div>
          )}

          {showAddUser && (
            <form onSubmit={handleCreateUser} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-400" />
                <span>Register New Authorized Account</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Officer Sandra Vance"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="officer@ecotwin.ai"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Initial Password (min 6 chars)</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">System Role (RBAC)</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="OPERATOR">Operator (Field routes, telematics & dispatch)</option>
                    <option value="ADMIN">Administrator (Full city configuration & access)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-950"
                >
                  Create Account
                </button>
              </div>
            </form>
          )}

          {/* User Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-6 py-3.5">User</th>
                    <th className="px-6 py-3.5">Role</th>
                    <th className="px-6 py-3.5">Registered</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-200">{u.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide ${
                            u.role === 'ADMIN'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/70'
                              : 'bg-teal-950 text-teal-300 border border-teal-800/70'
                          }`}
                        >
                          <KeyRound className="w-3 h-3" />
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'System Seed'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
                          title="Remove user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
