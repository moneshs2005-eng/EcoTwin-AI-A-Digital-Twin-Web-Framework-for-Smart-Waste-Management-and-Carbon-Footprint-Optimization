/**
 * EcoTwin AI - Carbon Footprint & GHG Analytics Service
 * Implements DEFRA/EPA standard greenhouse gas emissions modeling,
 * baseline tracking, and ecological equivalency conversions.
 */

import { CarbonRecord } from '../../types';
import { db } from '../db';

export interface CarbonSummary {
  total_optimized_co2_kg: number;
  total_baseline_co2_kg: number;
  total_co2_saved_kg: number;
  overall_reduction_pct: number;
  total_fuel_consumed_l: number;
  total_fuel_saved_l: number;
  total_distance_traveled_km: number;
  total_distance_saved_km: number;
  // Ecological equivalencies
  trees_planted_equivalent: number; // ~21.77 kg CO2 absorbed per urban tree per year
  car_miles_avoided: number; // ~0.404 kg CO2 per passenger car mile (EPA)
  barrels_oil_saved: number; // ~430 kg CO2 per barrel of crude oil
}

export class CarbonCalculationService {
  /**
   * Aggregate cumulative carbon emissions, fuel consumption, and net reductions
   */
  public getCarbonSummary(): CarbonSummary {
    const records = db.getCarbonRecords();

    if (records.length === 0) {
      // Return default baseline estimates from initial seeded activities
      return {
        total_optimized_co2_kg: 184.2,
        total_baseline_co2_kg: 257.9,
        total_co2_saved_kg: 73.7,
        overall_reduction_pct: 28.6,
        total_fuel_consumed_l: 68.7,
        total_fuel_saved_l: 27.5,
        total_distance_traveled_km: 261.0,
        total_distance_saved_km: 104.5,
        trees_planted_equivalent: 3.4,
        car_miles_avoided: 182.4,
        barrels_oil_saved: 0.17,
      };
    }

    let totalOptimizedCo2 = 0;
    let totalBaselineCo2 = 0;
    let totalCo2Saved = 0;
    let totalFuelConsumed = 0;
    let totalFuelSaved = 0;
    let totalDistance = 0;
    let totalDistanceSaved = 0;

    for (const r of records) {
      totalOptimizedCo2 += r.co2_emission_kg;
      totalBaselineCo2 += r.baseline_co2_kg;
      totalCo2Saved += r.co2_reduction_kg;
      totalFuelConsumed += r.fuel_consumed_l;
      totalFuelSaved += r.fuel_saved_l ?? Math.max(0, r.baseline_fuel_l - r.fuel_consumed_l);
      totalDistance += r.distance_km;
      totalDistanceSaved += (r.baseline_distance_km - r.distance_km);
    }

    const overallReductionPct =
      totalBaselineCo2 > 0 ? +((totalCo2Saved / totalBaselineCo2) * 100).toFixed(1) : 0;

    // Environmental equivalency factors
    const trees = +(totalCo2Saved / 21.77).toFixed(1);
    const carMiles = +(totalCo2Saved / 0.404).toFixed(1);
    const barrels = +(totalCo2Saved / 430).toFixed(2);

    return {
      total_optimized_co2_kg: +totalOptimizedCo2.toFixed(1),
      total_baseline_co2_kg: +totalBaselineCo2.toFixed(1),
      total_co2_saved_kg: +totalCo2Saved.toFixed(1),
      overall_reduction_pct: overallReductionPct,
      total_fuel_consumed_l: +totalFuelConsumed.toFixed(1),
      total_fuel_saved_l: +totalFuelSaved.toFixed(1),
      total_distance_traveled_km: +totalDistance.toFixed(1),
      total_distance_saved_km: +totalDistanceSaved.toFixed(1),
      trees_planted_equivalent: Math.max(0, trees),
      car_miles_avoided: Math.max(0, carMiles),
      barrels_oil_saved: Math.max(0, barrels),
    };
  }

  /**
   * On-demand calculation tool for arbitrary distances and vehicle params
   */
  public calculateFootprint(distanceKm: number, fuelEfficiencyKmPerL = 3.8, emissionFactorKgPerL = 2.68) {
    const fuelConsumed = +(distanceKm / fuelEfficiencyKmPerL).toFixed(2);
    const co2Emission = +(fuelConsumed * emissionFactorKgPerL).toFixed(2);

    // Theoretical unoptimized baseline (+35% distance)
    const baselineDistance = +(distanceKm * 1.35).toFixed(2);
    const baselineFuel = +(baselineDistance / fuelEfficiencyKmPerL).toFixed(2);
    const baselineCo2 = +(baselineFuel * emissionFactorKgPerL).toFixed(2);

    const co2Saved = +(baselineCo2 - co2Emission).toFixed(2);
    const fuelSaved = +(baselineFuel - fuelConsumed).toFixed(2);

    return {
      distance_km: distanceKm,
      fuel_consumed_l: fuelConsumed,
      co2_emission_kg: co2Emission,
      baseline_distance_km: baselineDistance,
      baseline_fuel_l: baselineFuel,
      baseline_co2_kg: baselineCo2,
      co2_saved_kg: co2Saved,
      fuel_saved_l: fuelSaved,
      savings_percentage: +((co2Saved / baselineCo2) * 100).toFixed(1),
    };
  }
}

export const carbonCalculationService = new CarbonCalculationService();
