import { HttpClient, HttpHeaders } from '@angular/common/http';
import { LocalService } from './local.service';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ExternalService {
  constructor(private http: HttpClient, private local: LocalService) { }

  public getRequest(user: string, pass: string, auth: number, url: string): Observable<any> {
    let headers;
    switch (auth) {
      case 0:
        headers = {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-KPNC-AUTH-USER': encodeURIComponent(this.local.getCredentials()[0]),
          'X-KPNC-AUTH-PASS': encodeURIComponent(this.local.getCredentials()[1])
        }
        break;

      case 1:
        headers = {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-KPNC-AUTH-USER': encodeURIComponent(user),
          'X-KPNC-AUTH-PASS': encodeURIComponent(pass)
        }
        break;

      default:
        headers = {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
        break;
    }

    const options = {
      headers: new HttpHeaders(headers)
    };

    return this.http.get(url, options);
  }
}
