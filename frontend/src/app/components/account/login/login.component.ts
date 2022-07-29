import { ExternalService } from './../../../services/external.service';
import { LocalService } from './../../../services/local.service';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  message: string = 'Authentication failed...';
  submitting: boolean = false;
  attempted: boolean = false;
  failed: boolean = false;

  constructor(private router: Router, private local: LocalService, private external: ExternalService) { }

  ngOnInit(): void {
    if (this.local.headCredentials()) {
      this.router.navigate(['/']);
    }
  }

  submit(user: string, pass: string): void {
      this.attempted = true;
    if (this.valid(0, user) && this.valid(1, pass)) {
      this.submitting = true;

      this.external.getRequest([user, pass, ''], 1, 'https://app.kpnc.io/trader/authenticator/').subscribe((response) => {
        if (response != null) {
          if (response.verified) {
            this.local.postCredentials(user.toLowerCase(), pass, response.display, response.lobby);

            this.router.navigate(['/']);
          } else {
            this.message = response.message;
            this.submitting = false;
            this.attempted = false;
            this.failed = true;
          }
        } else {
          this.submitting = false;
          this.attempted = false;
          this.failed = true;
        }
      });
    }
  }

  valid(type: number, value: string): boolean {
    switch (type) {
      case 0:
        const userex = /^([\w]{3,25})$/;

        if (userex.test(value)) {
          return true;
        }
        break;

      case 1:
        const passex = /^([\w`~!@#$%\^&*()\-_=+;:'",.<>|\\/?]{5,})$/;

        if (passex.test(value)) {
          return true;
        }
        break;

      default:
        break;
    }

    return false;
  }

  dismiss(): void {
    this.failed = false;
  }
}
