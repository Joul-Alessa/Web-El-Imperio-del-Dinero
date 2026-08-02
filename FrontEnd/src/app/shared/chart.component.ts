import {
  Component, ElementRef, Input, OnChanges, OnDestroy, ViewChild, AfterViewInit,
} from '@angular/core';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-chart',
  standalone: true,
  template: `<div class="chart-host"><canvas #canvas></canvas></div>`,
  styles: [`
    .chart-host { position: relative; width: 100%; height: 100%; min-height: 220px; }
    canvas { max-width: 100%; }
  `],
})
export class ChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() type: ChartType = 'bar';
  @Input() data!: ChartConfiguration['data'];
  @Input() options: ChartConfiguration['options'] = {};

  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  private chart?: Chart;
  private viewReady = false;

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.render();
  }

  ngOnChanges(): void {
    if (this.viewReady) this.render();
  }

  private render(): void {
    if (!this.data) return;
    if (this.chart) {
      this.chart.data = this.data;
      this.chart.options = this.options ?? {};
      this.chart.update();
      return;
    }
    this.chart = new Chart(this.canvasRef.nativeElement, {
      type: this.type,
      data: this.data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        ...this.options,
      },
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}
