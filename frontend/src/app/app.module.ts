import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { ExchangeComponent } from './exchange/exchange.component';
import { LobbyComponent } from './lobby/lobby.component';
import { AccountComponent } from './account/account.component';
import { PoliciesComponent } from './policies/policies.component';
import { SitemapComponent } from './sitemap/sitemap.component';
import { LogoutComponent } from './logout/logout.component';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { PortfolioComponent } from './portfolio/portfolio.component';
import { QuotesComponent } from './quotes/quotes.component';

@NgModule({
  declarations: [
    AppComponent,
    ExchangeComponent,
    LobbyComponent,
    AccountComponent,
    PoliciesComponent,
    SitemapComponent,
    LogoutComponent,
    LoginComponent,
    SignupComponent,
    PortfolioComponent,
    QuotesComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
