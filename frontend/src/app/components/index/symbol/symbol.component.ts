import { Component, Input, NgZone, OnInit } from '@angular/core';
import { FetchService } from 'src/app/services/fetch.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-symbol',
  templateUrl: './symbol.component.html',
  styleUrls: ['./symbol.component.scss']
})
export class SymbolComponent implements OnInit {
  @Input() symbol!: string;
  color: string = '#fff';
  preview: number[] = [];
  percent: number = 0;
  price: string = '';
  name: string = '';
  done: number = 0;
  options: any;

  constructor(private router: Router, private ngZone: NgZone, private fetch: FetchService) { }

  routerLink(route: any[]): void {
    this.ngZone.run(() => this.router.navigate(route)).then();
  }

  ngOnInit(): void {
    this.fetch.request('https://app.kpnc.io/trader/retrieve/meta/' + this.symbol).subscribe((response) => {
      this.name = response['name'];

      this.done++;
    });

    this.fetch.request('https://app.kpnc.io/trader/retrieve/preview/' + this.symbol).subscribe((response) => {
      this.preview = response;

      this.price = (Math.round((this.preview[this.preview.length - 1] + Number.EPSILON) * 1000) / 1000).toLocaleString();
      this.percent = (this.preview[this.preview.length - 1] - this.preview[this.preview.length - 2]) / this.preview[this.preview.length - 2] * 100;
      this.percent = Math.round((this.percent + Number.EPSILON) * 100) / 100;

      this.done++;

      this.graph()
    });
  }

  graph(): void {
    this.color = this.percent == 0 ? '#FFFFFF' : this.percent > 0 ? '#1BC537' : '#C2261B'

    this.options = {
      color: this.color,
      animation: false,
      width: 1,
      grid: {
        show: false,
        height: '100%',
        width: '100%',
        bottom: 0,
        top: 0
      },
      xAxis: {
        inverse: false,
        data: [
          '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', ''
        ],
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        }
      },
      yAxis: {
        show: false,
        type: 'value',
        scale: true,
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        splitLine: {
          show: false
        }
      },
      series: [{
        name: '',
        type: 'line',
        data: this.preview,
        showSymbol: false,
        lineStyle: {
          width: 3
        }
      }]
    };
  }
}
