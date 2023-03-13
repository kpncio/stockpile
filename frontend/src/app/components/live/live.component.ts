import { SocketService } from 'src/app/services/socket.service';
import { FetchService } from 'src/app/services/fetch.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Component, NgZone } from '@angular/core';
import { Subscription } from 'rxjs';

export interface IMessage {
  eventName: string,
  authorization: string,
  eventData: {
    thresholdLevel: number,
    tickers: string[]
  }
}

@Component({
  selector: 'app-live',
  templateUrl: './live.component.html',
  styleUrls: ['./live.component.scss'],
  providers: [SocketService]
})
export class LiveComponent {
  subscription!: Subscription;
  symbol: string | undefined;
  index: string | undefined;
  loading: boolean = false;
  messages: any[][] = [];
  tiingo: string | null;
  info: boolean = true;
  data: any[] = [];
  
  pending = {
    'index': '',
    'symbol': '',
    'tiingo': ''
  };

  constructor(private router: Router, private ngZone: NgZone, private route: ActivatedRoute, private fetch: FetchService, private socket: SocketService) {
    if (this.route.snapshot.paramMap.get('index') == null) {
      this.router.navigate(['/live']);
      this.info = false;
    }

    if (this.route.snapshot.paramMap.get('symbol') == null) {
      this.router.navigate(['/live']);
      this.info = false;
    }

    if (this.info) {
      this.index = this.route.snapshot.paramMap.get('index')!.toUpperCase();
      this.symbol = this.route.snapshot.paramMap.get('symbol')!.toUpperCase();
      this.router.navigate(['/live/' + this.index + '/' + this.symbol]);
    }

    this.tiingo = localStorage.getItem('tiingo');

    if (this.info && this.tiingo) {
      let endpoint;
      switch (this.index) {
        case 'CRYPTO': endpoint = 'crypto'; break;
        case 'FOREX': endpoint = 'fx'; break;
        case 'DJIA': endpoint = 'iex'; break;
        case 'SPX': endpoint = 'iex'; break;
        case 'NDX': endpoint = 'iex'; break;
        default: endpoint = 'iex'; break;
      }

      this.subscription = this.socket.createObservalbeSocket('wss://proxy.kpnc-servers.net/' + endpoint).subscribe(
        data => {
          this.data.push(data);

          console.log('Received: ' + data);
        },
        err => console.log('Error: ' + err),
        () => console.log('Observable: Stream complete.')
      )
    }
  }

  routerLink(route: any[]): void {
    this.ngZone.run(() => this.router.navigate(route)).then();
  }

  messenger(message: IMessage) {
    this.socket.sendMessage(JSON.stringify(message));
  }

  changedIndex(control: any): void {
    this.pending['index'] = control.value.toUpperCase();
  }

  changedSymbol(control: any): void {
    this.pending['symbol'] = control.value.toUpperCase();
  }

  changedTiingo(control: any): void {
    this.pending['tiingo'] = control.value;
  }

  clicked(): void {
    this.loading = true;
    this.messages = [];

    this.verifyIndex();
  }

  verifyIndex(): void {
    if (!this.info) {
      if (!this.pending['index']) {
        this.messages.push(['Index required', false]);
    
        this.verifySymbol();
      } else {
        interface test {
          [key: string]: {
            name: string;
          };
        }
  
        this.fetch.request('INDEX', 'INDICES').subscribe((response: test) => {
          if (Object.keys(response).includes(this.pending['index'])) {
            if (this.pending['index'] != 'METALS' && this.pending['index'] != 'ENERGY') {
              this.messages.push(['Valid Index - ' + response[this.pending['index']], true]);
    
              this.index = this.pending['index'];
    
              this.verifySymbol();
            } else {
              this.messages.push(['Unsupported Index', false]);
    
              this.index = undefined;
    
              this.verifySymbol();
            }
          } else {
            this.messages.push(['Invalid Index', false]);
    
            this.index = undefined;
    
            this.verifySymbol();
          }
        });
      }
    } else {
      this.verifySymbol();
    }
  }

  verifySymbol(): void {
    if (!this.info) {
      if (!this.pending['symbol']) {
        this.messages.push(['Symbol required', false]);
    
        this.verifyTiingo();
      } else {
        interface test {
          [key: string]: {
            name: string;
          };
        }
  
        this.fetch.request('INDEX', 'SEARCH').subscribe((response: test) => {
          if (Object.keys(response).includes(this.pending['symbol'])) {
            this.messages.push(['Valid Symbol - ' + response[this.pending['symbol']], true]);
  
            this.symbol = this.pending['symbol'];
    
            this.verifyTiingo();
          } else {
            this.messages.push(['Invalid Symbol', false]);
    
            this.symbol = undefined;
    
            this.verifyTiingo();
          }
        });
      }
    } else {
      this.verifyTiingo();
    }
  }

  verifyTiingo(): void {
    if (!this.tiingo) {
      if (!this.pending['tiingo']) {
        this.messages.push(['API key required', false]);
    
        this.verifyFinal();
      } else {
        interface test {
          message: string;
        }
    
        const url = 'https://proxy.kpnc-servers.net/api/test?token=' + this.pending['tiingo'];
    
        this.fetch.requestee(url).subscribe((response: test) => {
          if (response.message == 'You successfully sent a request') {
            this.messages.push(['Valid API Key - Tiingo', true]);
  
            localStorage.setItem('tiingo', this.pending['tiingo']);
  
            this.tiingo = this.pending['tiingo'];
    
            this.verifyFinal();
          } else {
            this.messages.push(['Invalid API Key', false]);
    
            this.verifyFinal();
          }
        });
      }
    } else {
      this.verifyFinal();
    }
  }

  verifyFinal(): void {
    if (this.index && this.symbol) {
      this.info = true;
    }

    if (this.info && this.tiingo) {
      this.router.navigate(['/live/' + this.index + '/' + this.symbol]);
    }

    this.loading = false;

    this.messages.push(['Validation failed', false]);
  }
}
