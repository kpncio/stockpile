import { ChartOptions, CrosshairMode, DeepPartial, IChartApi, ISeriesApi, createChart } from 'lightweight-charts';
import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { FetchService } from 'src/app/services/fetch.service';
import { ActivatedRoute, Router } from '@angular/router';
import { strftime } from 'src/app/strftime';
import { KeyValue } from '@angular/common';

export interface IData {
  [key: string]: {
    close: number;
    open: number;
    high: number;
    low: number;
    volume: number;
    change: number;
    percent: number;
    dividend: number;
    split: number;
  };
}

export interface IColumn {
  close: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  change: number;
  percent: number;
  dividend: number;
  split: number;
}

@Component({
  selector: 'app-quote',
  templateUrl: './quote.component.html',
  styleUrls: ['./quote.component.scss']
})
export class QuoteComponent implements AfterViewInit {
  symbol: string | undefined;
  vieweddaily: string[] = [];
  viewedintra: string[] = [];
  viewdaily: IData = {};
  viewintra: IData = {};
  nextdaily: number = 0;
  nextintra: number = 0;
  more: boolean = false;
  eod: boolean = true;
  metadata: any = {};
  daily: IData = {};
  intra: IData = {};
  extra: any = null;
  done: number = 0;
  keys: any = {};

  @ViewChild('chart') element!: ElementRef;
  @ViewChild('tool') tooltip!: ElementRef;
  options!: DeepPartial<ChartOptions>;
  volume!: ISeriesApi<any>;
  series!: ISeriesApi<any>;
  type: string = 'line';
  chart!: IChartApi;

  constructor(private router: Router, private route: ActivatedRoute, private fetch: FetchService) { }

  ngAfterViewInit(): void {
    if (this.route.snapshot.paramMap.get('symbol') == null) {
      this.router.navigate(['/']);
    } else {
      this.symbol = this.route.snapshot.paramMap.get('symbol')!.toUpperCase();
      this.router.navigate(['/quote/' + this.symbol]);
    }

    this.options = {
      rightPriceScale: {
        scaleMargins: { top: 0.35, bottom: 0.2 },
        borderVisible: false,
      }, timeScale: {
        borderVisible: false,
      },
      layout: {
        backgroundColor: 'rgb(30, 30, 30)',
        textColor: 'rgb(255, 255, 255)',
      },
      grid: {
        horzLines: { color: 'rgb(30, 30, 30)', visible: false },
        vertLines: { color: 'rgb(30, 30, 30)' },
      }, crosshair: {
        horzLine: { visible: false, labelVisible: false },
        vertLine: { style: 0, width: 2, color: 'rgb(35, 118, 235)', labelVisible: false }
      }
    }

    this.chart = createChart(this.element.nativeElement, this.options);

    new ResizeObserver(entries => {
      if (entries.length === 0 || entries[0].target !== this.element.nativeElement) { return; }
      const rect = entries[0].contentRect;
      this.chart.resize(rect.width, rect.height);
    }).observe(this.element.nativeElement);

    this.fetch.request('META', this.symbol!).subscribe((response) => {
      this.metadata = response;

      const parts = this.metadata['joined'].split('-');
      const dated = new Date(Date.UTC(parts[0], parts[1], parts[2], 12, 0, 0));
      this.metadata['date'] = dated.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

      this.done++;
    });

    this.fetch.request('DAILY', this.symbol!).subscribe((response: IData) => {
      this.daily = response;
      this.keys['daily'] = Object.keys(this.daily).reverse();

      this.charter();
      this.load();

      this.done++;
    });

    if (this.symbol != 'LICO-F') {
      this.fetch.request('INTRA', this.symbol!).subscribe((response: IData) => {
        this.intra = response;
        this.keys['intra'] = Object.keys(this.intra).reverse();
      });
    }

    this.fetch.request('EXTRA', this.symbol!).subscribe((response: any) => {
      this.extra = response;
      console.log(this.extra);
    });
  }

  control(opt: string): void {
    switch (opt) {
      case 'daily':
        if (!this.eod) {
          this.eod = true;
          this.charter();
          this.load();
        }
        break;
      case 'intra':
        if (this.eod) {
          this.eod = false;
          this.charter();
          this.load();
        }
        break;
      case 'line':
        if (this.type != 'line') {
          this.type = 'line';
          this.charter();
        }
        break;
      case 'candle':
        if (this.type != 'candle') {
          this.type = 'candle';
          this.charter();
        }
        break;
      case 'bar':
        if (this.type != 'bar') {
          this.type = 'bar';
          this.charter();
        }
        break;
    }
  }

  charter(): void {
    const collection = this.eod ? this.daily : this.intra;

    if (this.eod) {
      this.chart.applyOptions({ timeScale: { timeVisible: false, secondsVisible: false } });
    } else {
      this.chart.applyOptions({ timeScale: { timeVisible: true, secondsVisible: false } });
    }

    if (this.series != null) { this.chart.removeSeries(this.series) }
    // if (this.volume != null) { this.chart.removeSeries(this.volume) }

    if (this.type == 'line') {
      this.chart.applyOptions({ grid: {
        horzLines: { color: 'rgb(30, 30, 30)', visible: false },
        vertLines: { color: 'rgb(30, 30, 30)', visible: false },
      }, crosshair: {
        horzLine: { visible: false, labelVisible: false },
        vertLine: { visible: true, style: 0, width: 2, color: 'rgb(35, 118, 235)', labelVisible: false }
      } });

      let data: { time: string | number; value: number; }[] = [];

      for (const [key, value] of Object.entries(collection)) {
        const time: string | number = this.eod ? key : parseInt(key);
        data.push({ time: time, value: value['close'] });
      }

      this.series = this.chart.addAreaSeries({
        topColor: 'rgba(35, 118, 235, 0.5)',
        bottomColor: 'rgba(35, 118, 235, 0.0)',
        lineColor: 'rgb(35, 118, 235)',
        lineWidth: 3
      });

      this.series.setData(data);

      const setLastBarText = (param: any = data[data.length - 1]) => {
        if (this.eod) {
          const dateStr =  param.time.year + '.' + param.time.month + '.' + param.time.day;
          this.tooltip.nativeElement.innerHTML =	`<h4>${this.metadata['exchange'] + ':' + this.symbol}<br>${data[data.length-1].value}</h4><small>${dateStr}</small>`;
        } else {
          const date = new Date(param.time * 1000);
          const dateStr = strftime('%Y.%m.%d', this.local(date));
          const timeStr = strftime('%l:%M %p', this.local(date));

          this.tooltip.nativeElement.innerHTML =	`<h4>${this.metadata['exchange'] + ':' + this.symbol}<br>${data[data.length-1].value}</h4><small>${dateStr}<br>${timeStr}</small>`;
        }
      }

      setLastBarText();

      this.chart.subscribeCrosshairMove((param: any) => {
        if (this.type == 'line') {
          if (this.eod) {
            const dateStr =  param.time.year + '.' + param.time.month + '.' + param.time.day;
            var price = param.seriesPrices.get(this.series);
            this.tooltip.nativeElement.innerHTML =	`<h4>${this.metadata['exchange'] + ':' + this.symbol}<br>${(Math.round(price * 100) / 100).toFixed(2)}</h4><small>${dateStr}</small>`;
          } else {
            const date = new Date(param.time * 1000);
            const dateStr = strftime('%Y.%m.%d', this.local(date));
            const timeStr = strftime('%l:%M %p', this.local(date));
            var price = param.seriesPrices.get(this.series);
            this.tooltip.nativeElement.innerHTML =	`<h4>${this.metadata['exchange'] + ':' + this.symbol}<br>${(Math.round(price * 100) / 100).toFixed(2)}</h4><small>${dateStr}<br>${timeStr}</small>`;
          }
        } else {
          if (this.eod) {
            const dateStr =  param.time.year + '.' + param.time.month + '.' + param.time.day;
            this.tooltip.nativeElement.innerHTML =	`<h4>${this.metadata['exchange'] + ':' + this.symbol}</h4><small>${dateStr}</small>`;
          } else {
            const date = new Date(param.time * 1000);
            const dateStr = strftime('%Y.%m.%d', this.local(date));
            const timeStr = strftime('%l:%M %p', this.local(date));
            this.tooltip.nativeElement.innerHTML =	`<h4>${this.metadata['exchange'] + ':' + this.symbol}</h4><small>${dateStr}<br>${timeStr}</small>`;
          }
        }
      });
    }

    if (this.type == 'candle' || this.type == 'bar' ) {
      this.chart.applyOptions({ grid: {
        horzLines: { color: 'rgb(86, 86, 86)', visible: true },
        vertLines: { color: 'rgb(86, 86, 86)', visible: true }
      }, crosshair: {
        mode: CrosshairMode.Normal,
        horzLine: { visible: true, style: 2, width: 1, color: 'rgb(255, 255, 255)', labelVisible: true },
        vertLine: { visible: true, style: 2, width: 1, color: 'rgb(255, 255, 255)', labelVisible: true }
      } });

      let data: { time: string | number, open: number, high: number, low: number, close: number }[] = [];
      // let volume: { time: string | number, value: number }[] = [];

      for (const [key, value] of Object.entries(collection)) {
        const time: string | number = this.eod ? key : parseInt(key);
        data.push({ time: time, open: value['open'], high: value['high'], low: value['low'], close: value['close'] });
        // volume.push({ time: time, value: value['volume'] });
      }

      this.series = this.type == 'candle' ?
        this.chart.addCandlestickSeries({
          upColor: 'rgb(27, 194, 55)',
          downColor: 'rgb(194, 38, 27)',
          borderDownColor: 'rgb(194, 38, 27)',
          borderUpColor: 'rgb(27, 194, 55)',
          wickDownColor: 'rgb(194, 38, 27)',
          wickUpColor: 'rgb(27, 194, 55)'
        }) :
        this.chart.addBarSeries({
          thinBars: true,
          downColor: 'rgb(194, 38, 27)',
          upColor: 'rgb(27, 194, 55)',
        });

      // this.volume = this.chart.addHistogramSeries({
      //   color: 'rgb(35, 118, 235)',
      //   priceFormat: {
      //     type: 'volume',
      //   },
      //   priceScaleId: '',
      //   scaleMargins: {
      //     top: 0.8,
      //     bottom: 0,
      //   },
      // });

      this.series.setData(data);
      // this.volume.setData(volume);

      const setLastBarText = (param: any = data[data.length - 1]) => {
        if (this.eod) {
          const dateStr =  param.time.year + '.' + param.time.month + '.' + param.time.day;
          this.tooltip.nativeElement.innerHTML =	`<h4>${this.metadata['exchange'] + ':' + this.symbol}</h4><small>${dateStr}</small>`;
        } else {
          const date = new Date(param.time * 1000);
          const dateStr = strftime('%Y.%m.%d', this.local(date));
          const timeStr = strftime('%l:%M %p', this.local(date));
          this.tooltip.nativeElement.innerHTML =	`<h4>${this.metadata['exchange'] + ':' + this.symbol}</h4><small>${dateStr}<br>${timeStr}</small>`;
        }
      }

      setLastBarText();
    }
  }

  sorted = (a: KeyValue<string, IColumn>, b: KeyValue<string, IColumn>) => {
    return a.key > b.key ? -1 : 1;
  }

  padded = (value: number, places: number) => {
    //return (value + 0.5) << 0;
    return (Math.round(value * 10 ** places) / 10 ** places).toFixed(places);
  }

  local(date: Date): Date {
    var newDate = new Date(date.getTime() + date.getTimezoneOffset() * 60 * 1000);

    var offset = date.getTimezoneOffset() / 60;
    var hours = date.getHours();

    newDate.setHours(hours - offset);

    return newDate;
  }

  load(): void {
    if (this.eod) {
      for (let i = 0; i < 100; i++) {
        if (this.keys['daily'][this.nextdaily]) {
          this.viewdaily[`${this.keys['daily'][this.nextdaily]}|00:00`] = this.daily[this.keys['daily'][this.nextdaily]];
          this.nextdaily++;
        }
      }
      
      this.vieweddaily = Object.keys(this.viewdaily);
    } else {
      for (let i = 0; i < 100; i++) {
        if (this.keys['intra'][this.nextintra]) {
          const date = new Date(this.keys['intra'][this.nextintra] * 1000);
          this.viewintra[strftime('%Y-%m-%d|%H:%M', this.local(date))] = this.intra[this.keys['intra'][this.nextintra]];
          this.nextintra++;
        }
      }
      
      this.viewedintra = Object.keys(this.viewintra);
    }

    this.more = this.eod ? (this.keys['daily'][this.nextdaily] ? true : false) : (this.keys['intra'][this.nextintra] ? true : false);
  }
}
