import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { SimulationColumn } from '../models/simulation-column.model';
import { SimulationResult } from '../models/simulation-result.model';

@Injectable({
  providedIn: 'root'
})
export class SimulationService {
  /**
   * Runs a simulation for a given column configuration
   * This is a placeholder - replace with your actual simulation logic
   */
  runSimulation(column: SimulationColumn): Observable<SimulationResult> {
    // Placeholder implementation - returns mock results after delay
    const result: SimulationResult = {
      columnId: column.id,
      result1: Math.random() * 2000000,
      result2: Math.random() * 100
    };

    // Simulate 1-2 second delay
    return of(result).pipe(delay(1000 + Math.random() * 1000));
  }

  /**
   * Runs simulations for all columns in parallel
   */
  runAllSimulations(columns: SimulationColumn[]): Observable<SimulationResult[]> {
    // This will be implemented to run simulations in parallel
    // Placeholder for now
    return of([]);
  }
}
