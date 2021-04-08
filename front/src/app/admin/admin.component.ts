import {Component, OnDestroy, OnInit} from '@angular/core';
import {AdminService} from '../admin.service';
import {Subscription} from 'rxjs';
import {ToolbarOptions} from '../model/ToolbarOptions';
import {AppService} from '../app.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit, OnDestroy {

  isSignedIn = false;
  readonly subs: Subscription[] = [];

  readonly toolbar = new ToolbarOptions('Panel administracyjny',
    'Panel administracyjny planu lekcji', true, []);

  constructor(private service: AdminService, private app: AppService) {
  }

  ngOnInit() {
    this.app.setToolbar(this.toolbar);
    this.subs.push(this.service.signedStatus.subscribe((r) => this.isSignedIn = r));
  }

  ngOnDestroy(): void {
    for (const s of this.subs)
      s.unsubscribe();
  }

  logout() {
    this.service.logout();
  }

}
