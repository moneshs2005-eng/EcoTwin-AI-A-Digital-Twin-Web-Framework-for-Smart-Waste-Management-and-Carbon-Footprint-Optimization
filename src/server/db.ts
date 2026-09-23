/**
 * EcoTwin AI - Persistent Storage and Database Layer
 * Provides atomic file persistence, indexing, and pre-seeded realistic city telemetry.
 */

import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User,
  WasteBin,
  WasteRecord,
  Vehicle,
  Prediction,
  OptimizedRoute,
  CarbonRecord,
  SystemNotification,
  SystemSettings,
  ModelMetrics,
  DigitalTwinState,
  BinStatus,
  WasteType,
  VehicleStatus,
  RiskLevel,
  RouteStatus,
  NotificationSeverity,
  NotificationCategory,
} from '../types';

export interface DatabaseSchema {
  users: User[];
  bins: WasteBin[];
  waste_records: WasteRecord[];
  vehicles: Vehicle[];
  predictions: Prediction[];
  routes: OptimizedRoute[];
  carbon_records: CarbonRecord[];
  notifications: SystemNotification[];
  digital_twins: DigitalTwinState[];
  settings: SystemSettings;
  model_metrics: ModelMetrics;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'ecotwin_database.json');

// Default System Settings
export const DEFAULT_SETTINGS: SystemSettings = {
  depot_latitude: 37.7749,
  depot_longitude: -122.4194,
  depot_name: 'Metro EcoDepot & Resource Recovery Central',
  threshold_low: 30,
  threshold_medium: 70,
  threshold_high: 85,
  threshold_critical: 95,
  default_emission_factor: 2.68, // kg CO2 per liter diesel (DEFRA standards)
  default_fuel_efficiency: 3.8, // km per liter for heavy waste compactor
  simulation_interval_sec: 10,
  auto_predict_enabled: true,
};

// Seed Bins across Metro Districts
const SEED_BINS_RAW: Array<Omit<WasteBin, 'status' | 'created_at' | 'updated_at' | 'last_collection_time' | 'next_collection_time'>> = [
  {
    bin_id: 'BIN-101',
    name: 'Harbor Walk EcoStation A',
    location_name: 'Downtown Ferry Terminal Plaza',
    latitude: 37.7955,
    longitude: -122.3937,
    capacity: 1100,
    current_waste_level: 980,
    waste_percentage: 89,
    waste_type: 'GENERAL',
    battery_level: 94,
    temperature_c: 19.5,
  },
  {
    bin_id: 'BIN-102',
    name: 'Financial Tower East',
    location_name: 'Montgomery & Market Street',
    latitude: 37.7898,
    longitude: -122.4014,
    capacity: 1100,
    current_waste_level: 1045,
    waste_percentage: 95,
    waste_type: 'RECYCLABLE',
    battery_level: 88,
    temperature_c: 21.0,
  },
  {
    bin_id: 'BIN-103',
    name: 'Tech Campus Quad Bin 1',
    location_name: 'Mission Bay Innovation Boulevard',
    latitude: 37.7689,
    longitude: -122.3922,
    capacity: 1100,
    current_waste_level: 320,
    waste_percentage: 29,
    waste_type: 'ORGANIC',
    battery_level: 98,
    temperature_c: 18.2,
  },
  {
    bin_id: 'BIN-104',
    name: 'Civic Center Green Depot',
    location_name: 'Van Ness & Grove Arts Walk',
    latitude: 37.7786,
    longitude: -122.4201,
    capacity: 1200,
    current_waste_level: 924,
    waste_percentage: 77,
    waste_type: 'GENERAL',
    battery_level: 82,
    temperature_c: 20.1,
  },
  {
    bin_id: 'BIN-105',
    name: 'Chinatown Gateway Station',
    location_name: 'Grant Ave & Bush St',
    latitude: 37.7907,
    longitude: -122.4058,
    capacity: 1000,
    current_waste_level: 910,
    waste_percentage: 91,
    waste_type: 'ORGANIC',
    battery_level: 79,
    temperature_c: 22.4,
  },
  {
    bin_id: 'BIN-106',
    name: 'SoMa Creative Quarter',
    location_name: 'Howard St & 3rd Art Walk',
    latitude: 37.7852,
    longitude: -122.4005,
    capacity: 1100,
    current_waste_level: 450,
    waste_percentage: 41,
    waste_type: 'RECYCLABLE',
    battery_level: 95,
    temperature_c: 19.8,
  },
  {
    bin_id: 'BIN-107',
    name: 'North Beach Cafe Cluster',
    location_name: 'Columbus Ave & Green St',
    latitude: 37.7996,
    longitude: -122.4074,
    capacity: 1000,
    current_waste_level: 880,
    waste_percentage: 88,
    waste_type: 'ORGANIC',
    battery_level: 85,
    temperature_c: 20.8,
  },
  {
    bin_id: 'BIN-108',
    name: 'Embarcadero Pier 14 Hub',
    location_name: 'Embarcadero Promenade',
    latitude: 37.7933,
    longitude: -122.3905,
    capacity: 1200,
    current_waste_level: 250,
    waste_percentage: 21,
    waste_type: 'GENERAL',
    battery_level: 91,
    temperature_c: 18.0,
  },
  {
    bin_id: 'BIN-109',
    name: 'Mission District Market Hub',
    location_name: 'Valencia St & 18th Ave',
    latitude: 37.7618,
    longitude: -122.4215,
    capacity: 1100,
    current_waste_level: 1012,
    waste_percentage: 92,
    waste_type: 'GENERAL',
    battery_level: 76,
    temperature_c: 23.0,
  },
  {
    bin_id: 'BIN-110',
    name: 'Castro Eco Corner',
    location_name: 'Castro St & Market St',
    latitude: 37.7627,
    longitude: -122.4352,
    capacity: 1000,
    current_waste_level: 680,
    waste_percentage: 68,
    waste_type: 'RECYCLABLE',
    battery_level: 90,
    temperature_c: 19.2,
  },
  {
    bin_id: 'BIN-111',
    name: 'Union Square Retail North',
    location_name: 'Post St & Stockton St',
    latitude: 37.7881,
    longitude: -122.4075,
    capacity: 1100,
    current_waste_level: 968,
    waste_percentage: 88,
    waste_type: 'GENERAL',
    battery_level: 87,
    temperature_c: 20.5,
  },
  {
    bin_id: 'BIN-112',
    name: 'Fisherman\'s Wharf Pier 39',
    location_name: 'Beach St & The Embarcadero',
    latitude: 37.8087,
    longitude: -122.4098,
    capacity: 1500,
    current_waste_level: 1425,
    waste_percentage: 95,
    waste_type: 'ORGANIC',
    battery_level: 81,
    temperature_c: 19.1,
  },
  {
    bin_id: 'BIN-113',
    name: 'Marina Green Recreation',
    location_name: 'Marina Blvd Coastal Path',
    latitude: 37.8055,
    longitude: -122.4368,
    capacity: 1000,
    current_waste_level: 180,
    waste_percentage: 18,
    waste_type: 'RECYCLABLE',
    battery_level: 99,
    temperature_c: 17.5,
  },
  {
    bin_id: 'BIN-114',
    name: 'Presidio Transit Center',
    location_name: 'Main Post Plaza',
    latitude: 37.7988,
    longitude: -122.4582,
    capacity: 1100,
    current_waste_level: 385,
    waste_percentage: 35,
    waste_type: 'GENERAL',
    battery_level: 93,
    temperature_c: 17.8,
  },
  {
    bin_id: 'BIN-115',
    name: 'Haight-Ashbury Cultural Spot',
    location_name: 'Haight St & Ashbury St',
    latitude: 37.7699,
    longitude: -122.4469,
    capacity: 1000,
    current_waste_level: 870,
    waste_percentage: 87,
    waste_type: 'RECYCLABLE',
    battery_level: 84,
    temperature_c: 20.4,
  },
  {
    bin_id: 'BIN-116',
    name: 'Golden Gate Park Concourse',
    location_name: 'Music Concourse Drive',
    latitude: 37.7715,
    longitude: -122.4687,
    capacity: 1400,
    current_waste_level: 700,
    waste_percentage: 50,
    waste_type: 'GENERAL',
    battery_level: 92,
    temperature_c: 18.9,
  },
  {
    bin_id: 'BIN-117',
    name: 'Sunset District Commercial',
    location_name: 'Irving St & 9th Ave',
    latitude: 37.7638,
    longitude: -122.4662,
    capacity: 1000,
    current_waste_level: 620,
    waste_percentage: 62,
    waste_type: 'ORGANIC',
    battery_level: 89,
    temperature_c: 18.6,
  },
  {
    bin_id: 'BIN-118',
    name: 'Richmond Center Plaza',
    location_name: 'Clement St & 6th Ave',
    latitude: 37.7831,
    longitude: -122.4645,
    capacity: 1000,
    current_waste_level: 490,
    waste_percentage: 49,
    waste_type: 'RECYCLABLE',
    battery_level: 96,
    temperature_c: 18.3,
  },
  {
    bin_id: 'BIN-119',
    name: 'Potrero Hill Science Complex',
    location_name: '16th St & Wisconsin St',
    latitude: 37.7651,
    longitude: -122.3995,
    capacity: 1200,
    current_waste_level: 996,
    waste_percentage: 83,
    waste_type: 'ELECTRONIC',
    battery_level: 78,
    temperature_c: 21.2,
  },
  {
    bin_id: 'BIN-120',
    name: 'Dogpatch Arts District',
    location_name: '22nd St & 3rd St',
    latitude: 37.7582,
    longitude: -122.3881,
    capacity: 1100,
    current_waste_level: 275,
    waste_percentage: 25,
    waste_type: 'HAZARDOUS',
    battery_level: 97,
    temperature_c: 19.0,
  },
  {
    bin_id: 'BIN-121',
    name: 'Japan Center Peace Plaza',
    location_name: 'Post St & Buchanan St',
    latitude: 37.7853,
    longitude: -122.4298,
    capacity: 1000,
    current_waste_level: 890,
    waste_percentage: 89,
    waste_type: 'GENERAL',
    battery_level: 86,
    temperature_c: 20.7,
  },
  {
    bin_id: 'BIN-122',
    name: 'South Beach Marina Promenade',
    location_name: 'Townsend St & The Embarcadero',
    latitude: 37.7794,
    longitude: -122.3891,
    capacity: 1100,
    current_waste_level: 770,
    waste_percentage: 70,
    waste_type: 'RECYCLABLE',
    battery_level: 91,
    temperature_c: 19.4,
  },
  {
    bin_id: 'BIN-123',
    name: 'Hospital Medical Hub East',
    location_name: 'Parnassus Ave Clinical Wing',
    latitude: 37.7632,
    longitude: -122.4580,
    capacity: 1200,
    current_waste_level: 1116,
    waste_percentage: 93,
    waste_type: 'HAZARDOUS',
    battery_level: 83,
    temperature_c: 22.1,
  },
  {
    bin_id: 'BIN-124',
    name: 'University Campus Student Union',
    location_name: 'Parnassus Central Quad',
    latitude: 37.7621,
    longitude: -122.4560,
    capacity: 1200,
    current_waste_level: 540,
    waste_percentage: 45,
    waste_type: 'ORGANIC',
    battery_level: 94,
    temperature_c: 19.8,
  },
  {
    bin_id: 'BIN-125',
    name: 'Twin Peaks Scenic Overlook',
    location_name: 'Christmas Tree Point Rd',
    latitude: 37.7544,
    longitude: -122.4477,
    capacity: 1500,
    current_waste_level: 420,
    waste_percentage: 28,
    waste_type: 'GENERAL',
    battery_level: 89,
    temperature_c: 16.9,
  }
];

// Seed Vehicles
const SEED_VEHICLES: Vehicle[] = [
  {
    vehicle_id: 'VEH-01',
    registration_number: 'ECO-TRK-742',
    vehicle_type: 'COMPACTOR_TRUCK',
    capacity_kg: 8500,
    current_load_kg: 2450,
    fuel_capacity_l: 180,
    current_fuel_l: 142,
    fuel_efficiency_km_per_l: 3.8,
    emission_factor_kg_per_l: 2.68,
    latitude: 37.7760,
    longitude: -122.4180,
    status: 'AVAILABLE',
    assigned_route_id: null,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    vehicle_id: 'VEH-02',
    registration_number: 'ECO-VAN-118',
    vehicle_type: 'ELECTRIC_VAN',
    capacity_kg: 3200,
    current_load_kg: 1890,
    fuel_capacity_l: 90, // equivalent kWh or clean diesel hybrid
    current_fuel_l: 78,
    fuel_efficiency_km_per_l: 8.5,
    emission_factor_kg_per_l: 0.85, // hybrid / green electric equivalent
    latitude: 37.7885,
    longitude: -122.4010,
    status: 'COLLECTING',
    assigned_route_id: 'ROUTE-PREV-01',
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    vehicle_id: 'VEH-03',
    registration_number: 'ECO-TRK-905',
    vehicle_type: 'COMPACTOR_TRUCK',
    capacity_kg: 9200,
    current_load_kg: 0,
    fuel_capacity_l: 200,
    current_fuel_l: 185,
    fuel_efficiency_km_per_l: 3.6,
    emission_factor_kg_per_l: 2.68,
    latitude: 37.7749,
    longitude: -122.4194,
    status: 'AVAILABLE',
    assigned_route_id: null,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    vehicle_id: 'VEH-04',
    registration_number: 'ECO-VAN-304',
    vehicle_type: 'STANDARD_TRUCK',
    capacity_kg: 5000,
    current_load_kg: 0,
    fuel_capacity_l: 120,
    current_fuel_l: 34, // Low fuel flag for alert
    fuel_efficiency_km_per_l: 5.2,
    emission_factor_kg_per_l: 2.45,
    latitude: 37.7749,
    longitude: -122.4194,
    status: 'MAINTENANCE',
    assigned_route_id: null,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    updated_at: new Date().toISOString(),
  }
];

export function calculateBinStatus(pct: number, settings: SystemSettings): WasteBin['status'] {
  if (pct >= settings.threshold_critical) return 'FULL';
  if (pct >= settings.threshold_medium) return 'HIGH';
  if (pct >= settings.threshold_low) return 'MEDIUM';
  return 'LOW';
}

class Database {
  private data: DatabaseSchema;
  private isLoaded = false;

  constructor() {
    this.data = this.getDefaultState();
  }

  private getDefaultState(): DatabaseSchema {
    const now = new Date().toISOString();
    const past = new Date(Date.now() - 86400000).toISOString();

    const bins: WasteBin[] = SEED_BINS_RAW.map((b) => ({
      ...b,
      status: calculateBinStatus(b.waste_percentage, DEFAULT_SETTINGS),
      last_collection_time: past,
      next_collection_time: new Date(Date.now() + 43200000).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 60).toISOString(),
      updated_at: now,
    }));

    // Generate historical telemetry for last 24 hours
    const waste_records: WasteRecord[] = [];
    bins.forEach((b) => {
      // 6 historical readings
      for (let i = 5; i >= 0; i--) {
        const time = new Date(Date.now() - i * 4 * 3600000).toISOString();
        const pastPct = Math.max(10, Math.min(100, Math.round(b.waste_percentage - i * 5 + (Math.random() * 4 - 2))));
        waste_records.push({
          id: `REC-${b.bin_id}-${i}`,
          bin_id: b.bin_id,
          timestamp: time,
          waste_level: Math.round((pastPct / 100) * b.capacity),
          waste_percentage: pastPct,
          temperature: +(b.temperature_c - i * 0.4).toFixed(1),
          rainfall_mm: i === 2 ? 1.2 : 0,
          humidity: 62 + i * 2,
          collection_status: pastPct >= 90 ? 'OVERFLOW_ALERT' : 'NORMAL',
        });
      }
    });

    const notifications: SystemNotification[] = [
      {
        id: 'NOTIF-01',
        title: 'Critical Fill Level Warning',
        message: 'Bin BIN-102 (Financial Tower East) reached 95% capacity. Immediate dispatch recommended.',
        severity: 'CRITICAL',
        category: 'BIN_OVERFLOW',
        related_id: 'BIN-102',
        read: false,
        created_at: new Date(Date.now() - 15 * 60000).toISOString(),
      },
      {
        id: 'NOTIF-02',
        title: 'High Fill Level Alert',
        message: 'Bin BIN-112 (Fisherman\'s Wharf Pier 39) reached 95% capacity.',
        severity: 'HIGH',
        category: 'BIN_OVERFLOW',
        related_id: 'BIN-112',
        read: false,
        created_at: new Date(Date.now() - 45 * 60000).toISOString(),
      },
      {
        id: 'NOTIF-03',
        title: 'Fleet Advisory: Low Fuel Level',
        message: 'Vehicle VEH-04 fuel level is below 30% (34L remaining). Flagged for maintenance/refuel.',
        severity: 'WARNING',
        category: 'VEHICLE_MAINTENANCE',
        related_id: 'VEH-04',
        read: false,
        created_at: new Date(Date.now() - 120 * 60000).toISOString(),
      },
      {
        id: 'NOTIF-04',
        title: 'Route Optimization Completed',
        message: 'Daily dynamic morning route generated with 28.4% estimated carbon reduction.',
        severity: 'INFO',
        category: 'ROUTE_DISPATCH',
        related_id: 'ROUTE-PREV-01',
        read: true,
        created_at: new Date(Date.now() - 240 * 60000).toISOString(),
      },
    ];

    const model_metrics: ModelMetrics = {
      mae: 3.42,
      mse: 18.76,
      rmse: 4.33,
      r2: 0.912,
      sample_count: 1420,
      last_trained: new Date(Date.now() - 86400000 * 2).toISOString(),
      features_used: [
        'current_level',
        'growth_rate_3hr',
        'hour_of_day_sin',
        'hour_of_day_cos',
        'day_of_week',
        'ambient_temp_c',
        'precipitation_mm',
        'waste_type_encoded',
      ],
    };

    const adminHash = bcrypt.hashSync('admin123', 10);
    const operatorHash = bcrypt.hashSync('operator123', 10);

    const seedUsers: User[] = [
      {
        id: 'USR-001',
        name: 'Eco Admin Officer',
        email: 'admin@ecotwin.ai',
        password_hash: adminHash,
        role: 'ADMIN',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'USR-002',
        name: 'City Fleet Operator',
        email: 'operator@ecotwin.ai',
        password_hash: operatorHash,
        role: 'OPERATOR',
        created_at: now,
        updated_at: now,
      },
    ];

    const seedPredictions: Prediction[] = bins.map((b, idx) => {
      const isCritical = b.waste_percentage >= 85;
      const isHigh = b.waste_percentage >= 70 && b.waste_percentage < 85;
      const isMedium = b.waste_percentage >= 40 && b.waste_percentage < 70;
      const risk_level: RiskLevel = isCritical ? 'CRITICAL' : isHigh ? 'HIGH' : isMedium ? 'MEDIUM' : 'LOW';
      const headroom = 100 - b.waste_percentage;
      const projectedGrowth = Math.min(headroom, Math.round(10 + (idx % 6) * 3));
      const predictedLevel = Math.min(100, b.waste_percentage + projectedGrowth);
      return {
        id: `PRED-${b.bin_id}-INIT`,
        bin_id: b.bin_id,
        current_level: b.waste_percentage,
        predicted_level: predictedLevel,
        prediction_horizon_hours: 12,
        risk_level,
        collection_required: predictedLevel >= 80 || b.waste_percentage >= 80,
        confidence_score: +(0.92 + (idx % 5) * 0.015).toFixed(2),
        predicted_overflow_time: new Date(Date.now() + Math.max(2, Math.round(headroom / 3)) * 3600000).toISOString(),
        created_at: now,
      };
    });

    const seedRoute: OptimizedRoute = {
      route_id: 'ROUTE-SEEDED-01',
      vehicle_id: 'VEH-01',
      vehicle_registration: 'CA-ECO-1092',
      status: 'COMPLETED',
      depot_location: {
        name: DEFAULT_SETTINGS.depot_name,
        latitude: DEFAULT_SETTINGS.depot_latitude,
        longitude: DEFAULT_SETTINGS.depot_longitude,
      },
      stops: [
        {
          stop_number: 1,
          bin_id: 'BIN-102',
          name: 'Financial Tower East',
          location_name: 'California St & Montgomery',
          latitude: 37.7925,
          longitude: -122.4025,
          waste_level_pct: 95,
          waste_kg: 332,
          collected: true,
        },
        {
          stop_number: 2,
          bin_id: 'BIN-105',
          name: 'Chinatown Gateway Station',
          location_name: 'Grant Ave & Bush St',
          latitude: 37.7907,
          longitude: -122.4058,
          waste_level_pct: 91,
          waste_kg: 318,
          collected: true,
        },
        {
          stop_number: 3,
          bin_id: 'BIN-107',
          name: 'North Beach Cafe Cluster',
          location_name: 'Columbus Ave & Green St',
          latitude: 37.7996,
          longitude: -122.4074,
          waste_level_pct: 88,
          waste_kg: 308,
          collected: true,
        },
        {
          stop_number: 4,
          bin_id: 'BIN-112',
          name: "Fisherman's Wharf Pier 39",
          location_name: 'The Embarcadero & Beach St',
          latitude: 37.8087,
          longitude: -122.4098,
          waste_level_pct: 95,
          waste_kg: 380,
          collected: true,
        },
      ],
      total_distance_km: 18.4,
      estimated_time_minutes: 48,
      bins_collected_count: 4,
      total_waste_collected_kg: 1338,
      baseline_distance_km: 38.6,
      distance_saved_km: 20.2,
      baseline_fuel_l: 10.2,
      optimized_fuel_l: 4.8,
      fuel_saved_l: 5.4,
      baseline_co2_kg: 27.3,
      optimized_co2_kg: 12.9,
      co2_saved_kg: 14.4,
      savings_percentage: 52.7,
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    };

    const seedCarbonRecords: CarbonRecord[] = [
      {
        id: 'CRB-REC-01',
        route_id: 'ROUTE-SEEDED-01',
        distance_km: 18.4,
        fuel_consumed_l: 4.8,
        fuel_saved_l: 5.4,
        emission_factor: 2.68,
        co2_emission_kg: 12.9,
        baseline_distance_km: 38.6,
        baseline_fuel_l: 10.2,
        baseline_co2_kg: 27.3,
        co2_reduction_kg: 14.4,
        savings_percentage: 52.7,
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      {
        id: 'CRB-REC-02',
        route_id: 'ROUTE-PRIOR-02',
        distance_km: 24.1,
        fuel_consumed_l: 6.3,
        fuel_saved_l: 3.2,
        emission_factor: 2.68,
        co2_emission_kg: 16.9,
        baseline_distance_km: 36.2,
        baseline_fuel_l: 9.5,
        baseline_co2_kg: 25.5,
        co2_reduction_kg: 8.6,
        savings_percentage: 33.7,
        timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
      },
    ];

    const seedDigitalTwins: DigitalTwinState[] = [
      {
        id: 'DT-SNAP-01',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        depot_name: DEFAULT_SETTINGS.depot_name,
        total_bins: bins.length,
        critical_bins_count: 3,
        high_bins_count: 5,
        collecting_vehicles_count: 1,
        city_ambient_temp_c: 19.8,
        simulation_speed_multiplier: 1.0,
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'DT-SNAP-02',
        timestamp: now,
        depot_name: DEFAULT_SETTINGS.depot_name,
        total_bins: bins.length,
        critical_bins_count: 3,
        high_bins_count: 6,
        collecting_vehicles_count: 2,
        city_ambient_temp_c: 20.2,
        simulation_speed_multiplier: 1.0,
        created_at: now,
      },
    ];

    return {
      users: seedUsers,
      bins,
      waste_records,
      vehicles: SEED_VEHICLES,
      predictions: seedPredictions,
      routes: [seedRoute],
      carbon_records: seedCarbonRecords,
      notifications,
      digital_twins: seedDigitalTwins,
      settings: DEFAULT_SETTINGS,
      model_metrics,
    };
  }

  public async init(): Promise<void> {
    if (this.isLoaded) return;

    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.data = this.getDefaultState();
        await this.save();
      }

      // Ensure seed users exist if file had empty users
      if (!this.data.users || this.data.users.length === 0) {
        this.seedUsersSync();
        await this.save();
      }

      // Schema safety checks: ensure array collections exist
      let schemaUpdated = false;
      const defaultState = this.getDefaultState();

      if (!Array.isArray(this.data.digital_twins) || this.data.digital_twins.length === 0) {
        this.data.digital_twins = defaultState.digital_twins;
        schemaUpdated = true;
      }
      if (!Array.isArray(this.data.predictions) || this.data.predictions.length === 0) {
        this.data.predictions = defaultState.predictions;
        schemaUpdated = true;
      }
      if (!Array.isArray(this.data.routes) || this.data.routes.length === 0) {
        this.data.routes = defaultState.routes;
        schemaUpdated = true;
      }
      if (!Array.isArray(this.data.carbon_records) || this.data.carbon_records.length === 0) {
        this.data.carbon_records = defaultState.carbon_records;
        schemaUpdated = true;
      }
      if (!this.data.settings) {
        this.data.settings = DEFAULT_SETTINGS;
        schemaUpdated = true;
      }
      if (!this.data.model_metrics) {
        this.data.model_metrics = defaultState.model_metrics;
        schemaUpdated = true;
      }

      if (schemaUpdated) {
        await this.save();
      }

      this.isLoaded = true;
    } catch (err) {
      console.warn('Database initialization warning, using in-memory state:', err);
      this.data = this.getDefaultState();
      this.isLoaded = true;
    }
  }

  private seedUsersSync(): void {
    const adminHash = bcrypt.hashSync('admin123', 10);
    const operatorHash = bcrypt.hashSync('operator123', 10);
    const now = new Date().toISOString();

    this.data.users = [
      {
        id: 'USR-001',
        name: 'Eco Admin Officer',
        email: 'admin@ecotwin.ai',
        password_hash: adminHash,
        role: 'ADMIN',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'USR-002',
        name: 'City Fleet Operator',
        email: 'operator@ecotwin.ai',
        password_hash: operatorHash,
        role: 'OPERATOR',
        created_at: now,
        updated_at: now,
      },
    ];
  }

  /**
   * Thread-safe atomic file persistence using temporary file rename
   */
  public async save(): Promise<void> {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpPath = `${DB_FILE}.tmp.${Date.now()}.${Math.random().toString(36).slice(2, 7)}`;
      fs.writeFileSync(tmpPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tmpPath, DB_FILE);
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  public saveSync(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpPath = `${DB_FILE}.tmp.${Date.now()}.${Math.random().toString(36).slice(2, 7)}`;
      fs.writeFileSync(tmpPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tmpPath, DB_FILE);
    } catch (err) {
      console.error('Failed to write database file synchronously:', err);
    }
  }

  // ==========================================
  // 1. USER MODEL CRUD
  // ==========================================
  public getUsers(): User[] {
    return [...this.data.users];
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    const clean = email.toLowerCase().trim();
    return this.data.users.find((u) => u.email.toLowerCase().trim() === clean);
  }

  public createUser(user: User): User {
    const existing = this.getUserById(user.id) || this.getUserByEmail(user.email);
    if (existing) {
      throw new Error(`User with ID ${user.id} or email ${user.email} already exists.`);
    }
    const created: User = {
      ...user,
      created_at: user.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.data.users.push(created);
    this.saveSync();
    return created;
  }

  public updateUser(id: string, updates: Partial<User>): User | null {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    const updated: User = {
      ...this.data.users[idx],
      ...updates,
      id, // Preserve ID
      updated_at: new Date().toISOString(),
    };
    this.data.users[idx] = updated;
    this.saveSync();
    return updated;
  }

  public deleteUser(id: string): boolean {
    const initialLen = this.data.users.length;
    this.data.users = this.data.users.filter((u) => u.id !== id);
    if (this.data.users.length !== initialLen) {
      this.saveSync();
      return true;
    }
    return false;
  }

  public setUsers(users: User[]): void {
    this.data.users = users;
    this.saveSync();
  }

  // ==========================================
  // 2. WASTE BIN MODEL CRUD
  // ==========================================
  public getBins(filters?: { status?: BinStatus; waste_type?: WasteType; search?: string }): WasteBin[] {
    let result = [...this.data.bins];
    if (filters) {
      if (filters.status) {
        result = result.filter((b) => b.status === filters.status);
      }
      if (filters.waste_type) {
        result = result.filter((b) => b.waste_type === filters.waste_type);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        result = result.filter(
          (b) =>
            b.bin_id.toLowerCase().includes(q) ||
            b.name.toLowerCase().includes(q) ||
            b.location_name.toLowerCase().includes(q)
        );
      }
    }
    return result;
  }

  public getBinById(id: string): WasteBin | undefined {
    return this.data.bins.find((b) => b.bin_id === id);
  }

  public createBin(bin: WasteBin): WasteBin {
    const existing = this.getBinById(bin.bin_id);
    if (existing) {
      throw new Error(`Bin with ID ${bin.bin_id} already exists.`);
    }
    const created: WasteBin = {
      ...bin,
      created_at: bin.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.data.bins.push(created);
    this.saveSync();
    return created;
  }

  public addBin(bin: WasteBin): void {
    this.createBin(bin);
  }

  public updateBin(bin: WasteBin): WasteBin {
    const idx = this.data.bins.findIndex((b) => b.bin_id === bin.bin_id);
    const updated: WasteBin = {
      ...bin,
      updated_at: new Date().toISOString(),
    };
    if (idx >= 0) {
      this.data.bins[idx] = updated;
    } else {
      this.data.bins.push(updated);
    }
    this.saveSync();
    return updated;
  }

  public patchBin(id: string, updates: Partial<WasteBin>): WasteBin | null {
    const idx = this.data.bins.findIndex((b) => b.bin_id === id);
    if (idx === -1) return null;
    const updated: WasteBin = {
      ...this.data.bins[idx],
      ...updates,
      bin_id: id,
      updated_at: new Date().toISOString(),
    };
    this.data.bins[idx] = updated;
    this.saveSync();
    return updated;
  }

  public deleteBin(id: string): boolean {
    const initialLen = this.data.bins.length;
    this.data.bins = this.data.bins.filter((b) => b.bin_id !== id);
    if (this.data.bins.length !== initialLen) {
      this.saveSync();
      return true;
    }
    return false;
  }

  public setBins(bins: WasteBin[]): void {
    this.data.bins = bins;
    this.saveSync();
  }

  // ==========================================
  // 3. WASTE RECORD (TELEMETRY) MODEL CRUD
  // ==========================================
  public getWasteRecords(filters?: { bin_id?: string; limit?: number }): WasteRecord[] {
    let records = [...this.data.waste_records];
    if (filters?.bin_id) {
      records = records.filter((r) => r.bin_id === filters.bin_id);
    }
    records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    if (filters?.limit && filters.limit > 0) {
      records = records.slice(0, filters.limit);
    }
    return records;
  }

  public getWasteRecordById(id: string): WasteRecord | undefined {
    return this.data.waste_records.find((r) => r.id === id);
  }

  public createWasteRecord(record: WasteRecord): WasteRecord {
    const created: WasteRecord = {
      ...record,
      timestamp: record.timestamp || new Date().toISOString(),
    };
    this.data.waste_records.push(created);
    this.saveSync();
    return created;
  }

  public updateWasteRecord(id: string, updates: Partial<WasteRecord>): WasteRecord | null {
    const idx = this.data.waste_records.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    const updated: WasteRecord = {
      ...this.data.waste_records[idx],
      ...updates,
      id,
    };
    this.data.waste_records[idx] = updated;
    this.saveSync();
    return updated;
  }

  public deleteWasteRecord(id: string): boolean {
    const initialLen = this.data.waste_records.length;
    this.data.waste_records = this.data.waste_records.filter((r) => r.id !== id);
    if (this.data.waste_records.length !== initialLen) {
      this.saveSync();
      return true;
    }
    return false;
  }

  public setWasteRecords(records: WasteRecord[]): void {
    this.data.waste_records = records;
    this.saveSync();
  }

  // ==========================================
  // 4. FLEET VEHICLE MODEL CRUD
  // ==========================================
  public getVehicles(filters?: { status?: VehicleStatus }): Vehicle[] {
    let result = [...this.data.vehicles];
    if (filters?.status) {
      result = result.filter((v) => v.status === filters.status);
    }
    return result;
  }

  public getVehicleById(id: string): Vehicle | undefined {
    return this.data.vehicles.find((v) => v.vehicle_id === id);
  }

  public createVehicle(vehicle: Vehicle): Vehicle {
    const existing = this.getVehicleById(vehicle.vehicle_id);
    if (existing) {
      throw new Error(`Vehicle ${vehicle.vehicle_id} already exists.`);
    }
    const created: Vehicle = {
      ...vehicle,
      updated_at: new Date().toISOString(),
    };
    this.data.vehicles.push(created);
    this.saveSync();
    return created;
  }

  public updateVehicle(id: string, updates: Partial<Vehicle>): Vehicle | null {
    const idx = this.data.vehicles.findIndex((v) => v.vehicle_id === id);
    if (idx === -1) return null;
    const updated: Vehicle = {
      ...this.data.vehicles[idx],
      ...updates,
      vehicle_id: id,
      updated_at: new Date().toISOString(),
    };
    this.data.vehicles[idx] = updated;
    this.saveSync();
    return updated;
  }

  public deleteVehicle(id: string): boolean {
    const initialLen = this.data.vehicles.length;
    this.data.vehicles = this.data.vehicles.filter((v) => v.vehicle_id !== id);
    if (this.data.vehicles.length !== initialLen) {
      this.saveSync();
      return true;
    }
    return false;
  }

  public setVehicles(vehicles: Vehicle[]): void {
    this.data.vehicles = vehicles;
    this.saveSync();
  }

  // ==========================================
  // 5. PREDICTION MODEL CRUD
  // ==========================================
  public getPredictions(filters?: { risk_level?: RiskLevel; bin_id?: string }): Prediction[] {
    let result = [...this.data.predictions];
    if (filters?.risk_level) {
      result = result.filter((p) => p.risk_level === filters.risk_level);
    }
    if (filters?.bin_id) {
      result = result.filter((p) => p.bin_id === filters.bin_id);
    }
    return result;
  }

  public getPredictionById(id: string): Prediction | undefined {
    return this.data.predictions.find((p) => p.id === id);
  }

  public getPredictionByBinId(bin_id: string): Prediction | undefined {
    return this.data.predictions.find((p) => p.bin_id === bin_id);
  }

  public createPrediction(prediction: Prediction): Prediction {
    const created: Prediction = {
      ...prediction,
      created_at: prediction.created_at || new Date().toISOString(),
    };
    this.data.predictions.push(created);
    this.saveSync();
    return created;
  }

  public updatePrediction(id: string, updates: Partial<Prediction>): Prediction | null {
    const idx = this.data.predictions.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const updated: Prediction = {
      ...this.data.predictions[idx],
      ...updates,
      id,
    };
    this.data.predictions[idx] = updated;
    this.saveSync();
    return updated;
  }

  public deletePrediction(id: string): boolean {
    const initialLen = this.data.predictions.length;
    this.data.predictions = this.data.predictions.filter((p) => p.id !== id);
    if (this.data.predictions.length !== initialLen) {
      this.saveSync();
      return true;
    }
    return false;
  }

  public setPredictions(predictions: Prediction[]): void {
    this.data.predictions = predictions;
    this.saveSync();
  }

  // ==========================================
  // 6. ROUTE MODEL CRUD
  // ==========================================
  public getRoutes(filters?: { status?: RouteStatus; vehicle_id?: string }): OptimizedRoute[] {
    let result = [...this.data.routes];
    if (filters?.status) {
      result = result.filter((r) => r.status === filters.status);
    }
    if (filters?.vehicle_id) {
      result = result.filter((r) => r.vehicle_id === filters.vehicle_id);
    }
    return result;
  }

  public getRouteById(id: string): OptimizedRoute | undefined {
    return this.data.routes.find((r) => r.route_id === id);
  }

  public createRoute(route: OptimizedRoute): OptimizedRoute {
    const created: OptimizedRoute = {
      ...route,
      created_at: route.created_at || new Date().toISOString(),
    };
    this.data.routes.push(created);
    this.saveSync();
    return created;
  }

  public updateRoute(id: string, updates: Partial<OptimizedRoute>): OptimizedRoute | null {
    const idx = this.data.routes.findIndex((r) => r.route_id === id);
    if (idx === -1) return null;
    const updated: OptimizedRoute = {
      ...this.data.routes[idx],
      ...updates,
      route_id: id,
    };
    this.data.routes[idx] = updated;
    this.saveSync();
    return updated;
  }

  public deleteRoute(id: string): boolean {
    const initialLen = this.data.routes.length;
    this.data.routes = this.data.routes.filter((r) => r.route_id !== id);
    if (this.data.routes.length !== initialLen) {
      this.saveSync();
      return true;
    }
    return false;
  }

  public setRoutes(routes: OptimizedRoute[]): void {
    this.data.routes = routes;
    this.saveSync();
  }

  // ==========================================
  // 7. CARBON RECORD MODEL CRUD
  // ==========================================
  public getCarbonRecords(filters?: { route_id?: string }): CarbonRecord[] {
    let records = [...this.data.carbon_records];
    if (filters?.route_id) {
      records = records.filter((r) => r.route_id === filters.route_id);
    }
    records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return records;
  }

  public getCarbonRecordById(id: string): CarbonRecord | undefined {
    return this.data.carbon_records.find((r) => r.id === id);
  }

  public createCarbonRecord(record: CarbonRecord): CarbonRecord {
    const created: CarbonRecord = {
      ...record,
      timestamp: record.timestamp || new Date().toISOString(),
    };
    this.data.carbon_records.push(created);
    this.saveSync();
    return created;
  }

  public updateCarbonRecord(id: string, updates: Partial<CarbonRecord>): CarbonRecord | null {
    const idx = this.data.carbon_records.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    const updated: CarbonRecord = {
      ...this.data.carbon_records[idx],
      ...updates,
      id,
    };
    this.data.carbon_records[idx] = updated;
    this.saveSync();
    return updated;
  }

  public deleteCarbonRecord(id: string): boolean {
    const initialLen = this.data.carbon_records.length;
    this.data.carbon_records = this.data.carbon_records.filter((r) => r.id !== id);
    if (this.data.carbon_records.length !== initialLen) {
      this.saveSync();
      return true;
    }
    return false;
  }

  public setCarbonRecords(records: CarbonRecord[]): void {
    this.data.carbon_records = records;
    this.saveSync();
  }

  // ==========================================
  // 8. NOTIFICATION MODEL CRUD
  // ==========================================
  public getNotifications(filters?: {
    read?: boolean;
    severity?: NotificationSeverity;
    category?: NotificationCategory;
  }): SystemNotification[] {
    let result = [...this.data.notifications];
    if (filters) {
      if (typeof filters.read === 'boolean') {
        result = result.filter((n) => n.read === filters.read);
      }
      if (filters.severity) {
        result = result.filter((n) => n.severity === filters.severity);
      }
      if (filters.category) {
        result = result.filter((n) => n.category === filters.category);
      }
    }
    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return result;
  }

  public getNotificationById(id: string): SystemNotification | undefined {
    return this.data.notifications.find((n) => n.id === id);
  }

  public createNotification(notification: SystemNotification): SystemNotification {
    const created: SystemNotification = {
      ...notification,
      created_at: notification.created_at || new Date().toISOString(),
    };
    this.data.notifications.unshift(created);
    this.saveSync();
    return created;
  }

  public updateNotification(id: string, updates: Partial<SystemNotification>): SystemNotification | null {
    const idx = this.data.notifications.findIndex((n) => n.id === id);
    if (idx === -1) return null;
    const updated: SystemNotification = {
      ...this.data.notifications[idx],
      ...updates,
      id,
    };
    this.data.notifications[idx] = updated;
    this.saveSync();
    return updated;
  }

  public markNotificationRead(id: string): boolean {
    const notif = this.data.notifications.find((n) => n.id === id);
    if (notif) {
      notif.read = true;
      this.saveSync();
      return true;
    }
    return false;
  }

  public markAllNotificationsRead(): number {
    let count = 0;
    for (const notif of this.data.notifications) {
      if (!notif.read) {
        notif.read = true;
        count++;
      }
    }
    if (count > 0) {
      this.saveSync();
    }
    return count;
  }

  public deleteNotification(id: string): boolean {
    const initialLen = this.data.notifications.length;
    this.data.notifications = this.data.notifications.filter((n) => n.id !== id);
    if (this.data.notifications.length !== initialLen) {
      this.saveSync();
      return true;
    }
    return false;
  }

  public setNotifications(notifs: SystemNotification[]): void {
    this.data.notifications = notifs;
    this.saveSync();
  }

  // ==========================================
  // 9. DIGITAL TWIN STATE MODEL CRUD
  // ==========================================
  public getDigitalTwinStates(limit = 50): DigitalTwinState[] {
    const states = [...(this.data.digital_twins || [])];
    states.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return states.slice(0, limit);
  }

  public getDigitalTwinStateById(id: string): DigitalTwinState | undefined {
    return (this.data.digital_twins || []).find((s) => s.id === id);
  }

  public getLatestDigitalTwinState(): DigitalTwinState | undefined {
    const states = this.getDigitalTwinStates(1);
    return states.length > 0 ? states[0] : undefined;
  }

  public createDigitalTwinState(state: DigitalTwinState): DigitalTwinState {
    if (!this.data.digital_twins) {
      this.data.digital_twins = [];
    }
    const created: DigitalTwinState = {
      ...state,
      created_at: state.created_at || new Date().toISOString(),
    };
    this.data.digital_twins.unshift(created);
    // Retain up to 200 state records
    if (this.data.digital_twins.length > 200) {
      this.data.digital_twins = this.data.digital_twins.slice(0, 200);
    }
    this.saveSync();
    return created;
  }

  public updateDigitalTwinState(id: string, updates: Partial<DigitalTwinState>): DigitalTwinState | null {
    if (!this.data.digital_twins) return null;
    const idx = this.data.digital_twins.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    const updated: DigitalTwinState = {
      ...this.data.digital_twins[idx],
      ...updates,
      id,
    };
    this.data.digital_twins[idx] = updated;
    this.saveSync();
    return updated;
  }

  public deleteDigitalTwinState(id: string): boolean {
    if (!this.data.digital_twins) return false;
    const initialLen = this.data.digital_twins.length;
    this.data.digital_twins = this.data.digital_twins.filter((s) => s.id !== id);
    if (this.data.digital_twins.length !== initialLen) {
      this.saveSync();
      return true;
    }
    return false;
  }

  // ==========================================
  // 10. SYSTEM SETTINGS & METRICS
  // ==========================================
  public getSettings(): SystemSettings {
    return { ...this.data.settings };
  }

  public setSettings(settings: SystemSettings): void {
    this.data.settings = { ...settings };
    this.saveSync();
  }

  public updateSettings(updates: Partial<SystemSettings>): SystemSettings {
    this.data.settings = {
      ...this.data.settings,
      ...updates,
    };
    this.saveSync();
    return { ...this.data.settings };
  }

  public getModelMetrics(): ModelMetrics {
    return { ...this.data.model_metrics };
  }

  public setModelMetrics(metrics: ModelMetrics): void {
    this.data.model_metrics = { ...metrics };
    this.saveSync();
  }

  // ==========================================
  // 11. DATABASE CONNECTION HEALTH CHECK
  // ==========================================
  public checkHealth(): {
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
      digital_twins: number;
    };
  } {
    const startTime = performance.now();
    try {
      const fileExists = fs.existsSync(DB_FILE);
      const counts = {
        users: this.data.users ? this.data.users.length : 0,
        bins: this.data.bins ? this.data.bins.length : 0,
        vehicles: this.data.vehicles ? this.data.vehicles.length : 0,
        routes: this.data.routes ? this.data.routes.length : 0,
        predictions: this.data.predictions ? this.data.predictions.length : 0,
        carbon_records: this.data.carbon_records ? this.data.carbon_records.length : 0,
        waste_records: this.data.waste_records ? this.data.waste_records.length : 0,
        notifications: this.data.notifications ? this.data.notifications.length : 0,
        digital_twins: this.data.digital_twins ? this.data.digital_twins.length : 0,
      };
      const readLatencyMs = Math.round((performance.now() - startTime) * 100) / 100;

      return {
        status: 'connected',
        storage_type: 'JSON Atomic Persistence (Thread-Safe)',
        file_path: DB_FILE,
        file_exists: fileExists,
        read_latency_ms: readLatencyMs,
        counts,
      };
    } catch (err) {
      return {
        status: 'error',
        storage_type: 'JSON Atomic Persistence',
        file_path: DB_FILE,
        file_exists: false,
        read_latency_ms: Math.round((performance.now() - startTime) * 100) / 100,
        counts: {
          users: 0,
          bins: 0,
          vehicles: 0,
          routes: 0,
          predictions: 0,
          carbon_records: 0,
          waste_records: 0,
          notifications: 0,
          digital_twins: 0,
        },
      };
    }
  }
}


export const db = new Database();
