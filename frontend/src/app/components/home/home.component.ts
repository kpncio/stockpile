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
    'SPX': {'price': 0, 'change': 0, 'percent': 0},
    'NDX': {'price': 0, 'change': 0, 'percent': 0},
    'DJIA': {'price': 0, 'change': 0, 'percent': 0},
    'FOREX': {'price': 0, 'change': 0, 'percent': 0},
    'CRYPTO': {'price': 0, 'change': 0, 'percent': 0},
    'METALS': {'price': 0, 'change': 0, 'percent': 0},
    'ENERGY': {'price': 0, 'change': 0, 'percent': 0},
    'PORTFOLIO': {'price': 0, 'change': 0, 'percent': 0}
  };

  constructor(private router: Router, private ngZone: NgZone, private fetch: FetchService) {}

  routerLink(route: any[]): void {
    this.ngZone.run(() => this.router.navigate(route)).then();
  }

  ngOnInit(): void {
    this.fetch.request('https://app.kpnc.io/trader/retrieve/index/root/').subscribe((response) => {
      this.root = response;
    });
  }
}
