import { Component, ViewChild, ElementRef } from '@angular/core';
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
      <div class="labelHolder" style="flex: 1; min-width: 0; display: flex; flex-wrap: nowrap;">
        <span class="header-label">{{ params.displayName }}</span>
        <input 
          type="checkbox" 
          [checked]="isSelected"
          (change)="onClick()"
          (click)="$event.stopPropagation()"
        />
      </div>
      <div class="menuHolder">
        <button 
          *ngIf="isScenarioColumn"
          #menuButton
          class="menu-button"
          (click)="toggleMenu($event)"
          title="More options">
          <i class="material-icons">more_vert</i>
        </button>
      </div>
    </div>
    
    <div *ngIf="showMenu" class="menu-dropdown" [style.top.px]="menuTop" [style.left.px]="menuLeft" (click)="$event.stopPropagation()">
      <div class="menu-item" (click)="onMenuItemClick('option1')">Option 1</div>
      <div class="menu-item" (click)="onMenuItemClick('option2')">Option 2</div>
      <div class="menu-item" (click)="onMenuItemClick('option3')">Option 3</div>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      width: 100%;
      height: 100%;
    }

    input[type="checkbox"] {
        width: 18px;
        height: 18px;
        cursor: pointer;
        margin-left: auto;
        accent-color: #64b5f6;
        border-radius: 4px;
        flex-shrink: 0;
    }

    .custom-header-container {
      display: flex;
      align-items: center;
      width: 100%;
      height: 100%;
      padding: 0 8px;
      cursor: default;
      position: relative;
      
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
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      user-select: none;
      margin-right: 8px;
    }
    
    .menu-button {
      background: none;
      border: none;
      color: #888;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      margin-left: 4px;
      flex-shrink: 0;
      
      &:hover {
        background-color: rgba(255, 255, 255, 0.1);
        color: #e0e0e0;
      }
      
      i {
        font-size: 18px;
      }
    }
    
    .menu-dropdown {
      position: fixed;
      background-color: #2b2b2b;
      border: 1px solid #444;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
      z-index: 10000;
      min-width: 150px;
      margin-top: 4px;
    }
    
    .menu-item {
      padding: 10px 16px;
      color: #e0e0e0;
      cursor: pointer;
      user-select: none;
      
      &:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }
      
      &:first-child {
        border-top-left-radius: 4px;
        border-top-right-radius: 4px;
      }
      
      &:last-child {
        border-bottom-left-radius: 4px;
        border-bottom-right-radius: 4px;
      }
    }
  `]
})
export class ColumnHeaderComponent implements IHeaderAngularComp {
  @ViewChild('menuButton') menuButton?: ElementRef;
  
  params!: CustomHeaderParams;
  isSelected = false;
  isScenarioColumn = false;
  showMenu = false;
  menuTop = 0;
  menuLeft = 0;

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
  
  toggleMenu(event: Event): void {
    event.stopPropagation();
    this.showMenu = !this.showMenu;
    
    if (this.showMenu && this.menuButton) {
      const rect = this.menuButton.nativeElement.getBoundingClientRect();
      this.menuTop = rect.bottom + 4;
      this.menuLeft = rect.right - 150; // Align right edge of menu with button
    }
  }
  
  onMenuItemClick(option: string): void {
    console.log('Menu item clicked:', option);
    this.showMenu = false;
    // Add your menu item logic here
  }
}
