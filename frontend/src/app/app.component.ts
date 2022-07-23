import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import * as $ from "jquery";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  host: {
    '(window:resize)': 'onResize($event)'
  }
})
export class AppComponent implements OnInit {
  title = 'Trader';

  constructor(private router: Router) {}

  ngOnInit() {
    this.router.events.subscribe((evt) => {
      if (!(evt instanceof NavigationEnd)) {
        return;
      }

      $("html").animate({ scrollTop: 0 }, 250);
      $('#nav').hide();
    });

    if (window.innerWidth < 750) { $('#hl').show(); $('#hf').hide(); } else { $('#hl').hide(); $('#hf').show(); }
    if (window.innerWidth < 750) { $('#fl').show(); $('#ff').hide(); } else { $('#fl').hide(); $('#ff').show(); }

    $('#nav').hide;
  }

  onResize() {
    if (window.innerWidth < 750) { $('#hl').show(); $('#hf').hide(); } else { $('#hl').hide(); $('#hf').show(); }
    if (window.innerWidth < 750) { $('#fl').show(); $('#ff').hide(); } else { $('#fl').hide(); $('#ff').show(); }

    $('#nav').hide();
  }

  nav() {
    $('#nav').toggle(250);
  }
}
