import { LocalService } from './services/local.service';
import { NavigationEnd, Router } from '@angular/router';
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  authenticated: boolean = false;
  title = 'KPNC Trader';

  constructor(private router: Router, private local: LocalService) {
    router.events.subscribe((evt) => {
      if (evt instanceof NavigationEnd) {
        if (!this.local.headCredentials()) {
          this.authenticated = false;

          switch (router.url) {
            case '/account/login':
            case '/account/signup':
            case '/account/logout':
            case '/policies':
            case '/sitemap':
            case '/landing':
              break;

            default:
              this.router.navigate(['/account/login']);
              break;
          }
        } else {
          this.authenticated = true;
        }
      }
    });
  }
}
