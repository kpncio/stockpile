import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ExchangeComponent } from './components/exchange/exchange.component';
import { QuoteComponent } from './components/quote/quote.component';
import { InformationComponent } from './components/information/information.component';
import { UnknownComponent } from './components/unknown/unknown.component';

const routes: Routes = [
  { path: '', component: ExchangeComponent },
  { path: 'quote/:symbol', component: QuoteComponent},
  { path: 'information', component: InformationComponent},
  { path: '**', component: UnknownComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
