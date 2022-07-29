import { Component, NgZone, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { fromEvent, Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  width: number | undefined;
  resize!: Subscription;

  constructor(private router: Router, private ngZone: NgZone) {}

  ngOnInit(): void {
    this.resize = fromEvent(window, 'resize').subscribe( evt => {
      this.width = window.innerWidth;
    });

    this.width = window.innerWidth;

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

  routerLink(route: any[]): void {
    this.ngZone.run(() => this.router.navigate(route)).then();
  }
}
