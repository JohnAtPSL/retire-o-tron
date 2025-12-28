import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-help-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './help-modal.component.html',
  styleUrls: ['./help-modal.component.scss']
})
export class HelpModalComponent {
  @Output() close = new EventEmitter<void>();

  onClose(): void {
    this.close.emit();
  }

  onOverlayClick(): void {
    this.close.emit();
  }

  onContentClick(event: Event): void {
    event.stopPropagation();
  }
}
