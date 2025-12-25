import { Component } from '@angular/core';
import { SimulationGridComponent } from './components/simulation-grid/simulation-grid.component';

@Component({
  selector: 'app-root',
  imports: [SimulationGridComponent],
  template: `<app-simulation-grid />`,
  styles: []
})
export class AppComponent {
  title = 'retireotron';
}
