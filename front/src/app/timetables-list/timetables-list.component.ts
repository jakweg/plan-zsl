import { Component, OnDestroy, OnInit } from '@angular/core'
import { Subscription } from 'rxjs'
import {AdminService} from '../admin.service';
import {log} from 'util';
import {TimetableInfo} from '../model/timetable-info';

@Component({
  selector: 'app-timetables-list',
  templateUrl: './timetables-list.component.html',
  styleUrls: ['./timetables-list.component.css']
})
export class TimetablesListComponent implements OnInit, OnDestroy {

  constructor(private service: AdminService) {
  }

  error: any;
  timetables: TimetableInfo[];
  private sub: Subscription;

  ngOnInit() {
    this.sub = this.service.appState
        .subscribe((state) => this.timetables = state.timetables || []);
  }
  ngOnDestroy() {
    this.sub.unsubscribe();
  }

}
