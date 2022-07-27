import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class LocalService {
  constructor(private router: Router) { }

  public postCredentials(user: string, pass: string, real: string): void {
    user = this.encodeB644(user);
    pass = this.encodeB644(pass);
    real = this.encodeB644(real);

    localStorage.setItem('username', user);
    localStorage.setItem('password', pass);
    localStorage.setItem('realname', real);
  }

  public headCredentials(): boolean {
    if (localStorage.getItem('username') == null) {
      return false;
    }

    if (localStorage.getItem('password') == null) {
      return false;
    }

    if (localStorage.getItem('realname') == null) {
      return false;
    }

    return true;
  }

  public getCredentials(): string[] {
    if (!this.headCredentials()) {
      return ['', '', ''];
    } else {
      let user = this.decodeB644(localStorage.getItem('username')!);
      let pass = this.decodeB644(localStorage.getItem('password')!);
      let real = this.decodeB644(localStorage.getItem('realname')!);

      return [user, pass, real];
    }
  }

  public deleteCredentials(): void {
    if (this.headCredentials()) {
      localStorage.removeItem('username');
      localStorage.removeItem('password');
      localStorage.removeItem('realname');
    }

    this.router.navigate(['/account/login']);
  }

  encodeB644(encodee: string): string {
    return btoa(btoa(btoa(btoa(encodeURIComponent(encodee)))));
  }

  decodeB644(decodee: string) : string{
    return decodeURIComponent(atob(atob(atob(atob(decodee)))));
  }
}
