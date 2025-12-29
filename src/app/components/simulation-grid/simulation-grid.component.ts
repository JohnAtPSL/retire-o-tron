import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridApi, GridReadyEvent, ValueSetterParams, ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community';
import { Subject, forkJoin, debounceTime, takeUntil } from 'rxjs';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

import { ParameterRegistryService } from '../../services/parameter-registry.service';
import { SimulationService } from '../../services/simulation.service';
import { StorageService } from '../../services/storage.service';
import { ParameterDefinition, ParameterType, ParameterFormat } from '../../models/parameter.model';
import { SimulationColumn } from '../../models/simulation-column.model';
import { SimulationResult } from '../../models/simulation-result.model';
import { HelpModalComponent } from '../help-modal/help-modal.component';
import { ColumnHeaderComponent } from '../column-header/column-header.component';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Register Chart.js components
Chart.register(...registerables);

interface GridRow {
  rowType: 'result' | 'group' | 'parameter';
  parameterId?: string;
  label: string;
  group?: string;
  parameterDef?: ParameterDefinition;
  [key: string]: any; // For column values
}

@Component({
  selector: 'app-simulation-grid',
  standalone: true,
  imports: [CommonModule, AgGridAngular, HelpModalComponent],
  templateUrl: './simulation-grid.component.html',
  styleUrls: ['./simulation-grid.component.scss']
})
export class SimulationGridComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('portfolioChart') portfolioChartCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('expensesChart') expensesChartCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('growthChart') growthChartCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('failYearsChart') failYearsChartCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('mcStatsChart') mcStatsChartCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('returnsDistChart') returnsDistChartCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('simPathsChart') simPathsChartCanvas?: ElementRef<HTMLCanvasElement>;
  private chart?: Chart;
  private expensesChart?: Chart;
  private growthChart?: Chart;
  private failYearsChart?: Chart;
  private mcStatsChart?: Chart;
  private returnsDistChart?: Chart;
  private simPathsChart?: Chart;

  private gridApi!: GridApi;
  private destroy$ = new Subject<void>();
  private dataChanged$ = new Subject<void>();

  columnDefs: ColDef[] = [];
  rowData: GridRow[] = [];
  pinnedTopRowData: GridRow[] = [];
  defaultColDef: ColDef = {
    flex: 1,
    minWidth: 100,
    editable: false,
    sortable: false,
    filter: false
  };

  rowHeight = 32;

  columns: SimulationColumn[] = [];
  results: Map<string, SimulationResult> = new Map();
  expandedGroups: Map<string, boolean> = new Map();
  selectedColumnIds: string[] = [];
  inflationMode: 'real' | 'nominal' = 'real';
  showHelpModal = false;

  constructor(
    private parameterRegistry: ParameterRegistryService,
    private simulationService: SimulationService,
    private storageService: StorageService
  ) { }

  ngOnInit(): void {
    this.initializeColumns();
    this.initializeExpandedGroups();
    this.setupColumnDefinitions();
    this.buildRowData();
    this.setupAutoSave();
  }

  ngAfterViewInit(): void {
    this.renderChart();
    this.renderExpensesChart();
    this.renderGrowthChart();
    this.renderFailYearsChart();
  }

  private initializeExpandedGroups(): void {
    const groups = this.parameterRegistry.getGroups();
    groups.forEach(group => this.expandedGroups.set(group, true));
  }

  toggleInflationMode(mode: "real" | "nominal"): void {
    this.inflationMode = mode;
    this.runSimulations();
  }

  private initializeColumns(): void {
    const savedColumns = this.storageService.loadColumns();

    if (savedColumns && savedColumns.length > 0) {
      this.columns = savedColumns;
      this.runSimulations();
    } else {
      // Create 5 default columns
      const parameters = this.parameterRegistry.getParameters();
      for (let i = 1; i <= 5; i++) {
        this.columns.push({
          id: `col${i}`,
          name: `Scenario ${i}`,
          parameters: parameters.map(p => ({
            parameterId: p.id,
            value: p.defaultValue
          }))
        });
      }
      this.storageService.saveColumns(this.columns);
    }
    
    // Select the first column by default
    if (this.columns.length > 0) {
      this.selectedColumnIds = [this.columns[0].id];
    }
  }

  private setupColumnDefinitions(): void {
    // First column - labels
    this.columnDefs = [
      {
        headerName: 'Parameter',
        field: 'label',
        pinned: 'left',
        width: 180,
        cellRenderer: (params: any) => {
          const row = params.data as GridRow;
          if (row.rowType === 'group' && row.group) {
            const isExpanded = this.expandedGroups.get(row.group);
            const icon = isExpanded ? '▼' : '▶';
            return `<span style="cursor: pointer;">${icon} ${params.value}</span>`;
          }
          return params.value;
        },
        cellStyle: (params) => {
          if (params.data.rowType === 'result') {
            return { fontWeight: 'bold' } as any;
          } else if (params.data.rowType === 'group') {
            return { fontWeight: 'bold', fontStyle: 'italic', cursor: 'pointer' } as any;
          }
          return { paddingLeft: '20px' } as any;
        },
        onCellClicked: (params) => {
          if (params.data.rowType === 'group' && params.data.group) {
            this.toggleGroup(params.data.group);
          }
        }
      }
    ];

    // Add column for each scenario
    this.columns.forEach(col => {
      const isSelected = this.selectedColumnIds.includes(col.id);

      this.columnDefs.push({
        headerName: col.name,
        headerClass: isSelected ? 'header-selected' : 'header-with-select-btn',
        field: col.id,
        headerComponent: ColumnHeaderComponent,
        headerComponentParams: {
          columnId: col.id,
          isSelected: isSelected,
          onHeaderClick: (columnId: string) => this.selectColumn(columnId)
        },
        editable: (params) => params.data.rowType === 'parameter',
        cellEditorSelector: (params) => {
          const row = params.data as GridRow;
          if (!row.parameterDef || row.rowType !== 'parameter') {
            return undefined;
          }

          switch (row.parameterDef.type) {
            case ParameterType.BOOLEAN:
              return {
                component: 'agSelectCellEditor',
                params: {
                  values: ['Yes', 'No']
                }
              };
            case ParameterType.DROPDOWN:
              return {
                component: 'agSelectCellEditor',
                params: {
                  values: row.parameterDef.dropdownOptions?.map(opt => opt.value) || []
                }
              };
            case ParameterType.NUMBER:
              const precision = this.getPrecisionFromStep(row.parameterDef.step);
              const isPercentage = row.parameterDef.format === ParameterFormat.PERCENTAGE;
              return {
                component: 'agNumberCellEditor',
                params: {
                  min: isPercentage ? (row.parameterDef.min || 0) * 100 : row.parameterDef.min,
                  max: isPercentage ? (row.parameterDef.max || 100) * 100 : row.parameterDef.max,
                  precision: isPercentage ? 2 : precision
                },
                popup: false
              };
            default:
              return {
                component: 'agTextCellEditor'
              };
          }
        },
        valueSetter: this.valueSetter.bind(this),
        valueParser: (params) => {
          const row = params.data as GridRow;
          // For percentage parameters, convert user input to decimal for storage
          if (row.rowType === 'parameter' && row.parameterDef?.format === ParameterFormat.PERCENTAGE) {
            return typeof params.newValue === 'number' ? params.newValue / 100 : params.newValue;
          }
          return params.newValue;
        },
        valueGetter: (params) => {
          const row = params.data as GridRow;
          if (row.rowType === 'result') {
            const result = this.results.get(col.id);
            if (result?.isCalculating) {
              return 'Calculating...';
            }
            if (result?.error) {
              return 'Error';
            }
            if (result) {
              return row.parameterId === 'result1'
                ? this.formatCurrency(result.result1)
                : this.formatPercentage(result.result2);
            }
            return '-';
          } else if (row.rowType === 'parameter' && row.parameterId) {
            const paramValue = col.parameters.find(p => p.parameterId === row.parameterId);
            // For boolean parameters, convert to Yes/No for the dropdown editor
            if (row.parameterDef?.type === ParameterType.BOOLEAN) {
              return paramValue?.value ? 'Yes' : 'No';
            }
            // For percentage parameters, show as whole numbers for editing (0.06 -> 6)
            if (row.parameterDef?.format === ParameterFormat.PERCENTAGE && typeof paramValue?.value === 'number') {
              return paramValue.value * 100;
            }
            return paramValue?.value;
          }
          return '';
        },
        valueFormatter: (params) => {
          if (!params.data) return params.value;
          const row = params.data as GridRow;
          if (row.rowType === 'parameter' && row.parameterId && params.value !== undefined && params.value !== null) {
            // For boolean parameters, value is already 'Yes'/'No' from valueGetter
            if (row.parameterDef?.type === ParameterType.BOOLEAN) {
              return params.value;
            }
            // For percentage parameters, the value from valueGetter is already multiplied by 100
            // So we just need to add the % symbol, not multiply again
            if (row.parameterDef?.format === ParameterFormat.PERCENTAGE) {
              return typeof params.value === 'number' ? `${params.value.toFixed(2)}%` : String(params.value);
            }
            return this.formatValue(params.value, row.parameterDef);
          }
          return params.value;
        },
        cellStyle: (params) => {
          const row = params.data as GridRow;
          if (row.rowType === 'result') {
            return { fontWeight: 'bold', textAlign: 'right' } as any;
          } else if (row.rowType === 'parameter' && row.parameterDef?.type === ParameterType.NUMBER) {
            return { textAlign: 'right' } as any;
          }
          return null;
        }
      });
    });
  }

  private valueSetter(params: ValueSetterParams): boolean {
    const row = params.data as GridRow;
    const colId = params.colDef.field;

    if (!colId || !row.parameterId) return false;

    const column = this.columns.find(c => c.id === colId);
    if (!column) return false;

    const paramValue = column.parameters.find(p => p.parameterId === row.parameterId);
    if (!paramValue) return false;

    // Don't update if value is empty/null - keep the old value
    if (params.newValue === null || params.newValue === undefined || params.newValue === '') {
      return false;
    }

    // Convert Yes/No strings to boolean for boolean parameters
    if (row.parameterDef?.type === ParameterType.BOOLEAN) {
      paramValue.value = params.newValue === 'Yes';
    } else if (row.parameterDef?.format === ParameterFormat.PERCENTAGE) {
      // For percentage parameters, convert user input (4) to decimal (0.04) for storage
      paramValue.value = typeof params.newValue === 'number' ? params.newValue / 100 : params.newValue;
    } else {
      paramValue.value = params.newValue;
    }

    this.dataChanged$.next();

    return true;
  }

  private getPrecisionFromStep(step?: number): number {
    if (!step) return 0;

    // Calculate decimal places from step value
    const stepStr = step.toString();
    if (stepStr.includes('.')) {
      return stepStr.split('.')[1].length;
    }
    return 0;
  }

  private buildRowData(): void {
    this.rowData = [];

    // Add result rows to pinned top section
    this.pinnedTopRowData = [
      {
        rowType: 'result',
        parameterId: 'result1',
        label: 'Linear End Value'
      },
      {
        rowType: 'result',
        parameterId: 'result2',
        label: 'Success Rate'
      }
    ];

    // Add parameter rows grouped
    const groups = this.parameterRegistry.getGroups();
    groups.forEach(group => {
      // Add group header
      this.rowData.push({
        rowType: 'group',
        label: `${group}`,
        group
      });

      // Add parameters in group only if expanded
      const isExpanded = this.expandedGroups.get(group);
      if (isExpanded) {
        const params = this.parameterRegistry.getParametersByGroup(group);
        params.forEach(param => {
          this.rowData.push({
            rowType: 'parameter',
            parameterId: param.id,
            label: param.label,
            group,
            parameterDef: param
          });
        });
      }
    });
  }

  toggleGroup(group: string): void {
    const currentState = this.expandedGroups.get(group) || false;
    this.expandedGroups.set(group, !currentState);
    this.buildRowData();
    if (this.gridApi) {
      this.gridApi.setGridOption('rowData', this.rowData);
    }
  }

  selectColumn(columnId: string): void {
    this.selectedColumnIds.push(columnId);

    // Update column headers to show selected state
    this.setupColumnDefinitions();

    if (this.gridApi) {
      this.gridApi.setGridOption('columnDefs', this.columnDefs);
      this.gridApi.refreshCells({ force: true });
    }

    // Render charts after view updates
    setTimeout(() => {
      this.renderChart();
      this.renderExpensesChart();
      this.renderGrowthChart();
      this.renderFailYearsChart();
      this.renderMcStatsChart();
      this.renderReturnsDistChart();
      this.renderSimPathsChart();
    }, 100);
  }

  getSelectedColumnDetails(): SimulationColumn | null {
    if (this.selectedColumnIds.length === 0) return null;
    return this.columns.find(c => c.id === this.selectedColumnIds[0]) || null;
  }

  getDetailViewResult(): SimulationResult | undefined {
    if (this.selectedColumnIds.length === 0) return undefined;
    return this.results.get(this.selectedColumnIds[0]);
  }

  private formatValue(value: any, paramDef?: ParameterDefinition): string {
    if (value === undefined || value === null) return '';

    if (paramDef?.type === ParameterType.BOOLEAN) {
      return value ? 'Yes' : 'No';
    } else if (paramDef?.type === ParameterType.DROPDOWN) {
      const option = paramDef.dropdownOptions?.find(opt => opt.value === value);
      return option?.label || String(value);
    } else if (paramDef?.type === ParameterType.NUMBER) {
      if (paramDef.format === ParameterFormat.PERCENTAGE) {
        return typeof value === 'number' ? `${(value * 100).toFixed(2)}%` : String(value);
      } else if (paramDef.format === ParameterFormat.CURRENCY) {
        return typeof value === 'number' ? this.formatCurrency(value) : String(value);
      }
      return typeof value === 'number' ? value.toLocaleString() : String(value);
    }

    return String(value);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  private setupAutoSave(): void {
    this.dataChanged$
      .pipe(
        debounceTime(500),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.storageService.saveColumns(this.columns);
      });
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    this.gridApi.sizeColumnsToFit();
  }

  runSimulations(): void {
    const simulations = this.columns.map(col => {
      // Mark as calculating
      this.results.set(col.id, {
        columnId: col.id,
        result1: 0,
        result2: 0,
        isCalculating: true
      });

      return this.simulationService.runSimulation(col, this.inflationMode);
    });

    this.gridApi?.refreshCells({ force: true });

    forkJoin(simulations).subscribe({
      next: (results) => {
        results.forEach(result => {
          this.results.set(result.columnId, result);
          console.log(this.results);
        });
        this.gridApi?.refreshCells({ force: true });

        // Update charts if a column is selected
        if (this.selectedColumnIds.length > 0) {
          setTimeout(() => {
            this.renderChart();
            this.renderExpensesChart();
            this.renderGrowthChart();
            this.renderFailYearsChart();
            this.renderMcStatsChart();
            this.renderReturnsDistChart();
            this.renderSimPathsChart();
          }, 100);
        }
      },
      error: (error) => {
        console.error('Simulation error:', error);
      }
    });
  }

  removeColumn(): void {
    const parameters = this.parameterRegistry.getParameters();

    this.columns.pop();

    this.setupColumnDefinitions();
    this.storageService.saveColumns(this.columns);

    // Rebuild grid
    if (this.gridApi) {
      this.gridApi.setGridOption('columnDefs', this.columnDefs);
      this.gridApi.refreshCells({ force: true });
    }
  }

  addColumn(): void {
    const parameters = this.parameterRegistry.getParameters();
    const newColNum = this.columns.length + 1;

    const newColumn: SimulationColumn = {
      id: `col${newColNum}`,
      name: `Scenario ${newColNum}`,
      parameters: parameters.map(p => ({
        parameterId: p.id,
        value: p.defaultValue
      }))
    };

    this.columns.push(newColumn);
    this.setupColumnDefinitions();
    this.storageService.saveColumns(this.columns);

    // Rebuild grid
    if (this.gridApi) {
      this.gridApi.setGridOption('columnDefs', this.columnDefs);
      this.gridApi.refreshCells({ force: true });
    }
  }

  copyColumn1ToAll(): void {
    if (this.columns.length === 0) return;

    if (confirm('Copy all values from Scenario 1 to all other columns?')) {
      const column1 = this.columns[0];

      // Copy column 1 parameters to all other columns
      for (let i = 1; i < this.columns.length; i++) {
        this.columns[i].parameters = column1.parameters.map(p => ({
          parameterId: p.parameterId,
          value: p.value
        }));
      }

      this.storageService.saveColumns(this.columns);

      if (this.gridApi) {
        this.gridApi.refreshCells({ force: true });
      }
    }
  }

  resetData(): void {
    if (confirm('Are you sure you want to reset all data to defaults?')) {
      this.storageService.clearColumns();
      this.results.clear();
      this.columns = []; // Clear existing columns
      this.initializeColumns();
      this.setupColumnDefinitions();

      if (this.gridApi) {
        this.gridApi.setGridOption('columnDefs', this.columnDefs);
        this.gridApi.setGridOption('rowData', this.rowData);
      }
    }
  }

  getParameterLabel(parameterId: string): string {
    const param = this.parameterRegistry.getParameters().find(p => p.id === parameterId);
    return param?.label || parameterId;
  }

  formatParameterValue(parameterId: string, value: any): string {
    const param = this.parameterRegistry.getParameters().find(p => p.id === parameterId);
    if (!param) return String(value);
    return this.formatValue(value, param);
  }

  private renderChart(): void {
    if (!this.portfolioChartCanvas || this.selectedColumnIds.length === 0) {
      return;
    }

    this.destroyChart();

    const result = this.getDetailViewResult();
    if (!result?.linearResult || result.linearResult.length === 0) {
      return;
    }

    const ctx = this.portfolioChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const column = this.getSelectedColumnDetails();
    const ageParam = column?.parameters.find(p => p.parameterId === 'age');
    const startingAge = ageParam ? Number(ageParam.value) : 0;

    const years = result.linearResult.length;
    const labels = Array.from({ length: years }, (_, i) => `${startingAge + i}`);

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels:  labels,
        datasets: [
          {
            label: 'Starting Value',
            data: result.linearResult.map(d => d.startValue),
            backgroundColor: 'rgba(76, 175, 80, 0.7)',
            borderColor: 'rgba(76, 175, 80, 1)',
            borderWidth: 1
          },
          {
            label: 'Growth',
            data: result.linearResult.map(d => d.growth),
            backgroundColor: 'rgba(25, 118, 210, 0.7)',
            borderColor: 'rgba(25, 118, 210, 1)',
            borderWidth: 1
          },
          {
            label: 'Social Security',
            data: result.linearResult.map(d => d.ssPayment),
            backgroundColor: 'rgba(255, 152, 0, 0.7)',
            borderColor: 'rgba(255, 152, 0, 1)',
            borderWidth: 1
          },
          {
            label: 'New Savings',
            data: result.linearResult.map(d => d.newSavings),
            backgroundColor: 'rgba(156, 39, 176, 0.7)',
            borderColor: 'rgba(156, 39, 176, 1)',
            borderWidth: 1
          },
          {
            label: 'Capital Event',
            data: result.linearResult.map(d => d.capitalEvent),
            backgroundColor: 'rgba(233, 30, 99, 0.7)',
            borderColor: 'rgba(233, 30, 99, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          title: {
            display: true,
            text: 'Portfolio Value Breakdown by Year',
            font: { size: 16 }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: (context) => {
                const value = context.parsed.y;
                return value !== null ? `${context.dataset.label}: ${this.formatCurrency(value)}` : 'N/A';
              }
            }
          }
        },
        scales: {
          x: {
            stacked: true,
            title: {
              display: true,
              text: 'Age'
            }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            ticks: {
              callback: (value) => this.formatCurrency(value as number)
            }
          }
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }

  private renderExpensesChart(): void {
    if (!this.expensesChartCanvas || this.selectedColumnIds.length === 0) {
      return;
    }

    this.destroyExpensesChart();

    const result = this.getDetailViewResult();
    if (!result?.linearResult || result.linearResult.length === 0) {
      return;
    }

    const ctx = this.expensesChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: result.linearResult.map(d => d.year.toString()),
        datasets: [
          {
            label: 'Core Expenses',
            data: result.linearResult.map(d => d.coreExpense),
            backgroundColor: 'rgba(244, 67, 54, 0.7)',
            borderColor: 'rgba(244, 67, 54, 1)',
            borderWidth: 1
          },
          {
            label: 'Flexible Expenses',
            data: result.linearResult.map(d => d.flexExpense),
            backgroundColor: 'rgba(255, 193, 7, 0.7)',
            borderColor: 'rgba(255, 193, 7, 1)',
            borderWidth: 1
          },
          {
            label: 'Healthcare',
            data: result.linearResult.map(d => d.healthCare),
            backgroundColor: 'rgba(33, 150, 243, 0.7)',
            borderColor: 'rgba(33, 150, 243, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          title: {
            display: true,
            text: 'Annual Expenses Breakdown',
            font: { size: 16 }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: (context) => {
                const value = context.parsed.y;
                return value !== null ? `${context.dataset.label}: ${this.formatCurrency(value)}` : 'N/A';
              }
            }
          }
        },
        scales: {
          x: {
            stacked: true,
            title: {
              display: true,
              text: 'Age'
            }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            ticks: {
              callback: (value) => this.formatCurrency(value as number)
            },
            title: {
              display: true,
              text: 'Annual Expenses'
            }
          }
        }
      }
    };

    this.expensesChart = new Chart(ctx, config);
  }

  private renderGrowthChart(): void {
    if (!this.growthChartCanvas || this.selectedColumnIds.length === 0) {
      return;
    }

    this.destroyGrowthChart();

    const result = this.getDetailViewResult();
    if (!result?.linearResult || result.linearResult.length === 0) {
      return;
    }

    const ctx = this.growthChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const column = this.getSelectedColumnDetails();
    const ageParam = column?.parameters.find(p => p.parameterId === 'age');
    const startingAge = ageParam ? Number(ageParam.value) : 0;

    const years = result.linearResult.length;
    const labels = Array.from({ length: years }, (_, i) => `${startingAge + i}`);

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Portfolio Value',
            data: result.linearResult.map(d => d.value),
            borderColor: 'rgba(25, 118, 210, .7)',
            backgroundColor: 'rgba(25, 118, 210, 0.1)',
            borderWidth: 3,
            fill: false,
            tension: 0.1
          },
          {
            label: 'Low Performance (Model Rates -1%)',
            data: result.laLow!.map(d => d.value),
            borderColor: 'rgba(210, 25, 25, .7)',
            backgroundColor: 'rgba(25, 118, 210, 0.1)',
            borderWidth: 3,
            fill: false,
            tension: 0.1
          },
           {
            label: 'High Performance (Model Rates +1%)',
            data: result.laHigh!.map(d => d.value),
            borderColor: 'rgba(21, 221, 34, 0.7)',
            backgroundColor: 'rgba(25, 118, 210, 0.1)',
            borderWidth: 3,
            fill: false,
            tension: 0.1
          },
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          title: {
            display: true,
            text: 'Portfolio Value with Growth Bands',
            font: { size: 16 }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: (context) => {
                const value = context.parsed.y;
                return value !== null ? `${context.dataset.label}: ${this.formatCurrency(value)}` : 'N/A';
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Age'
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => this.formatCurrency(value as number)
            },
            title: {
              display: true,
              text: 'Portfolio Value'
            }
          }
        }
      }
    };

    this.growthChart = new Chart(ctx, config);
  }

  private renderFailYearsChart(): void {
    if (!this.failYearsChartCanvas || this.selectedColumnIds.length === 0) {
      return;
    }

    this.destroyFailYearsChart();

    const result = this.getDetailViewResult();
    if (!result?.failYears || result.failYears.length === 0) {
      return;
    }

    const ctx = this.failYearsChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Create labels for each bin (year range)
    const labels = result.failYears.map((_, index) => `${index + 1}`);

    const fails = result.failYears.map((value, index) => 2500 - value);

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Success',
          data: result.failYears,
          backgroundColor: 'rgba(76, 175, 80, 0.7)',
          borderColor: 'rgba(76, 175, 80, 1)',
          borderWidth: 1
        },
        {
          label: 'Failure',
          data: fails,
          backgroundColor: 'rgba(244, 67, 54, 0.7)',
          borderColor: 'rgba(244, 67, 54, 1)',
          borderWidth: 1
        },

        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Monte Carlo Simulation - Result Distribution',
            font: { size: 16 }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed.y;
                return value !== null ? `Result: ${value}` : 'N/A';
              }
            }
          }
        },
        scales: {
          x: {
            stacked: true,
            title: {
              display: true,
              text: 'Years into Retirement'
            }
          },
          y: {
            beginAtZero: true,
            stacked: true,
            ticks: {
              stepSize: 1
            },
            title: {
              display: true,
              text: 'Number of Simulations'
            }
          }
        }
      }
    };

    this.failYearsChart = new Chart(ctx, config);
  }

  private destroyChart(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = undefined;
    }
  }

  private destroyExpensesChart(): void {
    if (this.expensesChart) {
      this.expensesChart.destroy();
      this.expensesChart = undefined;
    }
  }

  private destroyGrowthChart(): void {
    if (this.growthChart) {
      this.growthChart.destroy();
      this.growthChart = undefined;
    }
  }

  private destroyFailYearsChart(): void {
    if (this.failYearsChart) {
      this.failYearsChart.destroy();
      this.failYearsChart = undefined;
    }
  }

  private renderMcStatsChart(): void {
    if (!this.mcStatsChartCanvas || this.selectedColumnIds.length === 0) {
      return;
    }

    this.destroyMcStatsChart();

    const result = this.getDetailViewResult();
    if (!result?.mcResult?.mcStats || result.mcResult.mcStats.length === 0) {
      return;
    }

    const ctx = this.mcStatsChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Filter out undefined values and create labels
    const validStats = result.mcResult.mcStats.filter(stat => stat !== undefined);
    const years = result.mcResult.mcStats.length;
    const column = this.getSelectedColumnDetails();
    const ageParam = column?.parameters.find(p => p.parameterId === 'age');
    const startingAge = ageParam ? Number(ageParam.value) : 0;
    const labels = Array.from({ length: years }, (_, i) => `${startingAge + i}`);

    if (validStats.length === 0) return;

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Mean',
            data: validStats.map(stat => stat!.mean),
            borderColor: 'rgba(33, 150, 243, 1)',
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            borderWidth: 2,
            fill: false,
            tension: 0.4
          },
          {
            label: '90th Percentile',
            data: validStats.map(stat => stat!.p90),
            borderColor: 'rgba(76, 175, 80, 1)',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            borderWidth: 2,
            fill: false,
            tension: 0.4
          },
          {
            label: 'Median (50th)',
            data: validStats.map(stat => stat!.p50),
            borderColor: 'rgba(255, 152, 0, 1)',
            backgroundColor: 'rgba(255, 152, 0, 0.1)',
            borderWidth: 2,
            fill: false,
            tension: 0.4
          },
          {
            label: '10th Percentile',
            data: validStats.map(stat => stat!.p10),
            borderColor: 'rgba(244, 67, 54, 1)',
            backgroundColor: 'rgba(244, 67, 54, 0.1)',
            borderWidth: 2,
            fill: false,
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
            position: 'top'
          },
          title: {
            display: true,
            text: 'Monte Carlo Portfolio Projections',
            font: { size: 16 }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed.y;
                if (value === null) return 'N/A';
                return `${context.dataset.label}: $${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Age'
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Portfolio Value ($)'
            },
            ticks: {
              stepSize: 5000000,
              callback: function (value) {
                return '$' + (value as number).toLocaleString('en-US', { maximumFractionDigits: 0 });
              }
            },
            grid: {
              display: true,
              drawOnChartArea: true,
              drawTicks: true,
              color: 'rgba(232, 220, 220, 0.86)',
              lineWidth: (context) => {
                // Make the zero line thicker
                if (context.tick.value === 0) {
                  return 2;
                }
                return 1;
              }
            }
          }
        }
      }
    };

    this.mcStatsChart = new Chart(ctx, config);
  }

  private destroyMcStatsChart(): void {
    if (this.mcStatsChart) {
      this.mcStatsChart.destroy();
      this.mcStatsChart = undefined;
    }
  }

  private renderReturnsDistChart(): void {
    if (!this.returnsDistChartCanvas || this.selectedColumnIds.length === 0) {
      return;
    }

    this.destroyReturnsDistChart();

    const result = this.getDetailViewResult();
    if (!result?.mcResult?.paths || result.mcResult.paths.length === 0) {
      return;
    }

    const ctx = this.returnsDistChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const { bins, labels } = this.simulationService.binReturnsDistribution(result.mcResult.paths);
    const failed = this.simulationService.binReturnsDistribution(result.mcResult.failedPaths);
    const succeeded = this.simulationService.binReturnsDistribution(result.mcResult.succeededPaths);

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
        {
          showLine: false,
          label: 'Frequency',
          data: bins,
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
          pointRadius: 0
        },
        {
          label: 'Failed Paths',
          data: failed.bins,
          backgroundColor: 'rgba(239, 56, 32, 0.38)',
          borderColor: 'rgba(231, 25, 18, 1)',
          borderWidth: 1,
          pointRadius: 0
        },
        {
          label: 'Successful Paths',
          data: succeeded.bins,
          backgroundColor: 'rgba(14, 232, 72, 0.58)',
          borderColor: 'rgba(21, 207, 33, 1)',
          borderWidth: 1,
          pointRadius: 0
        }
      ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true
          },
          title: {
            display: true,
            text: 'Return Distribution',
            font: { size: 16 }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed.y;
                return value !== null ? `Frequency: ${value.toLocaleString()}` : 'N/A';
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Return Range'
            },
            ticks: {
              maxRotation: 45,
              minRotation: 45
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Occurrences'
            }
          }
        }
      }
    };

    this.returnsDistChart = new Chart(ctx, config);
  }

  private destroyReturnsDistChart(): void {
    if (this.returnsDistChart) {
      this.returnsDistChart.destroy();
      this.returnsDistChart = undefined;
    }
  }

  private renderSimPathsChart(): void {
    if (!this.simPathsChartCanvas || this.selectedColumnIds.length === 0) {
      return;
    }

    this.destroySimPathsChart();

    const result = this.getDetailViewResult();
    if (!result?.mcResult?.failedPaths || result.mcResult.failedPaths.length === 0) {
      return;
    }

    const ctx = this.simPathsChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Get starting age from column parameters
    const column = this.getSelectedColumnDetails();
    const ageParam = column?.parameters.find(p => p.parameterId === 'age');
    const startingAge = ageParam ? Number(ageParam.value) : 0;

    // Create labels for years (using age)
    const years = result.mcResult.failedPaths[0].length;
    const labels = Array.from({ length: years }, (_, i) => `${startingAge + i}`);

    // Create datasets for each failed path (limit to show for performance)
    const maxPathsToShow = 50;
    const pathsToShow = result.mcResult.failedPaths.slice(0, maxPathsToShow);
    const morePaths = result.mcResult.succeededPaths.slice(0, maxPathsToShow);
    
    const datasets = pathsToShow.map((path, index) => ({
      label: `Failed Path ${index + 1}`,
      data: path,
      borderColor: `rgba(244, 67, 54, ${0.3 - (index / pathsToShow.length) * 0.2})`,
      backgroundColor: 'transparent',
      borderWidth: 1,
      pointRadius: 0,
      tension: 0.4
    }));

    datasets.push(...morePaths.map((path, index) => ({
      label: `Success Path ${index + 1}`,
      data: path,
      borderColor: `rgba(76, 175, 80, ${0.3 - (index / pathsToShow.length) * 0.2})`,
      backgroundColor: 'transparent',
      borderWidth: 1,
      pointRadius: 0,
      tension: 0.4
    })));

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: `Market Return Paths (showing 100 of ${result.mcResult.paths.length})`,
            font: { size: 16 }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: (context) => {
                const value = context.parsed.y;
                if (value === null) return 'N/A';
                return `${context.dataset.label}: ${value.toFixed(4)}`;
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Age'
            }
          },
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: 'Rate of Return'
            },
            grid: {
              color: (context) => {
                if (context.tick.value === 0) {
                  return 'rgba(244, 67, 54, 0.8)';
                }
                return 'rgba(0, 0, 0, 0.1)';
              },
              lineWidth: (context) => {
                if (context.tick.value === 0) {
                  return 3;
                }
                return 1;
              }
            },
            ticks: {
              callback: function(value) {
                return (value as number).toFixed(3);
              }
            }
          }
        }
      }
    };

    this.simPathsChart = new Chart(ctx, config);
  }

  private destroySimPathsChart(): void {
    if (this.simPathsChart) {
      this.simPathsChart.destroy();
      this.simPathsChart = undefined;
    }
  }

  ngOnDestroy(): void {
    this.destroyChart();
    this.destroyExpensesChart();
    this.destroyGrowthChart();
    this.destroyFailYearsChart();
    this.destroyMcStatsChart();
    this.destroyReturnsDistChart();
    this.destroySimPathsChart();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
