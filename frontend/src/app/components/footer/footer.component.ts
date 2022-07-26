import { NgResizeObserver, ngResizeObserverProviders } from 'ng-resize-observer';
import { Component } from '@angular/core';
import { map } from 'rxjs';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  providers: [...ngResizeObserverProviders]
})
export class FooterComponent {
  width$ = this.resize$.pipe(map((entry) => entry.contentRect.width));

  constructor(private resize$: NgResizeObserver) {}
}
