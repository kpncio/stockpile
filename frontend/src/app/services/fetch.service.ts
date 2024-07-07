import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FetchService {
  constructor(private http: HttpClient) { }

  public request(name: string, key: string): Observable<any> {
    const options = {
      headers: new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      })
    };

    return this.http.get(`https://app.kpnc.io/stockpile/retrieve/${name}/${key}`, options);
  }

  public requestee(url: string): Observable<any> {
    const options = {
      headers: new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      })
    };

    return this.http.get(url, options);
  }
}
