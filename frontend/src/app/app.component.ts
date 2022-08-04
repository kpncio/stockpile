import { NavigationEnd, Router } from '@angular/router';
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'KPNC Trader';

  constructor(private router: Router) {
    router.events.subscribe((evt) => {
      if (evt instanceof NavigationEnd) {
        document.body.scrollTop = document.documentElement.scrollTop = 0;
      }
    });
  }
}
