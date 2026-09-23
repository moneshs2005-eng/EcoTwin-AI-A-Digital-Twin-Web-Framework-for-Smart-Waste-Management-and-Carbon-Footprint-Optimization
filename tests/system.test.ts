/**
 * Comprehensive System & End-to-End Integration Test Suite
 * Tests Database persistence, Auth, Bins & IoT ingestion, AI Prediction,
 * CVRP Route Optimization, Carbon Accounting, and Digital Twin Simulation.
 */

import { db } from '../src/server/db';
import { aiPredictionService } from '../src/server/services/aiPredictionService';
import { routeOptimizationService } from '../src/server/services/routeOptimizationService';
import { carbonCalculationService } from '../src/server/services/carbonCalculationService';
import { digitalTwinService } from '../src/server/services/digitalTwinService';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ecotwin_ai_jwt_secret_phase1_super_secure_key';

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    testsPassed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}${detail ? ` - ${detail}` : ''}`);
    testsFailed++;
  }
}

async function runTests() {
  console.log('\n==================================================');
  console.log('  ECOTWIN AI - AUTOMATED SYSTEM VERIFICATION SUITE');
  console.log('==================================================\n');

  // ----------------------------------------------------
  // Test 1: Database Persistence & Health Verification
  // ----------------------------------------------------
  console.log('[1/7] Testing Database Connection & State...');
  await db.init();
  const health = db.checkHealth();
  assert(health.status === 'connected', 'Database status reports connected');
  assert(health.counts.bins >= 20, `Database contains seeded bins (Found: ${health.counts.bins})`);
  assert(health.counts.vehicles >= 4, `Database contains fleet vehicles (Found: ${health.counts.vehicles})`);
  assert(health.counts.users >= 2, `Database contains admin & operator users (Found: ${health.counts.users})`);
  assert(health.read_latency_ms >= 0 && health.read_latency_ms < 50, `Sub-50ms read latency (${health.read_latency_ms}ms)`);

  // ----------------------------------------------------
  // Test 2: Authentication & Password Security
  // ----------------------------------------------------
  console.log('\n[2/7] Testing Security & Authentication Engine...');
  const users = db.getUsers();
  const adminUser = users.find((u) => u.email === 'admin@ecotwin.ai');
  assert(!!adminUser, `Admin user account exists (Users count: ${users.length})`);
  if (adminUser) {
    const validPassword = await bcrypt.compare('admin123', adminUser.password_hash);
    assert(validPassword, 'Admin bcrypt password hash verifies against default password');

    const invalidPassword = await bcrypt.compare('wrong_pass', adminUser.password_hash);
    assert(!invalidPassword, 'Incorrect password successfully rejected');

    const token = jwt.sign(
      { id: adminUser.id, email: adminUser.email, role: adminUser.role, name: adminUser.name },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    const decoded: any = jwt.verify(token, JWT_SECRET);
    assert(decoded.email === 'admin@ecotwin.ai', 'JWT token signs and verifies with correct identity');
    assert(decoded.role === 'ADMIN', 'JWT token maintains RBAC role');
  }

  // ----------------------------------------------------
  // Test 3: IoT Sensor Telemetry & Ingestion
  // ----------------------------------------------------
  console.log('\n[3/7] Testing IoT Sensor Telemetry Processing...');
  const testBin = db.getBins()[0];
  assert(!!testBin, 'Source bin exists for telemetry test');
  if (testBin) {
    const priorLevel = testBin.current_waste_level;
    const testLevel = Math.round(testBin.capacity * 0.85);

    // Simulate sensor reading update
    testBin.current_waste_level = testLevel;
    testBin.waste_percentage = 85;
    testBin.battery_level = 95;
    testBin.temperature_c = 22.4;
    testBin.updated_at = new Date().toISOString();
    db.updateBin(testBin);

    const reloaded = db.getBinById(testBin.bin_id);
    assert(reloaded?.current_waste_level === testLevel, 'Bin telemetry successfully recorded in atomic database');

    // Restore original fill level
    testBin.current_waste_level = priorLevel;
    testBin.waste_percentage = Math.round((priorLevel / testBin.capacity) * 100);
    db.updateBin(testBin);
  }

  // ----------------------------------------------------
  // Test 4: AI Fill-Level Prediction Engine
  // ----------------------------------------------------
  console.log('\n[4/7] Testing AI Fill-Level Prediction Algorithm...');
  const bins = db.getBins();
  const predictions = aiPredictionService.predictAllBins(bins);
  assert(predictions.length === bins.length, `Predictions generated for all bins (${predictions.length}/${bins.length})`);

  const samplePred = predictions[0];
  assert(typeof samplePred.predicted_level === 'number', 'Predicted level is numeric');
  assert(typeof samplePred.current_level === 'number', 'Current level is numeric');
  assert(samplePred.confidence_score >= 0.7 && samplePred.confidence_score <= 1.0, `Confidence score is realistic (${samplePred.confidence_score})`);
  assert(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(samplePred.risk_level), `Valid risk classification (${samplePred.risk_level})`);

  const metrics = aiPredictionService.getModelMetrics();
  assert(metrics.r2 > 0.85, `Regression model R² score exceeds threshold (${metrics.r2})`);
  assert(metrics.mae < 5.0, `Regression model MAE is below 5.0% (${metrics.mae}%)`);

  // ----------------------------------------------------
  // Test 5: CVRP Route Optimization (Nearest Neighbor + 2-Opt)
  // ----------------------------------------------------
  console.log('\n[5/7] Testing Capacitated Vehicle Route Optimization...');
  const vehicles = db.getVehicles();
  const activeVehicle = vehicles.find((v) => v.status !== 'MAINTENANCE') || vehicles[0];

  const route = routeOptimizationService.generateOptimizedRoute(activeVehicle.vehicle_id);

  assert(!!route, `Generated vehicle dispatch route (${route.route_id})`);
  assert(route.stops.length > 0, `Route contains collection stops (Total: ${route.stops.length})`);
  assert(route.total_distance_km > 0, `Route calculates realistic distance (${route.total_distance_km} km)`);
  assert(route.baseline_distance_km >= route.total_distance_km, `Optimized route is shorter or equal to baseline (${route.total_distance_km}km vs ${route.baseline_distance_km}km)`);
  assert(route.distance_saved_km >= 0, `Distance savings is non-negative (${route.distance_saved_km} km saved)`);

  // ----------------------------------------------------
  // Test 6: Carbon Footprint & ESG GHG Mitigation Service
  // ----------------------------------------------------
  console.log('\n[6/7] Testing Scope 1 Carbon Accounting (DEFRA Factors)...');
  const distanceKm = 35.0;
  const fuelEfficiency = 3.8; // km / L
  const emissionFactor = 2.68; // kg CO2 / L (DEFRA Diesel)

  const carbon = carbonCalculationService.calculateFootprint(
    distanceKm,
    fuelEfficiency,
    emissionFactor
  );

  assert(carbon.co2_emission_kg > 0, `Calculated CO2 emission (${carbon.co2_emission_kg} kg)`);
  assert(carbon.co2_saved_kg > 0, `Calculated CO2 reduction (${carbon.co2_saved_kg} kg saved)`);
  assert(carbon.savings_percentage > 0, `CO2 reduction percentage is positive (${carbon.savings_percentage}%)`);
  const summary = carbonCalculationService.getCarbonSummary();
  assert(summary.trees_planted_equivalent > 0, `Calculated urban tree equivalency (${summary.trees_planted_equivalent} trees)`);

  // ----------------------------------------------------
  // Test 7: Digital Twin 30-Minute Simulation Tick
  // ----------------------------------------------------
  console.log('\n[7/7] Testing Digital Twin State Progression Simulation...');
  const simResult = digitalTwinService.simulateStep(30);

  assert(simResult.updatedBins > 0, `Simulated tick updated bins (${simResult.updatedBins} bins updated)`);
  assert(typeof simResult.alertsGenerated === 'number', `Alerts generated count tracked (${simResult.alertsGenerated})`);

  // Summary
  console.log('\n==================================================');
  console.log(`TEST RESULTS: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log('==================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test suite failed with unexpected error:', err);
  process.exit(1);
});
