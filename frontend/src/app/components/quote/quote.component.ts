import { FetchService } from 'src/app/services/fetch.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-quote',
  templateUrl: './quote.component.html',
  styleUrls: ['./quote.component.scss']
})
export class QuoteComponent implements OnInit {
  symbol: string | undefined;

  constructor(private router: Router, private route: ActivatedRoute, private fetch: FetchService) { }

  ngOnInit(): void {
    if (this.route.snapshot.paramMap.get('symbol') == null) {
      this.router.navigate(['/']);
    } else {
      this.symbol = this.route.snapshot.paramMap.get('symbol')!.toUpperCase();
      this.router.navigate(['/quote/' + this.symbol]);
    }
  }
}
