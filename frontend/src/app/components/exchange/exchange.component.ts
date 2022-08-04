import { ExternalService } from './../../services/external.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-exchange',
  templateUrl: './exchange.component.html',
  styleUrls: ['./exchange.component.scss']
})
export class ExchangeComponent implements OnInit {
  nomore: boolean = false;
  symbols: string[] = [];
  nasdaq: string[] = [];
  index: number = 0;
  a: object = {};
  b: object = {};

  constructor(private external: ExternalService) { }

  ngOnInit(): void {
    this.external.getRequest('https://app.kpnc.io/trader/retriever/symbols/').subscribe((response) => {
      this.nasdaq = Object.keys(response);
      this.a = response;

      for (let i = 0; i < 5; i++) {
        this.symbols.push(this.nasdaq[this.index]);
        this.index++;
      }
    });

    this.external.getRequest('https://app.kpnc.io/trader/retriever/names/').subscribe((response) => {
      this.b = response;
    });
  }

  search(search: string): void {
    if (search.length != 0) {
      const a = Object.fromEntries(Object.entries(this.a).filter(([key]) => key.toLowerCase().includes(search)));

      const b = Object.fromEntries(Object.entries(this.b).filter(([key]) => key.toLowerCase().includes(search)));

      const c = Object.fromEntries(Object.entries(b).map(
        ([key, value]) => [value, key]
      ));

      const results = Object.keys(Object.assign({}, a, c));

      if (results.length != 0) {
        this.symbols = results;
      } else {
        this.symbols = ['NO RESULTS'];
      }

      this.nomore = true;
    } else {
      this.symbols = [];
      this.index = 0;

      for (let i = 0; i < 5; i++) {
        this.symbols.push(this.nasdaq[this.index]);
        this.index++;
      }

      this.nomore = false;
    }
  }

  more(): void {
    for (let i = 0; i < 10; i++) {
      if (this.symbols < this.nasdaq) {
        this.symbols.push(this.nasdaq[this.index]);
        this.index++;
      }
    }

    if (this.symbols >= this.nasdaq) {
      this.nomore = true;
    }
  }
}
