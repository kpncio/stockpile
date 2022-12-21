import { FetchService } from 'src/app/services/fetch.service';
import { Component, NgZone, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  root: any = {
    'SPX': {'name': 'S&P 500', 'change': 0, 'price': 0, 'percent': '(◆ 0%)'},
    'NDX': {'name': 'Nasdaq 100', 'change': 0, 'price': 0, 'percent': '(◆ 0%)'},
    'DJIA': {'name': 'Dow Jones', 'change': 0, 'price': 0, 'percent': '(◆ 0%)'},
    'FOREX': {'name': 'Forex', 'change': 0, 'price': 0, 'percent': '(◆ 0%)'},
    'CRYPTO': {'name': 'Crypto', 'change': 0, 'price': 0, 'percent': '(◆ 0%)'},
    'METALS': {'name': 'Metals', 'change': 0, 'price': 0, 'percent': '(◆ 0%)'},
    'ENERGY': {'name': 'Energy', 'change': 0, 'price': 0, 'percent': '(◆ 0%)'},
    'PORTFOLIO': {'name': 'Portfolio', 'change': 0, 'price': 0, 'percent': '(◆ 0%)'}
  };

  dict: any = {
    'SPX': 'S&P 500',
    'NDX': 'Nasdaq 100',
    'DJIA': 'Dow Jones',
    'FOREX': 'Forex',
    'CRYPTO': 'Crypto',
    'METALS': 'Metals',
    'ENERGY': 'Energy',
    'PORTFOLIO': 'Portfolio'
  };

  constructor(private router: Router, private ngZone: NgZone, private fetch: FetchService) {}

  routerLink(route: any[]): void {
    this.ngZone.run(() => this.router.navigate(route)).then();
  }

  ngOnInit(): void {
    interface previewed {
      [key: string]: {
        price: any;
        change: any;
        percent: any;
      };
    }

    this.fetch.request('INDEX', 'ROOT').subscribe((response: previewed) => {
      this.root = response;

      for (const [key, value] of Object.entries(response)) {
        const direction = parseFloat(value['change']) == 0 ? '◆' : parseFloat(value['change']) > 0 ? '▲' : '▼';

        this.root[key] = {
          'name': this.dict[key],
          'change': parseFloat(value['change']),
          'price': (Math.round((parseFloat(value['price']) + Number.EPSILON) * 100) / 100).toLocaleString(),
          'percent': `(${direction} ${(Math.round((parseFloat(value['percent']) + Number.EPSILON) * 100) / 100).toLocaleString()}%)`
        };
      }
    });
  }
}
