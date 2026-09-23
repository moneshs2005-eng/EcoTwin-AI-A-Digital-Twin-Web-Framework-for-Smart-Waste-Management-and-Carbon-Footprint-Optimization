/**
 * EcoTwin AI - Core Data Model & System Type Definitions
 */

export type UserRole = 'ADMIN' | 'OPERATOR';

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export type WasteType = 'ORGANIC' | 'RECYCLABLE' | 'GENERAL' | 'HAZARDOUS' | 'ELECTRONIC';
export type BinStatus = 'LOW' | 'MEDIUM' | 'HIGH' | 'FULL' | 'MAINTENANCE';

export interface WasteBin {
  bin_id: string;
  name: string;
  location_name: string;
  latitude: number;
  longitude: number;
  capacity: number; // in Liters, e.g. 1100
  current_waste_level: number; // in Liters
  waste_percentage: number; // 0 to 100
  waste_type: WasteType;
  status: BinStatus;
  battery_level: number; // 0 to 100%
  temperature_c: number; // Celsius
  last_collection_time: string;
  next_collection_time: string;
  created_at: string;
  updated_at: string;
}

export interface WasteRecord {
  id: string;
  bin_id: string;
  timestamp: string;
  waste_level: number;
  waste_percentage: number;
  temperature: number;
  rainfall_mm: number;
  humidity: number;
  collection_status: 'NORMAL' | 'COLLECTED' | 'OVERFLOW_ALERT';
}

export type VehicleStatus = 'AVAILABLE' | 'COLLECTING' | 'MAINTENANCE' | 'OFFLINE';
export type VehicleType = 'COMPACTOR_TRUCK' | 'ELECTRIC_VAN' | 'STANDARD_TRUCK';

export interface Vehicle {
  vehicle_id: string;
  registration_number: string;
  vehicle_type: VehicleType;
  capacity_kg: number;
  current_load_kg: number;
  fuel_capacity_l: number;
  current_fuel_l: number;
  fuel_efficiency_km_per_l: number; // e.g. 3.8 km/L
  emission_factor_kg_per_l: number; // e.g. 2.68 kg CO2/L
  latitude: number;
  longitude: number;
  status: VehicleStatus;
  assigned_route_id: string | null;
  created_at: string;
  updated_at: string;
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Prediction {
  id: string;
  bin_id: string;
  current_level: number;
  predicted_level: number;
  prediction_horizon_hours: number;
  risk_level: RiskLevel;
  collection_required: boolean;
  confidence_score: number;
  predicted_overflow_time: string;
  created_at: string;
}

export interface ModelMetrics {
  mae: number;
  mse: number;
  rmse: number;
  r2: number;
  sample_count: number;
  last_trained: string;
  features_used: string[];
}

export interface RouteStop {
  stop_number: number;
  bin_id: string;
  name: string;
  location_name: string;
  latitude: number;
  longitude: number;
  waste_level_pct: number;
  waste_kg: number;
  collected: boolean;
}

export type RouteStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface OptimizedRoute {
  route_id: string;
  vehicle_id: string;
  vehicle_registration?: string;
  status: RouteStatus;
  depot_location: {
    name: string;
    latitude: number;
    longitude: number;
  };
  stops: RouteStop[];
  total_distance_km: number;
  estimated_time_minutes: number;
  bins_collected_count: number;
  total_waste_collected_kg: number;
  
  // Baseline vs Optimized Comparison
  baseline_distance_km: number;
  distance_saved_km: number;
  baseline_fuel_l: number;
  optimized_fuel_l: number;
  fuel_saved_l: number;
  baseline_co2_kg: number;
  optimized_co2_kg: number;
  co2_saved_kg: number;
  savings_percentage: number;
  
  created_at: string;
}

export interface CarbonRecord {
  id: string;
  route_id: string;
  distance_km: number;
  fuel_consumed_l: number;
  fuel_saved_l?: number;
  emission_factor: number;
  co2_emission_kg: number;
  baseline_distance_km: number;
  baseline_fuel_l: number;
  baseline_co2_kg: number;
  co2_reduction_kg: number;
  savings_percentage: number;
  timestamp: string;
}

export type NotificationSeverity = 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';
export type NotificationCategory = 'BIN_OVERFLOW' | 'ROUTE_DISPATCH' | 'VEHICLE_MAINTENANCE' | 'SYSTEM';

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  category: NotificationCategory;
  related_id: string | null;
  read: boolean;
  created_at: string;
}

export interface DigitalTwinState {
  id: string;
  timestamp: string;
  depot_name: string;
  total_bins: number;
  critical_bins_count: number;
  high_bins_count: number;
  collecting_vehicles_count: number;
  city_ambient_temp_c: number;
  simulation_speed_multiplier: number;
  created_at: string;
}

export interface SystemSettings {
  depot_latitude: number;
  depot_longitude: number;
  depot_name: string;
  threshold_low: number; // 0-30
  threshold_medium: number; // 31-70
  threshold_high: number; // 71-85
  threshold_critical: number; // >85
  default_emission_factor: number; // 2.68 kg CO2 / L diesel
  default_fuel_efficiency: number; // 3.8 km / L
  simulation_interval_sec: number;
  auto_predict_enabled: boolean;
}

export interface SystemHealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime_seconds: number;
  uptime_formatted: string;
  timestamp: string;
  environment: string;
  version: string;
  database: {
    status: 'connected' | 'disconnected' | 'error';
    storage_type: string;
    file_path: string;
    file_exists: boolean;
    read_latency_ms: number;
    counts: {
      users: number;
      bins: number;
      vehicles: number;
      routes: number;
      predictions: number;
      carbon_records: number;
      waste_records: number;
      notifications: number;
      digital_twins?: number;
    };
  };
  services: {
    digital_twin: 'operational' | 'error';
    ai_prediction: 'operational' | 'error';
    route_optimization: 'operational' | 'error';
    carbon_calculation: 'operational' | 'error';
  };
  server_memory: {
    rss_mb: number;
    heap_used_mb: number;
    heap_total_mb: number;
  };
}

export interface DashboardSummary {
  total_bins: number;
  low_bins: number;
  medium_bins: number;
  high_bins: number;
  full_bins: number;
  high_risk_bins_count: number;
  active_vehicles: number;
  total_vehicles: number;
  total_distance_km: number;
  total_fuel_l: number;
  total_co2_kg: number;
  total_distance_saved_km: number;
  total_fuel_saved_l: number;
  total_co2_saved_kg: number;
  active_routes_count: number;
  unread_notifications_count: number;
}
