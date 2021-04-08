import { Component, OnInit } from '@angular/core';
import { AppService, LoadingStatus } from '../app.service';
import { ApiService } from '../api.service';
import { ToolbarOptions } from '../model/ToolbarOptions';
import { Location } from '@angular/common';

@Component({
  selector: 'app-years-list',
  templateUrl: './years-list.component.html',
  styleUrls: ['./years-list.component.css']
})
export class YearsListComponent implements OnInit {

  constructor(
    private app: AppService,
    private api: ApiService) { }

  private toolbar = new ToolbarOptions(
    "Wybór rocznika", null, true, []);

  status: LoadingStatus = 'I'
  classes: any[];

  ngOnInit() {
    this.app.setToolbar(this.toolbar);

    this.status = 'L'
    this.api.getTimetablesSummary()
      .then(r => {
        this.status = 'O'
        this.classes = r.groupedClasses
      }).catch(() => this.status = 'E')
  }

}
