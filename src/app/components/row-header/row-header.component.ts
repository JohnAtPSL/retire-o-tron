import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { CommonModule } from '@angular/common';
import { ParameterDefinition } from '../../models/parameter.model';

interface RowHeaderParams extends ICellRendererParams {
  rowType?: 'result' | 'group' | 'parameter';
  group?: string;
  isExpanded?: boolean;
  onGroupToggle?: (group: string) => void;
  parameterDef?: ParameterDefinition;
  onShowHelp?: (title: string, helpText: string) => void;
}

@Component({
  selector: 'app-row-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="row-header-container"
      [class.result-row]="isResultRow"
      [class.group-row]="isGroupRow"
      [class.parameter-row]="isParameterRow"
      [class.clickable]="isGroupRow"
      (click)="onClick()">
      <span *ngIf="isGroupRow" class="expand-icon">{{ expandIcon }}</span>
      <span class="label-text">{{ params.value }}</span>
      <span id="helpButton" *ngIf="!isGroupRow" style="cursor: pointer;" (click)="onHelpClick($event)"><i class="material-icons">help</i></span>
    </div>
  `,
  styles: [`
    .row-header-container {
      display: flex;
      align-items: center;
      width: 100%;
      height: 100%;
      padding: 0 8px;
      user-select: none;
      
      &.clickable {
        cursor: pointer;
      }
    }
    
    .result-row {
      font-weight: bold;
      color: #e0e0e0;
    }
    
    .group-row {
      font-weight: bold;
      font-style: italic;
      color: #b0b0b0;
      
      &:hover {
        background-color: rgba(255, 255, 255, 0.05);
      }
    }
    
    .parameter-row {
      padding-left: 20px;
      color: #e0e0e0;
    }
    
    .expand-icon {
      margin-right: 6px;
      font-size: 12px;
      color: #888;
      min-width: 16px;
      display: inline-block;
      text-align: center;
    }
    
    .label-text {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `]
})
export class RowHeaderComponent implements ICellRendererAngularComp {
  params!: RowHeaderParams;
  isResultRow = false;
  isGroupRow = false;
  isParameterRow = false;
  expandIcon = '▼';

  agInit(params: RowHeaderParams): void {
    this.params = params;
    
    // Determine row type from data
    const data = params.data;
    if (data) {
      this.isResultRow = data.rowType === 'result';
      this.isGroupRow = data.rowType === 'group';
      this.isParameterRow = data.rowType === 'parameter';
      
      // Set expand/collapse icon for group rows
      if (this.isGroupRow && params.isExpanded !== undefined) {
        this.expandIcon = params.isExpanded ? '▼' : '▶';
      }
    }
  }

  refresh(params: RowHeaderParams): boolean {
    // Update expand icon if it changed
    if (this.isGroupRow && params.isExpanded !== undefined) {
      this.expandIcon = params.isExpanded ? '▼' : '▶';
    }
    return true;
  }

  onClick(): void {
    // Only handle clicks for group rows
    if (this.isGroupRow && this.params.data?.group && this.params.onGroupToggle) {
      this.params.onGroupToggle(this.params.data.group);
    }
  }

  onHelpClick(event: Event): void {
    event.stopPropagation();
    const paramDef = this.params.data?.parameterDef;
    if (paramDef?.helpText && this.params.onShowHelp) {
      this.params.onShowHelp(this.params.value, paramDef.helpText);
    }
  }
}
