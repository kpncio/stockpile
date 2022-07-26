import { NgResizeObserver, ngResizeObserverProviders } from 'ng-resize-observer';
import { NavigationEnd, Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { map } from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  providers: [...ngResizeObserverProviders]
})
export class HeaderComponent implements OnInit {
  width$ = this.resize$.pipe(map((entry) => entry.contentRect.width));

  constructor(private router: Router, private resize$: NgResizeObserver) {}

  ngOnInit(): void {
    this.router.events.subscribe((evt) => {
      if (!(evt instanceof NavigationEnd)) {
        return;
      }

      $('html').animate({ scrollTop: 0 }, 250);
      $('#nav').hide();
    });
  }

  onNavigation(): void {
    $('#nav').toggle(250);
  }
}
