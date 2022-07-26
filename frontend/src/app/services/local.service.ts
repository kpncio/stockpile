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
    }

    return [
      localStorage.getItem('username')!,
      localStorage.getItem('password')!,
      localStorage.getItem('realname')!
    ]
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

