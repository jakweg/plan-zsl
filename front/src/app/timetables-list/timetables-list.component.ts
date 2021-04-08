import {Component, OnInit} from '@angular/core';
import {AdminService} from '../admin.service';
import {log} from 'util';
import {TimetableInfo} from '../model/timetable-info';

@Component({
  selector: 'app-timetables-list',
  templateUrl: './timetables-list.component.html',
  styleUrls: ['./timetables-list.component.css']
})
export class TimetablesListComponent implements OnInit {

  constructor(private service: AdminService) {
  }

  error: any;
  timetables: TimetableInfo[];

  ngOnInit() {
    this.service.getTimetables()
      .then(r => this.timetables = r)
      .catch(e => this.error = e);
  }

}
