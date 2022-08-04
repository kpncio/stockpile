import { ExternalService } from 'src/app/services/external.service';
import { Component, Input, OnInit } from '@angular/core';
import { fromEvent, Subscription } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-symbol',
  templateUrl: './symbol.component.html',
  styleUrls: ['./symbol.component.scss']
})
export class SymbolComponent implements OnInit {
  width: number | undefined;
  @Input() symbol!: string;
  resize!: Subscription;
  up: boolean = false;
  data: number[] = [];
  options: any;
  quotes: any;

  constructor(private router: Router, private external: ExternalService) { }

  ngOnInit(): void {
    this.resize = fromEvent(window, 'resize').subscribe( evt => {
      this.width = window.innerWidth;
    });

    let url = 'https://app.kpnc.io/trader/retriever/quote/' + this.symbol;

    this.external.getRequest(url).subscribe((response) => {
      this.quotes = response;

      for (let i = 0; i < 76; i++) {
        this.data.push(this.quotes.data[i].price);
      }

      if (this.data[0]! > this.data[75]!) {
        this.up = true;
      }

      this.options = {
        color: !this.up ? '#c2261b' : '#1bc237',
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
          inverse: true,
          data: [
            '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
            '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
            '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
            '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
            '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
            ''
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
          data: this.data,
          showSymbol: false,
          lineStyle: {
            width: 1
          }
        }]
      };
    });
  }

  getQuote(): void {
    this.router.navigate(['/quote/' + this.symbol]);
  }

  onRetrieve() {
    this.width = window.innerWidth;
  }

  millions(cap: number): string {
    return Math.floor(cap / 1000000).toLocaleString("en-US");
  }

  zero(json: number, fix: number) {
    return json.toFixed(fix);
  }
}
