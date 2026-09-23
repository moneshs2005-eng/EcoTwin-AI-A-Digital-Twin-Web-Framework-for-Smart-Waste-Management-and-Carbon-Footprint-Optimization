/**
 * EcoTwin AI - Phase 2 Comprehensive Database & CRUD Verification Suite
 * Verifies schemas, seed/demo data, and full CRUD operations across all 9 domain models.
 */

import { db } from '../src/server/db';
import {
  User,
  WasteBin,
  WasteRecord,
  Vehicle,
  Prediction,
  OptimizedRoute,
  CarbonRecord,
  SystemNotification,
  DigitalTwinState,
} from '../src/types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runDatabaseCrudSuite() {
  console.log('==================================================');
  console.log('  ECOTWIN AI - PHASE 2 DATABASE & CRUD TEST SUITE');
  console.log('==================================================');

  // Initialize DB
  await db.init();

  // ----------------------------------------------------
  // TEST 1: Schema Integrity & Seed Data Presence
  // ----------------------------------------------------
  console.log('\n[1/10] Verifying Model Schemas & Demo/Seed Data...');
  const health = db.checkHealth();
  assert(health.status === 'connected', 'Database connection status is connected');
  assert(health.file_exists === true, 'Underlying JSON database storage file exists');
  assert(health.counts.users >= 2, `Users collection seeded (Found: ${health.counts.users})`);
  assert(health.counts.bins === 25, `Bins collection seeded across Metro districts (Found: ${health.counts.bins})`);
  assert(health.counts.waste_records >= 150, `Historical telemetry records seeded (Found: ${health.counts.waste_records})`);
  assert(health.counts.vehicles >= 4, `Fleet vehicles collection seeded (Found: ${health.counts.vehicles})`);
  assert(health.counts.predictions >= 25, `ML fill predictions collection seeded (Found: ${health.counts.predictions})`);
  assert(health.counts.routes >= 1, `Optimized collection routes seeded (Found: ${health.counts.routes})`);
  assert(health.counts.carbon_records >= 2, `Carbon mitigation records seeded (Found: ${health.counts.carbon_records})`);
  assert(health.counts.notifications >= 4, `System notifications seeded (Found: ${health.counts.notifications})`);
  assert(health.counts.digital_twins >= 2, `Digital Twin state snapshots seeded (Found: ${health.counts.digital_twins})`);

  // ----------------------------------------------------
  // TEST 2: User Model CRUD Operations
  // ----------------------------------------------------
  console.log('\n[2/10] Testing User Model CRUD Operations...');
  const testUserId = `USR-TEST-${Date.now()}`;
  const testUser: User = {
    id: testUserId,
    name: 'Field Operations Specialist',
    email: `field.agent.${Date.now()}@ecotwin.ai`,
    password_hash: 'hashed_pw_demo_test',
    role: 'OPERATOR',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // CREATE
  const createdUser = db.createUser(testUser);
  assert(createdUser.id === testUserId, 'User CREATE: Successfully created test user');

  // READ (byId, byEmail)
  const readUserById = db.getUserById(testUserId);
  assert(readUserById?.name === 'Field Operations Specialist', 'User READ: Fetched user by unique ID');
  const readUserByEmail = db.getUserByEmail(testUser.email.toUpperCase());
  assert(readUserByEmail?.id === testUserId, 'User READ: Fetched user by email (case-insensitive)');

  // UPDATE
  const updatedUser = db.updateUser(testUserId, { name: 'Senior Field Lead', role: 'ADMIN' });
  assert(updatedUser?.name === 'Senior Field Lead' && updatedUser?.role === 'ADMIN', 'User UPDATE: Updated user attributes');

  // DELETE
  const userDeleted = db.deleteUser(testUserId);
  assert(userDeleted === true, 'User DELETE: Successfully removed user');
  assert(db.getUserById(testUserId) === undefined, 'User DELETE: User no longer retrievable');

  // ----------------------------------------------------
  // TEST 3: Bin Model CRUD Operations
  // ----------------------------------------------------
  console.log('\n[3/10] Testing Bin Model CRUD Operations...');
  const testBinId = `BIN-TEST-${Date.now()}`;
  const testBin: WasteBin = {
    bin_id: testBinId,
    name: 'Temporary Event EcoStation',
    location_name: 'Civic Center Green Plaza',
    latitude: 37.7793,
    longitude: -122.4182,
    capacity: 240,
    current_waste_level: 120,
    waste_percentage: 50,
    waste_type: 'ORGANIC',
    temperature_c: 21.4,
    battery_level: 98,
    status: 'MEDIUM',
    last_collection_time: new Date().toISOString(),
    next_collection_time: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // CREATE
  const createdBin = db.createBin(testBin);
  assert(createdBin.bin_id === testBinId, 'Bin CREATE: Successfully added new smart bin');

  // READ & FILTER
  const fetchedBin = db.getBinById(testBinId);
  assert(fetchedBin?.name === 'Temporary Event EcoStation', 'Bin READ: Fetched bin by ID');
  const organicBins = db.getBins({ waste_type: 'ORGANIC' });
  assert(organicBins.some((b) => b.bin_id === testBinId), 'Bin FILTER: Filtered bins by waste type (ORGANIC)');
  const searchedBins = db.getBins({ search: 'Civic Center' });
  assert(searchedBins.some((b) => b.bin_id === testBinId), 'Bin SEARCH: Found bin by location query keyword');

  // UPDATE & PATCH
  const patchedBin = db.patchBin(testBinId, { waste_percentage: 92, status: 'FULL' });
  assert(patchedBin?.waste_percentage === 92 && patchedBin?.status === 'FULL', 'Bin PATCH: Updated waste fill level and status');

  // DELETE
  const binDeleted = db.deleteBin(testBinId);
  assert(binDeleted === true, 'Bin DELETE: Removed bin from inventory');
  assert(db.getBinById(testBinId) === undefined, 'Bin DELETE: Confirmed bin is purged');

  // ----------------------------------------------------
  // TEST 4: Waste Record Model CRUD Operations
  // ----------------------------------------------------
  console.log('\n[4/10] Testing Waste Record Model CRUD Operations...');
  const testRecordId = `REC-TEST-${Date.now()}`;
  const testRecord: WasteRecord = {
    id: testRecordId,
    bin_id: 'BIN-101',
    timestamp: new Date().toISOString(),
    waste_level: 180,
    waste_percentage: 75,
    temperature: 22.0,
    rainfall_mm: 0.5,
    humidity: 65,
    collection_status: 'NORMAL',
  };

  // CREATE
  const createdRec = db.createWasteRecord(testRecord);
  assert(createdRec.id === testRecordId, 'WasteRecord CREATE: Recorded sensor telemetry observation');

  // READ
  const fetchedRec = db.getWasteRecordById(testRecordId);
  assert(fetchedRec?.waste_level === 180, 'WasteRecord READ: Retrieved record by ID');
  const bin101Records = db.getWasteRecords({ bin_id: 'BIN-101', limit: 5 });
  assert(bin101Records.length <= 5 && bin101Records.some((r) => r.id === testRecordId), 'WasteRecord FILTER: Filtered by bin_id with limit');

  // UPDATE
  const updatedRec = db.updateWasteRecord(testRecordId, { humidity: 72, rainfall_mm: 1.2 });
  assert(updatedRec?.humidity === 72 && updatedRec?.rainfall_mm === 1.2, 'WasteRecord UPDATE: Mutated telemetry properties');

  // DELETE
  const recDeleted = db.deleteWasteRecord(testRecordId);
  assert(recDeleted === true, 'WasteRecord DELETE: Deleted telemetry record');
  assert(db.getWasteRecordById(testRecordId) === undefined, 'WasteRecord DELETE: Verified record absent');

  // ----------------------------------------------------
  // TEST 5: Fleet Vehicle Model CRUD Operations
  // ----------------------------------------------------
  console.log('\n[5/10] Testing Fleet Vehicle Model CRUD Operations...');
  const testVehicleId = `VEH-TEST-${Date.now()}`;
  const testVehicle: Vehicle = {
    vehicle_id: testVehicleId,
    registration_number: 'CA-TEST-9901',
    vehicle_type: 'ELECTRIC_VAN',
    capacity_kg: 8500,
    current_load_kg: 0,
    fuel_capacity_l: 300,
    current_fuel_l: 280,
    fuel_efficiency_km_per_l: 5.2,
    emission_factor_kg_per_l: 0.15, // Low emissions electric/hybrid
    status: 'AVAILABLE',
    latitude: 37.7749,
    longitude: -122.4194,
    assigned_route_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // CREATE
  const createdVehicle = db.createVehicle(testVehicle);
  assert(createdVehicle.vehicle_id === testVehicleId, 'Vehicle CREATE: Provisioned new fleet compactor');

  // READ
  const fetchedVehicle = db.getVehicleById(testVehicleId);
  assert(fetchedVehicle?.registration_number === 'CA-TEST-9901', 'Vehicle READ: Retrieved vehicle by ID');
  const availableVehicles = db.getVehicles({ status: 'AVAILABLE' });
  assert(availableVehicles.some((v) => v.vehicle_id === testVehicleId), 'Vehicle FILTER: Filtered fleet by AVAILABLE status');

  // UPDATE
  const updatedVehicle = db.updateVehicle(testVehicleId, { status: 'COLLECTING', current_load_kg: 2400 });
  assert(updatedVehicle?.status === 'COLLECTING' && updatedVehicle?.current_load_kg === 2400, 'Vehicle UPDATE: Dispatched vehicle and updated payload');

  // DELETE
  const vehicleDeleted = db.deleteVehicle(testVehicleId);
  assert(vehicleDeleted === true, 'Vehicle DELETE: Decommissioned test vehicle');
  assert(db.getVehicleById(testVehicleId) === undefined, 'Vehicle DELETE: Vehicle successfully removed');

  // ----------------------------------------------------
  // TEST 6: Prediction Model CRUD Operations
  // ----------------------------------------------------
  console.log('\n[6/10] Testing Prediction Model CRUD Operations...');
  const testPredId = `PRED-TEST-${Date.now()}`;
  const testPred: Prediction = {
    id: testPredId,
    bin_id: 'BIN-101',
    current_level: 70,
    predicted_level: 94,
    prediction_horizon_hours: 12,
    risk_level: 'CRITICAL',
    collection_required: true,
    confidence_score: 0.95,
    predicted_overflow_time: new Date(Date.now() + 4 * 3600000).toISOString(),
    created_at: new Date().toISOString(),
  };

  // CREATE
  const createdPred = db.createPrediction(testPred);
  assert(createdPred.id === testPredId, 'Prediction CREATE: Saved regression fill prediction');

  // READ
  const fetchedPred = db.getPredictionById(testPredId);
  assert(fetchedPred?.predicted_level === 94, 'Prediction READ: Fetched prediction by ID');
  const criticalPreds = db.getPredictions({ risk_level: 'CRITICAL' });
  assert(criticalPreds.some((p) => p.id === testPredId), 'Prediction FILTER: Filtered by risk_level CRITICAL');

  // UPDATE
  const updatedPred = db.updatePrediction(testPredId, { confidence_score: 0.98, collection_required: true });
  assert(updatedPred?.confidence_score === 0.98, 'Prediction UPDATE: Updated confidence score');

  // DELETE
  const predDeleted = db.deletePrediction(testPredId);
  assert(predDeleted === true, 'Prediction DELETE: Deleted test prediction record');
  assert(db.getPredictionById(testPredId) === undefined, 'Prediction DELETE: Verified record purged');

  // ----------------------------------------------------
  // TEST 7: Route Model CRUD Operations
  // ----------------------------------------------------
  console.log('\n[7/10] Testing Route Model CRUD Operations...');
  const testRouteId = `ROUTE-TEST-${Date.now()}`;
  const testRoute: OptimizedRoute = {
    route_id: testRouteId,
    vehicle_id: 'VEH-01',
    vehicle_registration: 'CA-ECO-1092',
    status: 'PLANNED',
    depot_location: {
      name: 'Central Depot',
      latitude: 37.7749,
      longitude: -122.4194,
    },
    stops: [
      {
        stop_number: 1,
        bin_id: 'BIN-101',
        name: 'Harbor Walk EcoStation A',
        location_name: 'Ferry Terminal',
        latitude: 37.7955,
        longitude: -122.3937,
        waste_level_pct: 88,
        waste_kg: 211,
        collected: false,
      },
    ],
    total_distance_km: 14.2,
    estimated_time_minutes: 35,
    bins_collected_count: 1,
    total_waste_collected_kg: 211,
    baseline_distance_km: 26.5,
    distance_saved_km: 12.3,
    baseline_fuel_l: 7.0,
    optimized_fuel_l: 3.7,
    fuel_saved_l: 3.3,
    baseline_co2_kg: 18.8,
    optimized_co2_kg: 9.9,
    co2_saved_kg: 8.9,
    savings_percentage: 47.3,
    created_at: new Date().toISOString(),
  };

  // CREATE
  const createdRoute = db.createRoute(testRoute);
  assert(createdRoute.route_id === testRouteId, 'Route CREATE: Generated and stored CVRP dispatch route');

  // READ
  const fetchedRoute = db.getRouteById(testRouteId);
  assert(fetchedRoute?.total_distance_km === 14.2, 'Route READ: Fetched route by ID');
  const plannedRoutes = db.getRoutes({ status: 'PLANNED' });
  assert(plannedRoutes.some((r) => r.route_id === testRouteId), 'Route FILTER: Filtered routes by PLANNED status');

  // UPDATE
  const updatedRoute = db.updateRoute(testRouteId, { status: 'ACTIVE', estimated_time_minutes: 30 });
  assert(updatedRoute?.status === 'ACTIVE' && updatedRoute?.estimated_time_minutes === 30, 'Route UPDATE: Transitioned status to ACTIVE');

  // DELETE
  const routeDeleted = db.deleteRoute(testRouteId);
  assert(routeDeleted === true, 'Route DELETE: Successfully cancelled and purged route');
  assert(db.getRouteById(testRouteId) === undefined, 'Route DELETE: Route confirmed removed');

  // ----------------------------------------------------
  // TEST 8: Carbon Record Model CRUD Operations
  // ----------------------------------------------------
  console.log('\n[8/10] Testing Carbon Record Model CRUD Operations...');
  const testCarbonId = `CRB-TEST-${Date.now()}`;
  const testCarbon: CarbonRecord = {
    id: testCarbonId,
    route_id: 'ROUTE-TEST-REF',
    distance_km: 19.5,
    fuel_consumed_l: 5.1,
    fuel_saved_l: 4.2,
    emission_factor: 2.68,
    co2_emission_kg: 13.7,
    baseline_distance_km: 35.4,
    baseline_fuel_l: 9.3,
    baseline_co2_kg: 24.9,
    co2_reduction_kg: 11.2,
    savings_percentage: 45.0,
    timestamp: new Date().toISOString(),
  };

  // CREATE
  const createdCarbon = db.createCarbonRecord(testCarbon);
  assert(createdCarbon.id === testCarbonId, 'CarbonRecord CREATE: Recorded GHG Scope 1 emission reduction');

  // READ
  const fetchedCarbon = db.getCarbonRecordById(testCarbonId);
  assert(fetchedCarbon?.co2_reduction_kg === 11.2, 'CarbonRecord READ: Retrieved emission entry by ID');
  const routeCarbon = db.getCarbonRecords({ route_id: 'ROUTE-TEST-REF' });
  assert(routeCarbon.some((c) => c.id === testCarbonId), 'CarbonRecord FILTER: Filtered by route_id');

  // UPDATE
  const updatedCarbon = db.updateCarbonRecord(testCarbonId, { co2_reduction_kg: 12.5, savings_percentage: 50.2 });
  assert(updatedCarbon?.co2_reduction_kg === 12.5, 'CarbonRecord UPDATE: Adjusted carbon reduction figures');

  // DELETE
  const carbonDeleted = db.deleteCarbonRecord(testCarbonId);
  assert(carbonDeleted === true, 'CarbonRecord DELETE: Successfully deleted carbon entry');
  assert(db.getCarbonRecordById(testCarbonId) === undefined, 'CarbonRecord DELETE: Entry no longer present');

  // ----------------------------------------------------
  // TEST 9: Notification & Digital Twin CRUD Operations
  // ----------------------------------------------------
  console.log('\n[9/10] Testing Notification & Digital Twin State Models...');
  
  // Notification CRUD
  const testNotifId = `NOTIF-TEST-${Date.now()}`;
  const testNotif: SystemNotification = {
    id: testNotifId,
    title: 'Sensor Calibration Notice',
    message: 'Bin BIN-104 sensor firmware updated successfully.',
    severity: 'INFO',
    category: 'SYSTEM',
    related_id: 'BIN-104',
    read: false,
    created_at: new Date().toISOString(),
  };

  const createdNotif = db.createNotification(testNotif);
  assert(createdNotif.id === testNotifId, 'Notification CREATE: Dispatched test system notification');

  const unreadNotifs = db.getNotifications({ read: false });
  assert(unreadNotifs.some((n) => n.id === testNotifId), 'Notification READ: Retrieved unread notifications');

  const markedRead = db.markNotificationRead(testNotifId);
  assert(markedRead === true, 'Notification UPDATE: Marked individual notification as read');
  assert(db.getNotificationById(testNotifId)?.read === true, 'Notification UPDATE: Verified read attribute is true');

  const notifDeleted = db.deleteNotification(testNotifId);
  assert(notifDeleted === true, 'Notification DELETE: Removed notification from feed');

  // Digital Twin CRUD
  const testTwinId = `DT-TEST-${Date.now()}`;
  const testTwin: DigitalTwinState = {
    id: testTwinId,
    timestamp: new Date().toISOString(),
    depot_name: 'Metro EcoDepot & Resource Recovery Central',
    total_bins: 25,
    critical_bins_count: 4,
    high_bins_count: 7,
    collecting_vehicles_count: 2,
    city_ambient_temp_c: 22.8,
    simulation_speed_multiplier: 1.0,
    created_at: new Date().toISOString(),
  };

  const createdTwin = db.createDigitalTwinState(testTwin);
  assert(createdTwin.id === testTwinId, 'DigitalTwin CREATE: Captured digital twin state snapshot');

  const latestTwin = db.getLatestDigitalTwinState();
  assert(latestTwin?.id === testTwinId, 'DigitalTwin READ: Retrieved latest physical city twin snapshot');

  const updatedTwin = db.updateDigitalTwinState(testTwinId, { city_ambient_temp_c: 23.5 });
  assert(updatedTwin?.city_ambient_temp_c === 23.5, 'DigitalTwin UPDATE: Updated telemetry in twin state');

  const twinDeleted = db.deleteDigitalTwinState(testTwinId);
  assert(twinDeleted === true, 'DigitalTwin DELETE: Purged snapshot record');
  assert(db.getDigitalTwinStateById(testTwinId) === undefined, 'DigitalTwin DELETE: Snapshot absent from state history');

  // ----------------------------------------------------
  // TEST 10: Atomic Disk Persistence & State Integrity
  // ----------------------------------------------------
  console.log('\n[10/10] Testing Atomic Disk Persistence & State Integrity...');
  // Modify a system setting and verify reload from disk
  const newThreshold = 88;
  db.updateSettings({ threshold_critical: newThreshold });
  assert(db.getSettings().threshold_critical === newThreshold, 'Settings: Updated threshold in memory');

  // Save to disk
  await db.save();

  // Re-read directly from DB file to verify persistence
  const fs = await import('fs');
  const path = await import('path');
  const dbFile = path.resolve(process.cwd(), 'data', 'ecotwin_database.json');
  const rawDiskData = JSON.parse(fs.readFileSync(dbFile, 'utf-8'));
  assert(rawDiskData.settings.threshold_critical === newThreshold, 'Persistence: Verified changes written atomically to disk JSON file');

  // Re-check health after full suite
  const finalHealth = db.checkHealth();
  assert(finalHealth.status === 'connected', 'Health: Final database health remains connected and consistent');
  assert(finalHealth.counts.bins === 25, `Health: Bin inventory intact (Count: ${finalHealth.counts.bins})`);

  console.log('\n==================================================');
  console.log(`DATABASE CRUD TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runDatabaseCrudSuite().catch((err) => {
  console.error('Database CRUD test suite failed with error:', err);
  process.exit(1);
});
