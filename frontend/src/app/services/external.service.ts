import { HttpClient, HttpHeaders } from '@angular/common/http';
import { LocalService } from './local.service';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ExternalService {
  constructor(private http: HttpClient, private local: LocalService) { }

  public getRequest(cred: string[], auth: number, url: string): Observable<any> {
    let headers;
    switch (auth) {
      case 0:
        headers = {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-KPNC-AUTH-USER': encodeURIComponent(this.local.getCredentials()[0]),
          'X-KPNC-AUTH-PASS': encodeURIComponent(this.local.getCredentials()[1]),
          'X-KPNC-AUTH-INFO': encodeURIComponent(cred[2])
        }
        break;

      case 1:
        headers = {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-KPNC-AUTH-USER': encodeURIComponent(cred[0]),
          'X-KPNC-AUTH-PASS': encodeURIComponent(cred[1]),
          'X-KPNC-AUTH-INFO': encodeURIComponent(cred[2])
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
