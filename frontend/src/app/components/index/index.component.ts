import { FetchService } from './../../services/fetch.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-index',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.scss']
})
export class IndexComponent implements OnInit {
  index: string | undefined;
  viewable: string[] = [];
  symbols: string[] = [];
  results: string[] = [];
  more: boolean = false;
  searched: string = '';
  search_a: any = {};
  search_b: any = {};
  next: number = 0;

  constructor(private router: Router, private route: ActivatedRoute, private fetch: FetchService) { }

  ngOnInit(): void {
    if (this.route.snapshot.paramMap.get('symbol') == null) {
      this.router.navigate(['/']);
    } else {
      this.index = this.route.snapshot.paramMap.get('symbol')!.toUpperCase();
      this.router.navigate(['/index/' + this.index]);
    }

    interface indexed {
      [key: string]: {
        rank: number;
        name: string;
        weight: number;
      };
    }

    this.fetch.request('https://app.kpnc.io/trader/retrieve/index/' + this.index!).subscribe((response: indexed) => {
      this.symbols = Object.keys(response);

      this.load(this.symbols, true);

      Object.entries(response).forEach(([key, value]) => {
        this.search_a[key] = value['name'];
        this.search_b[value['name']] = key;
      })
    });
  }

  search(search: string): void {
    this.searched = search;

    if (search) {
      const a = Object.keys(this.search_a).filter((element) => {
        if (element.toLowerCase().includes(search.toLowerCase())) {
          return true;
        }
      });

      const b = Object.keys(this.search_b).filter((element) => {
        if (element.toLowerCase().includes(search.toLowerCase())) {
          return true;
        }
      });

      let c: string[] = [];
      b.forEach(element => {
        c.push(this.search_b[element]);
      });

      let results = a.concat(c);
      results = [...new Set([...a,...c])];
      this.results = results;

      this.load(this.results, true);
    } else {
      this.load(this.symbols, true);
    }
  }

  load(selection = !this.searched ? this.symbols : this.results, clean = false): void {
    if (clean) {
      this.viewable = [];
      this.next = 0;
    }

    for (let i = 0; i < 5; i++) {
      if (selection[this.next]) {
        this.viewable.push(selection[this.next]);
        this.next++;
      }
    }

    this.more = selection[this.next] ? true : false;
  }
}
