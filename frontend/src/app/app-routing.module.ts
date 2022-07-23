import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PortfolioComponent } from './portfolio/portfolio.component';
import { ExchangeComponent } from './exchange/exchange.component';
import { LobbyComponent } from './lobby/lobby.component';
import { AccountComponent } from './account/account.component';
import { PoliciesComponent } from './policies/policies.component';
import { SitemapComponent } from './sitemap/sitemap.component';
import { LogoutComponent } from './logout/logout.component';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { QuotesComponent } from './quotes/quotes.component';

const routes: Routes = [
  { path: '', component: PortfolioComponent },
  { path: 'exchange', component: ExchangeComponent },
  { path: 'lobby', component: LobbyComponent },
  { path: 'account', component: AccountComponent },
  { path: 'policies', component: PoliciesComponent },
  { path: 'sitemap', component: SitemapComponent },
  { path: 'logout', component: LogoutComponent },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'quotes', component: QuotesComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
