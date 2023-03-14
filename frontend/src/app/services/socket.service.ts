import { Injectable } from '@angular/core';
import { Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  ws!: WebSocket;
  state = 1;

  createObservalbeSocket(url: string): Observable<any> {
    this.ws = new WebSocket(url);

    return new Observable(
      observer => {
        this.ws.onmessage = (event) => observer.next(event.data);
        this.ws.onerror = (event) => observer.error(event);
        this.ws.onclose = (event) => observer.complete();

        return () => this.ws.close(1000, 'Socket: Disconnected');
      }
    );
  }

  sendMessage(message: string): string {
    if (this.ws.readyState === this.state) {
      this.ws.send(message);

      return 'Sent: ' + message;
    } else {
      return 'Error: Did not send message';
    }
  }
}
