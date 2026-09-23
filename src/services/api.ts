/**
 * EcoTwin AI - Frontend API Client
 * Centralized HTTP request client with token management and typed responses.
 */

import {
  User,
  WasteBin,
  Vehicle,
  Prediction,
  OptimizedRoute,
  CarbonRecord,
  SystemNotification,
  SystemSettings,
  ModelMetrics,
  DashboardSummary,
  WasteRecord,
  SystemHealthCheck,
} from '../types';

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('ecotwin_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = cleanEndpoint.startsWith('/api') ? cleanEndpoint : `${API_BASE}${cleanEndpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const rawText = await response.text();
    throw new Error(
      `Received non-JSON response (${response.status} ${response.statusText}) from ${url}. Content-Type: ${contentType}. Payload: ${rawText.slice(0, 100)}`
    );
  }

  const json = await response.json();
  if (!response.ok || json.success === false) {
    throw new Error(json.error || `HTTP error ${response.status}: ${response.statusText}`);
  }
  return json;
}

export const api = {
  // Auth
  login: async (email: string, password: string) => {
    return request<{ success: boolean; token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  register: async (data: { name: string; email: string; password: string; role?: string }) => {
    return request<{ success: boolean; token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  logout: async () => {
    try {
      await request<{ success: boolean; message: string }>('/auth/logout', {
        method: 'POST',
      });
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('ecotwin_token');
      localStorage.removeItem('ecotwin_user');
    }
  },
  refreshToken: async () => {
    return request<{ success: boolean; token: string; user: User }>('/auth/refresh', {
      method: 'POST',
    });
  },
  changePassword: async (current_password: string, new_password: string) => {
    return request<{ success: boolean; message: string; token: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ current_password, new_password }),
    });
  },
  getCurrentUser: async () => {
    return request<{ success: boolean; user: User }>('/auth/me');
  },

  // User Management (Admin RBAC)
  getUsers: async () => {
    return request<{ success: boolean; count: number; data: User[] }>('/users');
  },
  getUserById: async (id: string) => {
    return request<{ success: boolean; data: User }>(`/users/${id}`);
  },
  createUser: async (data: { name: string; email: string; password: string; role?: string }) => {
    return request<{ success: boolean; data: User }>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateUser: async (id: string, data: Partial<User & { password?: string }>) => {
    return request<{ success: boolean; data: User }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  deleteUser: async (id: string) => {
    return request<{ success: boolean; message: string }>(`/users/${id}`, {
      method: 'DELETE',
    });
  },

  // Dashboard
  getDashboardSummary: async () => {
    return request<{ success: boolean; data: DashboardSummary & { trees_planted_equivalent: number; car_miles_avoided: number } }>('/dashboard/summary');
  },
  getDashboardTrends: async () => {
    return request<{ success: boolean; data: Array<{ day: string; waste_tonnes: number; baseline_co2: number; optimized_co2: number; co2_saved: number; fuel_saved_l: number }> }>('/dashboard/trends');
  },

  // Bins
  getBins: async (params?: { status?: string; waste_type?: string; search?: string; sort_by?: string; order?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.waste_type) searchParams.append('waste_type', params.waste_type);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.sort_by) searchParams.append('sort_by', params.sort_by);
    if (params?.order) searchParams.append('order', params.order);
    const queryStr = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request<{ success: boolean; count: number; data: WasteBin[] }>(`/bins${queryStr}`);
  },
  getBinById: async (id: string) => {
    return request<{ success: boolean; data: WasteBin & { recent_records: WasteRecord[]; latest_prediction: Prediction | null } }>(`/bins/${id}`);
  },
  createBin: async (data: Partial<WasteBin>) => {
    return request<{ success: boolean; data: WasteBin }>('/bins', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateBin: async (id: string, data: Partial<WasteBin>) => {
    return request<{ success: boolean; data: WasteBin }>(`/bins/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  deleteBin: async (id: string) => {
    return request<{ success: boolean; message: string }>(`/bins/${id}`, {
      method: 'DELETE',
    });
  },

  // Telemetry & Sensor Ingestion
  getWasteRecords: async () => {
    return request<{ success: boolean; count: number; data: WasteRecord[] }>('/waste');
  },
  getBinHistory: async (binId: string) => {
    return request<{ success: boolean; count: number; data: WasteRecord[] }>(`/waste/${binId}/history`);
  },
  ingestSensorReading: async (data: { bin_id: string; waste_percentage: number; temperature?: number; battery_level?: number }) => {
    return request<{ success: boolean; message: string; data: { bin: WasteBin; record: WasteRecord } }>('/sensors/waste', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // AI Predictions
  getPredictions: async () => {
    return request<{ success: boolean; count: number; data: Prediction[] }>('/predictions');
  },
  getHighRiskPredictions: async () => {
    return request<{ success: boolean; count: number; data: Prediction[] }>('/predictions/high-risk');
  },
  triggerPredictions: async () => {
    return request<{ success: boolean; message: string; data: Prediction[] }>('/predictions/run', {
      method: 'POST',
    });
  },
  getModelMetrics: async () => {
    return request<{ success: boolean; data: ModelMetrics }>('/predictions/metrics');
  },

  // Vehicles
  getVehicles: async () => {
    return request<{ success: boolean; data: Vehicle[] }>('/vehicles');
  },
  getVehicleById: async (id: string) => {
    return request<{ success: boolean; data: Vehicle }>(`/vehicles/${id}`);
  },
  createVehicle: async (data: Partial<Vehicle>) => {
    return request<{ success: boolean; data: Vehicle }>('/vehicles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateVehicle: async (id: string, data: Partial<Vehicle>) => {
    return request<{ success: boolean; data: Vehicle }>(`/vehicles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Routes
  optimizeRoute: async (payload?: { vehicle_id?: string; target_bin_ids?: string[] }) => {
    return request<{ success: boolean; data: OptimizedRoute }>('/routes/optimize', {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    });
  },
  getRoutes: async () => {
    return request<{ success: boolean; count: number; data: OptimizedRoute[] }>('/routes');
  },
  getRouteById: async (id: string) => {
    return request<{ success: boolean; data: OptimizedRoute }>(`/routes/${id}`);
  },
  updateRouteStatus: async (id: string, status: string) => {
    return request<{ success: boolean; data: OptimizedRoute }>(`/routes/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // Carbon
  getCarbonAnalytics: async () => {
    return request<{
      success: boolean;
      summary: {
        total_optimized_co2_kg: number;
        total_baseline_co2_kg: number;
        total_co2_saved_kg: number;
        overall_reduction_pct: number;
        total_fuel_consumed_l: number;
        total_fuel_saved_l: number;
        total_distance_traveled_km: number;
        total_distance_saved_km: number;
        trees_planted_equivalent: number;
        car_miles_avoided: number;
        barrels_oil_saved: number;
      };
      records: CarbonRecord[];
    }>('/carbon');
  },
  calculateCarbon: async (distance_km: number, fuel_efficiency?: number, emission_factor?: number) => {
    return request<{ success: boolean; data: any }>('/carbon/calculate', {
      method: 'POST',
      body: JSON.stringify({ distance_km, fuel_efficiency, emission_factor }),
    });
  },

  // Digital Twin
  getDigitalTwinSnapshot: async () => {
    return request<{
      success: boolean;
      data: {
        timestamp: string;
        depot: { name: string; latitude: number; longitude: number };
        bins: WasteBin[];
        vehicles: Vehicle[];
        active_routes: OptimizedRoute[];
        system_metrics: {
          total_bins: number;
          critical_bins_count: number;
          high_bins_count: number;
          collecting_vehicles_count: number;
          city_ambient_temp_c: number;
          simulation_speed_multiplier: number;
        };
      };
    }>('/digital-twin');
  },
  simulateStep: async (minutes = 30) => {
    return request<{ success: boolean; message: string; meta: any; data: any }>('/digital-twin/simulate-step', {
      method: 'POST',
      body: JSON.stringify({ minutes }),
    });
  },
  simulateTick: async (minutes = 30) => {
    return request<{ success: boolean; message: string; meta: any; data: any }>('/digital-twin/simulate-step', {
      method: 'POST',
      body: JSON.stringify({ minutes }),
    });
  },

  // Notifications
  getNotifications: async () => {
    return request<{ success: boolean; data: SystemNotification[] }>('/notifications');
  },
  markNotificationRead: async (id: string) => {
    return request<{ success: boolean; data: SystemNotification }>(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  },
  markAllNotificationsRead: async () => {
    return request<{ success: boolean; message: string }>('/notifications/read-all', {
      method: 'PUT',
    });
  },

  // Reports
  getReportsData: async () => {
    return request<{
      success: boolean;
      generated_at: string;
      summary: any;
      bins_overview: WasteBin[];
      routes_overview: OptimizedRoute[];
      fleet_overview: Vehicle[];
    }>('/reports');
  },

  // Settings
  getSettings: async () => {
    return request<{ success: boolean; data: SystemSettings }>('/settings');
  },
  updateSettings: async (settings: Partial<SystemSettings>) => {
    return request<{ success: boolean; data: SystemSettings }>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  // Health Checks & System Connectivity (Phase 1)
  getHealthCheck: async () => {
    return request<SystemHealthCheck>('/health');
  },
  pingServer: async () => {
    return request<{ status: string; pong: boolean; timestamp: string }>('/health/ping');
  },
};

