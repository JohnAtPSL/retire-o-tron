import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridApi, GridReadyEvent, ValueSetterParams } from 'ag-grid-community';
import { Subject, forkJoin, debounceTime, takeUntil } from 'rxjs';

import { ParameterRegistryService } from '../../services/parameter-registry.service';
import { SimulationService } from '../../services/simulation.service';
import { StorageService } from '../../services/storage.service';
import { ParameterDefinition, ParameterType } from '../../models/parameter.model';
import { SimulationColumn } from '../../models/simulation-column.model';
import { SimulationResult } from '../../models/simulation-result.model';

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
  imports: [CommonModule, AgGridAngular],
  templateUrl: './simulation-grid.component.html',
  styleUrls: ['./simulation-grid.component.scss']
})
export class SimulationGridComponent implements OnInit, OnDestroy {
  private gridApi!: GridApi;
  private destroy$ = new Subject<void>();
  private dataChanged$ = new Subject<void>();

  columnDefs: ColDef[] = [];
  rowData: GridRow[] = [];
  defaultColDef: ColDef = {
    flex: 1,
    minWidth: 120,
    editable: false,
    sortable: false,
    filter: false
  };

  columns: SimulationColumn[] = [];
  results: Map<string, SimulationResult> = new Map();

  constructor(
    private parameterRegistry: ParameterRegistryService,
    private simulationService: SimulationService,
    private storageService: StorageService
  ) {}

  ngOnInit(): void {
    this.initializeColumns();
    this.setupColumnDefinitions();
    this.buildRowData();
    this.setupAutoSave();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeColumns(): void {
    const savedColumns = this.storageService.loadColumns();
    
    if (savedColumns && savedColumns.length > 0) {
      this.columns = savedColumns;
    } else {
      // Create 10 default columns
      const parameters = this.parameterRegistry.getParameters();
      for (let i = 1; i <= 10; i++) {
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
  }

  private setupColumnDefinitions(): void {
    // First column - labels
    this.columnDefs = [
      {
        headerName: 'Parameter',
        field: 'label',
        pinned: 'left',
        width: 200,
        cellStyle: (params) => {
          if (params.data.rowType === 'result') {
            return { fontWeight: 'bold', backgroundColor: '#e3f2fd' } as any;
          } else if (params.data.rowType === 'group') {
            return { fontWeight: 'bold', backgroundColor: '#f5f5f5', fontStyle: 'italic' } as any;
          }
          return { paddingLeft: '20px' } as any;
        }
      }
    ];

    // Add column for each scenario
    this.columns.forEach(col => {
      this.columnDefs.push({
        headerName: col.name,
        field: col.id,
        editable: (params) => params.data.rowType === 'parameter',
        cellEditor: this.getCellEditor.bind(this),
        cellEditorParams: this.getCellEditorParams.bind(this),
        valueSetter: this.valueSetter.bind(this),
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
            return this.formatValue(paramValue?.value, row.parameterDef);
          }
          return '';
        },
        cellStyle: (params) => {
          if (params.data.rowType === 'result') {
            return { fontWeight: 'bold', backgroundColor: '#e8f5e9' } as any;
          }
          return null;
        }
      });
    });
  }

  private getCellEditor(params: any): string {
    const row = params.data as GridRow;
    if (!row.parameterDef) return 'agTextCellEditor';

    switch (row.parameterDef.type) {
      case ParameterType.BOOLEAN:
        return 'agCheckboxCellEditor';
      case ParameterType.DROPDOWN:
        return 'agSelectCellEditor';
      case ParameterType.NUMBER:
        return 'agNumberCellEditor';
      default:
        return 'agTextCellEditor';
    }
  }

  private getCellEditorParams(params: any): any {
    const row = params.data as GridRow;
    if (!row.parameterDef) return {};

    if (row.parameterDef.type === ParameterType.DROPDOWN) {
      return {
        values: row.parameterDef.dropdownOptions?.map(opt => opt.value) || []
      };
    } else if (row.parameterDef.type === ParameterType.NUMBER) {
      return {
        min: row.parameterDef.min,
        max: row.parameterDef.max,
        step: row.parameterDef.step
      };
    }
    return {};
  }

  private valueSetter(params: ValueSetterParams): boolean {
    const row = params.data as GridRow;
    const colId = params.colDef.field;
    
    if (!colId || !row.parameterId) return false;

    const column = this.columns.find(c => c.id === colId);
    if (!column) return false;

    const paramValue = column.parameters.find(p => p.parameterId === row.parameterId);
    if (!paramValue) return false;

    paramValue.value = params.newValue;
    this.dataChanged$.next();
    
    return true;
  }

  private buildRowData(): void {
    this.rowData = [];

    // Add result rows at top
    this.rowData.push({
      rowType: 'result',
      parameterId: 'result1',
      label: 'Portfolio Value'
    });
    this.rowData.push({
      rowType: 'result',
      parameterId: 'result2',
      label: 'Success Rate'
    });

    // Add parameter rows grouped
    const groups = this.parameterRegistry.getGroups();
    groups.forEach(group => {
      // Add group header
      this.rowData.push({
        rowType: 'group',
        label: `${group}`,
        group
      });

      // Add parameters in group
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
    });
  }

  private formatValue(value: any, paramDef?: ParameterDefinition): string {
    if (value === undefined || value === null) return '';
    
    if (paramDef?.type === ParameterType.BOOLEAN) {
      return value ? '☑' : '☐';
    } else if (paramDef?.type === ParameterType.DROPDOWN) {
      const option = paramDef.dropdownOptions?.find(opt => opt.value === value);
      return option?.label || String(value);
    } else if (paramDef?.type === ParameterType.NUMBER) {
      return typeof value === 'number' ? value.toLocaleString() : String(value);
    }
    
    return String(value);
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  private formatPercentage(value: number): string {
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
      
      return this.simulationService.runSimulation(col);
    });

    this.gridApi?.refreshCells({ force: true });

    forkJoin(simulations).subscribe({
      next: (results) => {
        results.forEach(result => {
          this.results.set(result.columnId, result);
        });
        this.gridApi?.refreshCells({ force: true });
      },
      error: (error) => {
        console.error('Simulation error:', error);
      }
    });
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

  resetData(): void {
    if (confirm('Are you sure you want to reset all data to defaults?')) {
      this.storageService.clearColumns();
      this.results.clear();
      this.initializeColumns();
      this.setupColumnDefinitions();
      
      if (this.gridApi) {
        this.gridApi.setGridOption('columnDefs', this.columnDefs);
        this.gridApi.refreshCells({ force: true });
      }
    }
  }
}
