import { ExternalService } from './../../services/external.service';
import { LocalService } from './../../services/local.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class AccountComponent implements OnInit {
  user: string | undefined;
  real: string | undefined;

  constructor(private local: LocalService, private external: ExternalService) {

  }

  ngOnInit(): void {
    this.user = this.local.getCredentials()[0];
    this.real = this.local.getCredentials()[2];
  }
}
