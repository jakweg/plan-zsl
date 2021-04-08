import {Component, OnInit} from '@angular/core';
import {AppService} from '../app.service';
import {ApiService} from '../api.service';
import {ToolbarOptions} from '../model/ToolbarOptions';
import {TimetableInfo} from '../model/timetable-info';

@Component({
  selector: 'app-select-timetable',
  templateUrl: './select-timetable.component.html',
  styleUrls: ['./select-timetable.component.css']
})
export class SelectTimetableComponent implements OnInit {

  selectedByUser: number = AppService.selectedTimetableId;
  currentNewest: number = +AppService.currentTimetableId;
  timetables: TimetableInfo[];
  error: any;

  constructor(
    private app: AppService,
    private api: ApiService) {
  }

  ngOnInit() {
    this.app.setToolbar(new ToolbarOptions('Wybór planu', null, true, []));
    this.api.pingCurrentIfNeeded();
    this.api.getAvailableTimetables()
      .then(timetables => {
        timetables.sort((a, b) => b.isValidFrom - a.isValidFrom);
        for (const t of timetables) {
        }
        this.timetables = timetables;
      })
      .catch(e => this.error = e);
  }

  autoClicked() {
    if (this.selectedByUser === 0) {
      this.selectedByUser = this.currentNewest;
      AppService.selectedTimetableId = this.currentNewest;
    } else {
      this.selectedByUser = 0;
      AppService.selectedTimetableId = 0;
    }
  }

  selectedById(id: number) {
    this.selectedByUser = id;
    AppService.selectedTimetableId = id;
  }
}
