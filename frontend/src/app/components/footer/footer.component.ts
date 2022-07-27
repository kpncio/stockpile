import { NgResizeObserver, ngResizeObserverProviders } from 'ng-resize-observer';
import { Component, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { map } from 'rxjs';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  providers: [...ngResizeObserverProviders]
})
export class FooterComponent {
  width$ = this.resize$.pipe(map((entry) => entry.contentRect.width));

  constructor(private router: Router, private ngZone: NgZone, private resize$: NgResizeObserver) {}

  routerLink(route: any[]): void {
    this.ngZone.run(() => this.router.navigate(route)).then();
  }
}
