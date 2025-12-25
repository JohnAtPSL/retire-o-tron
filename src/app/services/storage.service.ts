import { Injectable } from '@angular/core';
import { SimulationColumn } from '../models/simulation-column.model';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly STORAGE_KEY = 'retireotron_columns';

  saveColumns(columns: SimulationColumn[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(columns));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  loadColumns(): SimulationColumn[] | null {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return null;
    }
  }

  clearColumns(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
