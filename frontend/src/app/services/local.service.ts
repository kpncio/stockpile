import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class LocalService {
  constructor(private router: Router) { }

  public postCredentials(user: string, pass: string, real: string, lobby: string): void {
    console.log('Pre: ' + real);
    console.log('Pre: ' + lobby);

    user = this.encodeB644(user);
    pass = this.encodeB644(pass);
    real = this.encodeB644(real);
    lobby = this.encodeB644(lobby);

    console.log('Post: ' + real);
    console.log('Post: ' + lobby);

    localStorage.setItem('username', user);
    localStorage.setItem('password', pass);
    localStorage.setItem('realname', real);
    localStorage.setItem('lobby', lobby);
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

    if (localStorage.getItem('lobby') == null) {
      return false;
    }

    return true;
  }

  public getCredentials(): string[] {
    if (!this.headCredentials()) {
      return ['', '', '', ''];
    } else {
      let user = this.decodeB644(localStorage.getItem('username')!);
      let pass = this.decodeB644(localStorage.getItem('password')!);
      let real = this.decodeB644(localStorage.getItem('realname')!);
      let lobby = this.decodeB644(localStorage.getItem('lobby')!);

      return [user, pass, real, lobby];
    }
  }

  public deleteCredentials(): void {
    if (this.headCredentials()) {
      localStorage.removeItem('username');
      localStorage.removeItem('password');
      localStorage.removeItem('realname');
      localStorage.removeItem('lobby');
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
