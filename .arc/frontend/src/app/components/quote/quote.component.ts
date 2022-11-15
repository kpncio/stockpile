import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ExternalService } from './../../services/external.service';
import { ChartConfiguration, ChartType } from 'chart.js';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { fromEvent, Subscription } from 'rxjs';

@Component({
  selector: 'app-quote',
  templateUrl: './quote.component.html',
  styleUrls: ['./quote.component.scss']
})
export class QuoteComponent implements OnInit {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;
  @ViewChild('chartfull') chartfull?: ElementRef;
  @ViewChild('chartlite') chartlite?: ElementRef;
  symbol: string | null | undefined;
  width: number | undefined;
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
      'Latest', '-0:30h', '-1:00h', '-1:30h', '-2:00h', '-2:30h',
      '-3:00h', '-3:30h', '-4:00h', '-4:30h', '-5:00h', '-5:30h',
      '-6:00h', '-6:30h', '-7:00h'
    ]
  };

  chartoptions: ChartConfiguration['options'] = {
    //aspectRatio: 2,
    layout: {
      padding: {
        right: 12
      }
    },
    maintainAspectRatio: false,
    elements: {
      line: {
        tension: 0.25
      }
    }, scales: {
      x: {
        reverse: true,
        ticks: {
          color: 'white',
          autoSkip: false,
          maxRotation: 90,
          minRotation: 90
        },
        grid: { color: 'rgba(255, 255, 255, 0)' }
      },
      y: {
        // beginAtZero: true,
        ticks: { color: 'white' },
        grid: { color: 'rgba(255, 255, 255, 0.25)' }
      }
    }, plugins: {
      legend: { display: false }
    }
  };

  charttype: ChartType = 'line';

  constructor(private router: Router, private route: ActivatedRoute, private external: ExternalService) { }

  ngOnInit(): void {
    this.resize = fromEvent(window, 'resize').subscribe( evt => {
      this.width = window.innerWidth;
    });

    if (this.route.snapshot.paramMap.get('symbol') == null) {
      this.router.navigate(['/']);
    } else {
      this.symbol = this.route.snapshot.paramMap.get('symbol')!.toUpperCase();
      this.router.navigate(['/quote/'  + this.symbol]);
    }

    let url = 'https://app.kpnc.io/trader/retriever/quote/' + this.symbol;

    this.external.getRequest(url).subscribe((response) => {
      this.quotes = response;

      this.timeFrame('day');
    });
  }

  onRetrieve(): void {
    this.width = window.innerWidth;

    setTimeout(() => {
      let rgb; let rgba;
      if (this.quotes.data[0].change < 0) {
        rgb = 'rgb(194, 38, 27)';
        rgba = 'rgba(194, 38, 27, 0)'
      } else {
        rgb = 'rgb(27, 194, 55)';
        rgba = 'rgba(27, 194, 55, 0)'
      }

      if (this.chartfull != undefined) {
        const gradient = this.chartfull!.nativeElement.getContext('2d').createLinearGradient(0, 0, 0, 333);
        gradient.addColorStop(0, rgb);
        gradient.addColorStop(1,rgba);
        this.chartdata.datasets[0].backgroundColor = gradient;
      }

      if (this.chartlite != undefined) {
        const gradient = this.chartlite!.nativeElement.getContext('2d').createLinearGradient(0, 0, 0, 333);
        gradient.addColorStop(0, rgb);
        gradient.addColorStop(1, rgba);
        this.chartdata.datasets[0].backgroundColor = gradient;
      }

      this.chartdata.datasets[0].borderColor = rgb;

      this.chart?.update();
    }, 500);
  }

  date(json: string, full: boolean): string {
    let date = new Date(json);

    if (full) {
      return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    } else {
      return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear() % 100}`;
    }
  }

  time(json: string): string {
    let date = new Date(json);

    let meridiem = 'AM';

    let hours = date.getHours() + 4;
    if (hours >= 12) {
      meridiem = 'PM';
    } if (hours > 12) {
      hours -= 12;
    }

    let minutes = date.getMinutes();
    if (minutes == 1 || minutes == 31) {
      minutes--;
    }

    return `${hours}:${String(minutes).padStart(2, '0')} ${meridiem} EST`;
  }

  millions(cap: number): string {
    return Math.floor(cap / 1000000).toLocaleString("en-US");
  }

  zero(json: number | null, fix: number): any {
    if (json == null) {
      return this.zero(0, fix);
    } else {
      return json.toFixed(fix);
    }
  }

  timeFrame(time?: string): void {
    switch(time) {
      case 'day':
        this.chartdata.labels = [ // 15 Data Points
          'Latest', '-0:30h', '-1:00h', '-1:30h', '-2:00h', '-2:30h',
          '-3:00h', '-3:30h', '-4:00h', '-4:30h', '-5:00h', '-5:30h',
          '-6:00h', '-6:30h', '-7:00h'
        ];
        break;
      case 'week':
        this.chartdata.labels = [ // 76 Data Points
          'Latest', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '-1d', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '-2d', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '-3d', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '-4d', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '-5d'
        ];
        break;
      case 'month':
        this.chartdata.labels = [ // 226 Data Points
          'Latest', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '-1w', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '-2w', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '-3w'
        ];
        break;
      case 'semester':
        this.chartdata.labels = [ // 1351 Data Points
          'Latest', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '-1m', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '-2m', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '-3m', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '-4m', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '-5m', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          '-6m'
        ];
        break;
      default:
        this.timeFrame('day');
        break;
    }

    this.chartdata.datasets[0].data = [];

    let last = this.quotes.data[0].price;
    for (let i = 0; i < this.chartdata.labels?.length!; i++) {
      if (this.quotes.data[i] != null) {
        this.chartdata.datasets[0].data.push(this.quotes.data[i].price);
        last = this.quotes.data[i].price;
      } else {
        this.chartdata.datasets[0].data.push(last);
      }
    }

    this.chart?.update();
  }
}
