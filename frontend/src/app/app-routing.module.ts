import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LandingComponent } from './components/landing/landing.component';
import { PortfolioComponent } from './components/portfolio/portfolio.component';
import { ExchangeComponent } from './components/exchange/exchange.component';
import { LobbyComponent } from './components/lobby/lobby.component';
import { AccountComponent } from './components/account/account.component';
import { SignupComponent } from './components/account/signup/signup.component';
import { LoginComponent } from './components/account/login/login.component';
import { LogoutComponent } from './components/account/logout/logout.component';
import { QuoteComponent } from './components/quote/quote.component';
import { PoliciesComponent } from './components/policies/policies.component';
import { SitemapComponent } from './components/sitemap/sitemap.component';
import { UnknownComponent } from './components/unknown/unknown.component';

const routes: Routes = [
  { path: 'landing', component: LandingComponent},
  { path: '', component: PortfolioComponent },
  { path: 'exchange', component: ExchangeComponent },
  { path: 'lobby', component: LobbyComponent },
  { path: 'account', component: AccountComponent },
  { path: 'account/signup', component: SignupComponent },
  { path: 'account/login', component: LoginComponent },
  { path: 'account/logout', component: LogoutComponent },
  { path: 'quote/:symbol', component: QuoteComponent},
  { path: 'policies', component: PoliciesComponent },
  { path: 'sitemap', component: SitemapComponent },
  { path: '**', component: UnknownComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
