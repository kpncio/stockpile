import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';

import { HomeComponent } from './components/home/home.component';
import { InformationComponent } from './components/information/information.component';
import { UnknownComponent } from './components/unknown/unknown.component';

const routes: Routes = [
  { path: '', component: HomeComponent},
  // { path: 'index/:symbol', component: IndexComponent},
  // { path: 'quote/:symbol', component: QuoteComponent},
  { path: 'information', component: InformationComponent},
  { path: '**', component: UnknownComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
