import {Component, OnInit} from '@angular/core';
import {AppService} from '../app.service';
import {ApiService} from '../api.service';
import {ToolbarOptions} from '../model/ToolbarOptions';
// @ts-ignore
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';


@Component({
  selector: 'app-saved-timetables',
  templateUrl: './saved-timetables.component.html',
  styleUrls: ['./saved-timetables.component.css']
})
export class SavedTimetablesComponent implements OnInit {

  error;
  bookmarks: any[];
  fillBookmark = false;

  constructor(private app: AppService, private api: ApiService) {
  }

  ngOnInit() {
    this.app.setToolbar(
      new ToolbarOptions('Zapisane plany lekcji', null,
        true, []));

    (async () => {
      try {
        const entries = await this.api.getTimetablesSummary();
        const bookmarks = this.app.getBookmarkedPlans();

        this.bookmarks = bookmarks.map(e => {
          let n = entries.teachers[e];
          if (!n)
            n = entries.classrooms[e];
          return [e, n];
        });
      } catch (e) {
        this.error = e;
      }
    })();
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.bookmarks, event.previousIndex, event.currentIndex);
    this.app.setBookmarkedPlans(this.bookmarks.map(e => e[0]));
  }

  bookmarkClicked() {

  }
}
