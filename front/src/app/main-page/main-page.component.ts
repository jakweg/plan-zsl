import {Component, OnDestroy, OnInit} from '@angular/core';
import {AppService} from '../app.service';
import {ApiService} from '../api.service';

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.css']
})
export class MainPageComponent implements OnInit, OnDestroy {

  bookmarkedPlans: string[];
  pwaEvent;
  showAdm;
  mapLink = AppService.mapLink;
  newPlanComing = AppService.shouldNotifyAboutTimetableChange;
  isOtherThenCurrentSelected = AppService.selectedTimetableId !== 0 && AppService.selectedTimetableId !== +AppService.currentTimetableId;
  private pwaInstallSubscription;

  constructor(private app: AppService, private api: ApiService) {
  }

  ngOnInit() {
    this.api.pingCurrentIfNeeded();

    if (localStorage) this.showAdm = localStorage.getItem('wasAdm');

    this.app.setToolbar(null);
    this.bookmarkedPlans = this.app.getBookmarkedPlans();

    this.pwaInstallSubscription = this.app.pwaInstallEvent.subscribe((e) => {
      setTimeout(() => this.pwaEvent = e, 30);
    });
  }

  installPwa() {
    if (!this.pwaEvent) return;

    this.pwaEvent.prompt();
    this.pwaEvent.userChoice.then(() => {
      this.app.pwaInstallEvent.next(undefined);
    });
  }

  ngOnDestroy() {
    this.pwaInstallSubscription.unsubscribe();
  }

}
