import { Component, Input, OnInit, OnChanges, SimpleChanges, ViewChild, ElementRef, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration } from 'chart.js';
import { SimulationResult } from '../../models/simulation-result.model';
import { SimulationColumn } from '../../models/simulation-column.model';

@Component({
  selector: 'app-comparison-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="comparison-chart-container">
      <div class="chart-header">
        <h4>Scenario Comparison</h4>
        <div class="scenario-labels" *ngIf="column1 && column2">
          <span class="scenario-label scenario-1">{{ column1.name }}</span>
          <span class="scenario-label scenario-2">{{ column2.name }}</span>
        </div>
      </div>
      <div class="chart-wrapper">
        <canvas #comparisonChart></canvas>
      </div>
      <div *ngIf="!result1 || !result2" class="no-data-message">
        <p>Select two scenarios to compare</p>
      </div>
    </div>
  `,
  styles: [`
    .comparison-chart-container {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    
    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      padding-bottom: 8px;
      border-bottom: 1px solid #444;
    }
    
    .chart-header h4 {
      margin: 0;
      color: #e0e0e0;
    }
    
    .scenario-labels {
      display: flex;
      gap: 15px;
    }
    
    .scenario-label {
      font-size: 0.9rem;
      padding: 4px 12px;
      border-radius: 4px;
      font-weight: 500;
    }
    
    .scenario-1 {
      background-color: rgba(25, 118, 210, 0.3);
      color: #64b5f6;
    }
    
    .scenario-2 {
      background-color: rgba(76, 175, 80, 0.3);
      color: #81c784;
    }
    
    .chart-wrapper {
      flex: 1;
      position: relative;
      min-height: 300px;
    }
    
    .no-data-message {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #888;
      font-style: italic;
    }
  `]
})
export class ComparisonChartComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @ViewChild('comparisonChart') chartCanvas?: ElementRef<HTMLCanvasElement>;
  @Input() result1?: SimulationResult;
  @Input() result2?: SimulationResult;
  @Input() column1?: SimulationColumn;
  @Input() column2?: SimulationColumn;
  
  private chart?: Chart;

  ngOnInit(): void {
    // Initialization logic if needed
  }

  ngAfterViewInit(): void {
    // Render chart once the view is initialized
    setTimeout(() => this.renderChart(), 100);
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Only render if view is already initialized (chartCanvas exists)
    if ((changes['result1'] || changes['result2']) && this.chartCanvas) {
      setTimeout(() => this.renderChart(), 100);
    }
  }

  ngOnDestroy(): void {
    this.destroyChart();
  }

  private renderChart(): void {

    if (!this.chartCanvas || !this.result1 || !this.result2) {
      return;
    }

    this.destroyChart();

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const column = this.column1;
    const ageParam = column?.parameters.find(p => p.parameterId === 'age');
    const startingAge = ageParam ? Number(ageParam.value) : 0;

    const years = this.result1.linearResult!.length;
    const labels = Array.from({ length: years }, (_, i) => `${startingAge + i}`);

    // Placeholder chart configuration
    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: this.column1?.name,
            data: this.result1!.linearResult!.map(d => d.value),
            borderColor: 'rgba(25, 118, 210, 1)',
            backgroundColor: 'rgba(25, 118, 210, 0.1)',
            borderWidth: 2,
            tension: 0.4
          },
          {
            label: this.column2?.name,
            data: this.result2!.linearResult!.map(d => d.value),
            borderColor: 'rgba(76, 175, 80, 1)',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            borderWidth: 2,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: '#e0e0e0'
            }
          },
          title: {
            display: true,
            text: 'Comparison (Placeholder)',
            color: '#e0e0e0',
            font: { size: 14 }
          }
        },
        scales: {
          x: {
            ticks: { color: '#e0e0e0' },
            grid: { color: '#444' }
          },
          y: {
            ticks: { color: '#e0e0e0' },
            grid: { color: '#444' },
            beginAtZero: true
          }
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }

  private destroyChart(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = undefined;
    }
  }
}
