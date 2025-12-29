import { Component } from '@angular/core';
import { IHeaderAngularComp } from 'ag-grid-angular';
import { IHeaderParams } from 'ag-grid-community';
import { CommonModule } from '@angular/common';

interface CustomHeaderParams extends IHeaderParams {
  columnId?: string;
  isSelected?: boolean;
  onHeaderClick?: (columnId: string) => void;
}

@Component({
  selector: 'app-column-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="custom-header-container"
      [class.clickable]="isScenarioColumn"
      [class.selected]="isSelected"
      (click)="onClick()"
      [attr.title]="isScenarioColumn ? 'Click to view details' : ''">
      <span class="header-label">{{ params.displayName }}</span> &nbsp;
    <input 
      type="checkbox" 
      [checked]="isSelected"
      (change)="onClick()"
      (click)="$event.stopPropagation()"
    />
    </div>
  `,
  styles: [`

    input[type="checkbox"] {
        width: 18px;
        height: 18px;
        cursor: pointer;
        margin-left: 8px;
        accent-color: #64b5f6;
        border-radius: 4px;
    }

    .custom-header-container {
      display: flex;
      align-items: center;
      width: 100%;
      height: 100%;
      padding: 0 8px;
      cursor: default;
      
      &.clickable {
        cursor: pointer;
        
        &:hover {
          opacity: 0.8;
        }
      }
      
      &.selected {
        .header-label {
          font-weight: bold;
          color: #64b5f6;
        }
      }
    }
    
    .header-label {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      user-select: none;
    }
  `]
})
export class ColumnHeaderComponent implements IHeaderAngularComp {
  params!: CustomHeaderParams;
  isSelected = false;
  isScenarioColumn = false;

  agInit(params: CustomHeaderParams): void {
    this.params = params;
    this.isSelected = params.isSelected || false;
    
    // Determine if this is a scenario column (clickable)
    this.isScenarioColumn = params.columnId ? params.columnId.startsWith('col') : false;
  }

  refresh(params: CustomHeaderParams): boolean {
    // Update selection state when it changes
    this.isSelected = params.isSelected || false;
    return true;
  }

  onClick(): void {
    // Only trigger callback for scenario columns
    if (this.isScenarioColumn && this.params.onHeaderClick && this.params.columnId) {
      this.params.onHeaderClick(this.params.columnId);
    }
  }
}
