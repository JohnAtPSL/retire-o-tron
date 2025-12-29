import { Component, Input, OnInit, OnChanges, SimpleChanges, ViewChild, ElementRef, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration } from 'chart.js';
import { SimulationResult } from '../../models/simulation-result.model';
import { SimulationColumn } from '../../models/simulation-column.model';

@Component({
  selector: 'mc-success-comparison',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./comparison-chart.component.scss'],
  template: `
    <div class="comparison-chart-container">
      <div class="chart-header">
        <h4>Monte Carlo Cumulative Yearly Success Comparison</h4>
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
})
export class MCSuccessComparison implements OnInit, OnChanges, AfterViewInit, OnDestroy {
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
            data: this.result1!.failYears!.map((value) => value/2500),
            borderColor: 'rgba(25, 118, 210, 1)',
            backgroundColor: 'rgba(25, 118, 210, 0.1)',
            borderWidth: 2,
            tension: 0.4
          },
          {
            label: this.column2?.name,
            data: this.result2!.failYears!.map((value) => value/2500),
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
            display: false,
          },
          title: {
            display: false,
            text: 'Linear Analysis Portfolio Value',
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
            ticks: { color: '#e0e0e0',
              callback: function(value) {
                return ((Number.parseFloat(value as string) * 100) + '%');
              }
             },
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
