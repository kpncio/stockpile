import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { ExternalService } from 'src/app/services/external.service';
import { ChartConfiguration, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { fromEvent, Subscription } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-symbol',
  templateUrl: './symbol.component.html',
  styleUrls: ['./symbol.component.scss']
})
export class SymbolComponent implements OnInit {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;
  width: number | undefined;
  @Input() symbol!: string;
  resize!: Subscription;
  quotes: any;

  chartdata: ChartConfiguration['data'] = {
    datasets: [
      {
        // stepped: 'after',
        fill: 'origin',
        pointRadius: 0,
        borderWidth: 1,
        pointHoverRadius: 0,
        borderColor: 'rgb(255, 255, 255)',
        backgroundColor: 'rgba(255, 255, 255, 0)',
        data: []
      }
    ],
    labels: [
      '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
      '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
      '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
      '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
      '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
      ''
    ]
  };

  chartoptions: ChartConfiguration['options'] = {
    animation: false,
    maintainAspectRatio: false,
    elements: {
      line: {
        tension: 0.25
      }
    }, scales: {
      x: {
        reverse: true,
        ticks: { color: 'rgba(255, 255, 255, 0)' },
        grid: { color: 'rgba(255, 255, 255, 0)' },
      },
      y: {
        // beginAtZero: true,
        ticks: { color: 'rgba(255, 255, 255, 1)' },
        grid: { color: 'rgba(255, 255, 255, 0)' }
      }
    }, plugins: {
      legend: { display: false }
    }
  };

  charttype: ChartType = 'line';

  constructor(private router: Router, private external: ExternalService) { }

  ngOnInit(): void {
    this.resize = fromEvent(window, 'resize').subscribe( evt => {
      this.width = window.innerWidth;
    });

    let url = 'https://app.kpnc.io/trader/retriever/quotes/' + this.symbol;

    this.external.getRequest(['', '', ''], 0, url).subscribe((response) => {
      this.quotes = response;

      for (let i = 0; i < 76; i++) {
        this.chartdata.datasets[0].data.push(this.quotes.data[i].price);
      }
    });
  }

  getQuote(): void {
    this.router.navigate(['/quote/' + this.symbol]);
  }

  onRetrieve() {
    this.width = window.innerWidth;

    if (this.quotes.data[0].change < 0) {
      this.chartdata.datasets[0].borderColor = 'rgb(194, 38, 27)';
    } else {
      this.chartdata.datasets[0].borderColor = 'rgb(27, 194, 55)';
    }

    this.chart?.update();
  }

  zero(json: number, fix: number) {
    return json.toFixed(fix);
  }
}
