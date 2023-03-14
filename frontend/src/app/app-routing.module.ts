import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';

import { HomeComponent } from './components/home/home.component';
import { IndexComponent } from './components/index/index.component';
import { QuoteComponent } from './components/quote/quote.component';
import { LiveComponent } from './components/live/live.component';
import { InformationComponent } from './components/information/information.component';
import { UnknownComponent } from './components/unknown/unknown.component';

const routes: Routes = [
  { path: '', component: HomeComponent},
  { path: 'index/:symbol', component: IndexComponent},
  { path: 'quote/:symbol', component: QuoteComponent},
  { path: 'live', component: LiveComponent},
  { path: 'live/:index', component: LiveComponent},
  { path: 'live/:index/:symbol', component: LiveComponent},
  { path: 'information', component: InformationComponent},
  { path: '**', component: UnknownComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }