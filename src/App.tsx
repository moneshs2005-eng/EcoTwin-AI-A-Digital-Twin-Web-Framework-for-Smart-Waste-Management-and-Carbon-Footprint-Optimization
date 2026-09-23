/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, SystemNotification, UserRole } from './types';
import { api } from './services/api';
import { Navigation } from './components/Navigation';
import { Sidebar } from './components/Sidebar';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { DigitalTwinView } from './views/DigitalTwinView';
import { BinsView } from './views/BinsView';
import { VehiclesView } from './views/VehiclesView';
import { PredictionsView } from './views/PredictionsView';
import { RoutesView } from './views/RoutesView';
import { CarbonView } from './views/CarbonView';
import { ReportsView } from './views/ReportsView';
import { NotificationsView } from './views/NotificationsView';
import { SettingsView } from './views/SettingsView';

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('ecotwin_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return {
      id: 'usr_admin',
      name: 'Dr. Elena Rostova',
      email: 'admin@ecotwin.ai',
      role: 'ADMIN',
    };
  });

  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  // Ensure active valid JWT exists on mount
  useEffect(() => {
    const token = localStorage.getItem('ecotwin_token');
    if (!token && user) {
      api.login(user.email, user.role === 'ADMIN' ? 'admin123' : 'operator123')
        .then((res) => {
          localStorage.setItem('ecotwin_token', res.token);
          localStorage.setItem('ecotwin_user', JSON.stringify(res.user));
          setUser(res.user);
        })
        .catch(() => {
          // ignore if offline
        });
    } else if (token) {
      api.getCurrentUser()
        .then((res) => {
          if (res.user) {
            setUser(res.user);
            localStorage.setItem('ecotwin_user', JSON.stringify(res.user));
          }
        })
        .catch(() => {
          // If token is invalid or expired, reset to login
          localStorage.removeItem('ecotwin_token');
          localStorage.removeItem('ecotwin_user');
          setUser(null);
        });
    }
  }, []);

  // Poll notifications and check session
  const refreshNotifications = async () => {
    try {
      const res = await api.getNotifications();
      setNotifications(res.data);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    if (user) {
      refreshNotifications();
      const interval = setInterval(refreshNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLoginSuccess = (newUser: User, token: string) => {
    setUser(newUser);
    setCurrentTab('dashboard');
    refreshNotifications();
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
  };

  const handleSwitchRole = async (newRole: UserRole) => {
    try {
      const email = newRole === 'ADMIN' ? 'admin@ecotwin.ai' : 'operator@ecotwin.ai';
      const password = newRole === 'ADMIN' ? 'admin123' : 'operator123';
      const res = await api.login(email, password);
      localStorage.setItem('ecotwin_token', res.token);
      localStorage.setItem('ecotwin_user', JSON.stringify(res.user));
      setUser(res.user);
      if (newRole === 'OPERATOR' && currentTab === 'settings') {
        setCurrentTab('dashboard');
      }
    } catch (err) {
      console.error('Failed to switch role:', err);
    }
  };

  const handleSimulateTick = async () => {
    try {
      setIsSimulating(true);
      await api.simulateTick(30);
      await refreshNotifications();
    } catch (err: any) {
      alert('Simulation error: ' + err.message);
    } finally {
      setIsSimulating(false);
    }
  };

  if (!user) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  const unreadAlertCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Application Bar */}
      <Navigation
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        user={user}
        onLogout={handleLogout}
        onSwitchRole={handleSwitchRole}
        notifications={notifications}
        onSimulateTick={handleSimulateTick}
        isSimulating={isSimulating}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Persistent Left Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          user={user}
          unreadAlertCount={unreadAlertCount}
        />

        {/* Dynamic Content Viewport */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto w-full">
          {currentTab === 'dashboard' && (
            <DashboardView
              onNavigate={setCurrentTab}
              onSimulateTick={handleSimulateTick}
              isSimulating={isSimulating}
            />
          )}

          {currentTab === 'digital-twin' && (
            <DigitalTwinView
              onSimulateTick={handleSimulateTick}
              isSimulating={isSimulating}
            />
          )}

          {currentTab === 'bins' && <BinsView userRole={user.role} />}

          {currentTab === 'vehicles' && <VehiclesView userRole={user.role} />}

          {currentTab === 'predictions' && (
            <PredictionsView onNavigateToRoute={() => setCurrentTab('routes')} />
          )}

          {currentTab === 'routes' && <RoutesView />}

          {currentTab === 'carbon' && <CarbonView />}

          {currentTab === 'reports' && <ReportsView />}

          {currentTab === 'notifications' && <NotificationsView />}

          {currentTab === 'settings' && user.role === 'ADMIN' && <SettingsView />}
        </main>
      </div>
    </div>
  );
}
