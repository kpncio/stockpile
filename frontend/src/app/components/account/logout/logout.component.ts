import { LocalService } from './../../../services/local.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.scss']
})
export class LogoutComponent implements OnInit {
  constructor (private local: LocalService) {}

  ngOnInit(): void {
    this.delay().then(() => this.local.deleteCredentials());
  }

  delay() {
    return new Promise(resolve => setTimeout(resolve, 2000));
  }
}
