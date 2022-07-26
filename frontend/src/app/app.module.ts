import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { PortfolioComponent } from './components/portfolio/portfolio.component';
import { ExchangeComponent } from './components/exchange/exchange.component';
import { LobbyComponent } from './components/lobby/lobby.component';
import { AccountComponent } from './components/account/account.component';
import { LoginComponent } from './components/account/login/login.component';
import { LogoutComponent } from './components/account/logout/logout.component';
import { SignupComponent } from './components/account/signup/signup.component';
import { LandingComponent } from './components/landing/landing.component';
import { LoaderComponent } from './components/loader/loader.component';
import { PoliciesComponent } from './components/policies/policies.component';
import { SitemapComponent } from './components/sitemap/sitemap.component';
import { QuoteComponent } from './components/quote/quote.component';
import { UnknownComponent } from './components/unknown/unknown.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    PortfolioComponent,
    ExchangeComponent,
    LobbyComponent,
    AccountComponent,
    LoginComponent,
    LogoutComponent,
    SignupComponent,
    LandingComponent,
    LoaderComponent,
    PoliciesComponent,
    SitemapComponent,
    QuoteComponent,
    UnknownComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    NgChartsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
