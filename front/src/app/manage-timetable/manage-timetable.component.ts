import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {AdminService} from '../admin.service';

@Component({
  selector: 'app-manage-timetable',
  templateUrl: './manage-timetable.component.html',
  styleUrls: ['./manage-timetable.component.css']
})
export class ManageTimetableComponent implements OnInit {

  constructor(private route: ActivatedRoute,
              private service: AdminService) { }

  private thisId;
  info: any = {};
  error: any;
  editingName = false;
  editingDate = false;
  deleted = false;

  ngOnInit() {
    this.route.paramMap.subscribe(
      (params) => {
        this.thisId = params.get('id');
        this.refresh().then(() => {});
      });
  }

  deleteThisPlan() {
    (async () => {
      try {
        await this.service.deleteTimetable(this.thisId, this.info.token);
        this.deleted = true;
      } catch (e) {
        this.error = e;
      }
    })();
  }

  get isValidFrom() {
    return this.info.isValidFrom ? new Date(this.info.isValidFrom).toISOString().substr(0, 10) : null;
  }

  private async refresh() {
      try {
        this.info = await this.service.getTimetableInfo(+this.thisId);
        this.editingName = false;
        this.editingDate = false;
      } catch (e) {
        this.error = e;
      }
  }

  save() {
    (async () => {
      try {
        // @ts-ignore
        const name = this.editingName ? document.getElementById('name').value : null;

        // @ts-ignore
        const date = this.editingDate ? new Date(document.getElementById('date').value).getTime() : 0;

        await this.service.setTimetableInfo(this.info.id, this.info.token, name, date);
        await this.refresh();
      } catch (e) {
        this.error = e;
      }
    })();
  }

}
