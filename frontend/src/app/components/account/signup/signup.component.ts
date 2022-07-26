import { ExternalService } from './../../../services/external.service';
import { LocalService } from './../../../services/local.service';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {
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

  submit(form: any, data: string[]): void {
    if (form.invalid) {
      this.attempted = true;
    } else {
      this.submitting = true;

      const user = data[0];
      const pass = data[1];
      const conf = data[2];

      if (conf === pass) {
        this.external.getRequest(user, pass, 1, 'https://app.kpnc.io/trader/authenticator/create').subscribe((response) => {
          if (response != null) {
            if (response.verified) {
             this.local.postCredentials(user.toLowerCase(), pass, user);

              this.router.navigate(['/']);
            } else {
              this.message = response.message;
              this.failed = true;
              this.submitting = false;
            }
          } else {
            this.failed = true;
            this.submitting = false;
          }
        });
      } else {
        this.message = 'Passwords do not match...';
        this.failed = true;
        this.submitting = false;
      }
    }
  }

  valid(input: any): boolean {
    if (input.touched && input.invalid) {
      return true;
    }

    if (this.attempted && input.invalid) {
      return true;
    }

    return false;
  }

  dismiss(): void {
    this.failed = false;
  }
}
