import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  imports: [],
  template: `
    <div class="container">
      <h1>Retireotron Simulation Grid</h1>
      <p>Grid component will be added in Step 2</p>
      <div class="info">
        <h2>Project Structure Created</h2>
        <ul>
          <li>✅ Models: Parameter, SimulationColumn, SimulationResult</li>
          <li>✅ Services: ParameterRegistry, Storage, Simulation</li>
          <li>✅ Git repository initialized</li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .container {
      padding: 20px;
      font-family: Arial, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
    }
    h1 {
      color: #333;
      border-bottom: 2px solid #1976d2;
      padding-bottom: 10px;
    }
    h2 {
      color: #555;
      margin-top: 20px;
    }
    .info {
      background: #f5f5f5;
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
    }
    ul {
      list-style: none;
      padding-left: 0;
    }
    li {
      padding: 8px 0;
      font-size: 16px;
    }
  `]
})
export class AppComponent {
  title = 'retireotron';
}
