import { ExternalService } from './../../services/external.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-exchange',
  templateUrl: './exchange.component.html',
  styleUrls: ['./exchange.component.scss']
})
export class ExchangeComponent implements OnInit {
  trigger: boolean = false;
  nomore: boolean = false;
  symbols: string[] = [];
  nasdaq: string[] = [];
  index: number = 0;

  constructor(private external: ExternalService) { }

  ngOnInit(): void {
    let url = 'https://app.kpnc.io/trader/retriever/symbols/';

    this.external.getRequest(['', '', ''], 0, url).subscribe((response) => {
      this.nasdaq = Object.keys(response);

      for (let i = 0; i < 5; i++) {
        this.symbols.push(this.nasdaq[this.index]);
        this.index++;
      }
    });
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
