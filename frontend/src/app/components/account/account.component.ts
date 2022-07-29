import { ExternalService } from './../../services/external.service';
import { LocalService } from './../../services/local.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class AccountComponent implements OnInit {
  @ViewChild('passwordForm') passwordForm!: NgForm;
  @ViewChild('displayForm') displayForm!: NgForm;
  @ViewChild('deleteForm') deleteForm!: NgForm;
  @ViewChild('lobbyForm') lobbyForm!: NgForm;
  success: string | undefined | null;
  error: string | undefined | null;
  info: number | undefined | null;
  submitting: boolean = false;
  lobby: string | undefined;
  user: string | undefined;
  real: string | undefined;

  constructor(private router: Router, private local: LocalService, private external: ExternalService) {}

  ngOnInit(): void {
    this.user = this.local.getCredentials()[0];
    this.real = this.local.getCredentials()[2];
    this.lobby = this.local.getCredentials()[3];

    setTimeout(() => {
      this.displayForm.controls['display'].setValue(this.real);
      this.passwordForm.controls['password'].setValue('•••••••••••••••');
      this.lobbyForm.controls['lobby'].setValue(this.lobby);
      this.deleteForm.controls['deleted'].setValue('');
    }, 1);
  }

  dismiss(error: number): void {
    switch (error) {
      case 0:
        this.success = null;
        break;

      case 1:
        this.error = null;
        break;

      case 2:
        this.info = null;
        break;
    }
  }

  changeDisplay(display: string): void {
    const regex = /^([\w]{3,25})$/;

    this.submitting = true;
    if (regex.test(display)) {
      this.external.getRequest(['', '', display], 0, 'https://app.kpnc.io/trader/authenticator/display').subscribe((response) => {
        if (response.verified) {
          this.local.postCredentials(this.local.getCredentials()[0], this.local.getCredentials()[1], display, this.local.getCredentials()[3]);

          this.displayForm.controls['display'].setValue(display);

          this.success = 'Success: \n\n' + response.message;
        } else {
          this.error = 'Could not change display name: \n\n' + response.message;
        }
      });
    } else {
      this.error = 'Invalid display name: \n\nLength of 3-25 characters, including any latin characters, \nnumerical digits, and/or underscores... \n\n /^([\w]{3,25})$/';
    }
    this.submitting = false;
  }

  changePassword(password: string): void {
    const regex = /^([\w`~!@#$%\^&*()\-_=+;:'",.<>|\\/?]{5,})$/;

    this.submitting = true;
    if (regex.test(password)) {
      this.external.getRequest(['', '', password], 0, 'https://app.kpnc.io/trader/authenticator/password').subscribe((response) => {
        if (response.verified) {
          this.local.postCredentials(this.local.getCredentials()[0], password, this.local.getCredentials()[2], this.local.getCredentials()[3]);

          this.passwordForm.controls['password'].setValue('•••••••••••••••');

          this.success = 'Success: \n\n' + response.message;
        } else {
          this.error = 'Could not change password: \n\n' + response.message;
        }
      });
    } else {
      this.error = 'Invalid password: \n\n Length of 8-100 characters, including any latin characters, \nnumerical digits, and/or special characters... \n\n /^([\\w`~!@#$%\\^&*()\\-_=+;:\'",.<>|\\\\/?]{5,})$/';
    }
    this.submitting = false;
  }

  changeLobby(lobby: string): void {
    const regex = /^([a-z]{3,10})$/;

    this.submitting = true;
    if (regex.test(lobby)) {
      this.external.getRequest(['', '', lobby], 0, 'https://app.kpnc.io/trader/authenticator/lobby').subscribe((response) => {
        if (response.verified) {
          this.local.postCredentials(this.local.getCredentials()[0], this.local.getCredentials()[1], lobby, this.local.getCredentials()[3]);

          this.lobbyForm.controls['lobby'].setValue(lobby);

          this.success = 'Success: \n\n' + response.message;
        } else {
          this.error = 'Could not change lobby name: \n\n' + response.message;
        }
      });
    } else {
      this.error = 'Invalid lobby name: \n\n Length of 3-10 characters, including only lowercase latin characters... \n\n /^([a-z]{3,10})$/';
    }
    this.submitting = false;
  }

  deleteAccount(deleted: string): void {
    const regex = /DELETE/i;

    this.submitting = true;
    if (regex.test(deleted)) {
      this.external.getRequest(['', '', ''], 0, 'https://app.kpnc.io/trader/authenticator/delete').subscribe((response) => {
        if (response.verified) {
          this.local.deleteCredentials();

          this.router.navigate(['/account/login']);
        } else {
          this.error = 'Could not delete account: \n\n' + response.message;
        }
      });
    } else {
      this.error = 'Invalid input: \n\n To delete your account enter "DELETE" to confirm deletion... \n\n /DELETE/i';
    }
    this.submitting = false;
  }
}
