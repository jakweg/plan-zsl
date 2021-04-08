import {Component, OnDestroy, OnInit} from '@angular/core';
import {AppService, LoadingStatus} from '../app.service';
import {ApiService} from '../api.service';
import {ActivatedRoute} from '@angular/router';
import {ToolbarButton, ToolbarOptions} from '../model/ToolbarOptions';
import {TimetableModel} from '../model/timetable';
import {LessonDialogParams} from '../model/lesson-dialog-params';

@Component({
  selector: 'app-timetable',
  templateUrl: './timetable.component.html',
  styleUrls: ['./timetable.component.css']
})
export class TimetableComponent implements OnInit, OnDestroy {

  daysOfWeek = [
    ['monday', 'Poniedziałek'],
    ['tuesday', 'Wtorek'],
    ['wednesday', 'Środa'],
    ['thursday', 'Czwartek'],
    ['friday', 'Piątek'],
  ];
  timetable: TimetableModel;
  timetableShort: string;
  dialogParams: LessonDialogParams;
  cachedSummary: any;
  status: LoadingStatus = 'I';
  bookmarkedPlans: string[];
  finishedActivity: boolean;
  mapLink = AppService.mapLink;
  showBookmarkHint: boolean;

  private networkSubscription: any;
  private toolbar = new ToolbarOptions(
    'Plan lekcji', null, true,
    [new ToolbarButton(null, null, 'Zapisz do zakładek', () => this.onBookmarkClick())]
  );

  constructor(
    private app: AppService,
    private api: ApiService,
    private route: ActivatedRoute
  ) {
  }

  onBookmarkClick() {
    this.toolbar.buttons[this.toolbar.buttons.length - 1].icon = (this.app.toggleBookmarkedPlan(this.timetableShort)) ? 'bookmark-fill' : 'bookmark-empty';
  }

  ngOnInit() {
    // @ts-ignore
    if (navigator.share) {
      this.toolbar.buttons.unshift(new ToolbarButton(null, 'share', 'Udostępnij', async () => {
        // @ts-ignore
        await navigator.share({
          title: this.toolbar.title,
          text: this.toolbar.title,
          url: window.location.href
        });
      }));
    }

    this.bookmarkedPlans = this.app.getBookmarkedPlans();

    setTimeout(() => {
      if (this.finishedActivity) return;
      const container = document.getElementsByClassName('timetable-container')[0];
      if (!container) return;

      const date = new Date();
      const day = date.getDay() + (date.getHours() > 16 ? 1 : 0);
      // ignore monday, because we are at monday by default
      if (day >= 2 && day <= 5) {
        const el = document.getElementById('el_' + this.daysOfWeek[day - 1][0]);
        if (el)
          container.scrollTo(el.offsetLeft, container.scrollTop);
      }
    }, 500);

    this.route.paramMap.subscribe(
      (params) => {
        if (this.dialogParams)
          this.dialogParams.hide();
        this.timetableShort = params.get('name');

        this.toolbar.buttons[this.toolbar.buttons.length - 1].icon = this.bookmarkedPlans
          .includes(this.timetableShort) ? 'bookmark-fill' : 'bookmark-empty';
        this.app.setToolbar(this.toolbar);

        this.reloadTimetable();
      }
    );
  }

  ngOnDestroy(): void {
    if (this.networkSubscription)
      this.networkSubscription.unsubscribe();
    this.networkSubscription = null;
    this.finishedActivity = true;
  }

  reloadTimetable() {
    this.status = 'L';
    this.api.getTimetable(this.timetableShort).then(
      (t) => {
        this.showBookmarkHint = AppService.showBookmarkTip;
        if (this.finishedActivity) return;

        if (this.networkSubscription)
          this.networkSubscription.unsubscribe();
        this.networkSubscription = null;

        this.toolbar.title = 'Plan lekcji ' + t.fullName;
        this.app.setToolbar(this.toolbar);

        this.timetable = t;

        setTimeout(() => {
          this.status = null;
        }, 30);
      }
    ).catch((r) => {
      if (this.finishedActivity) return;
      this.timetable = null;
      this.status = r.status === 0 ? 'E' : 'N';

      if (!this.networkSubscription)
        this.networkSubscription = this.app.networkStatus.subscribe((online) => {
          if (online) this.reloadTimetable();
        });
    });
  }

  onGroupClicked(g: any) {
    if (!!this.cachedSummary) {
      this.showDialogForLesson(g);
    } else {
      this.api.getTimetablesSummary().then(
        result => {
          this.cachedSummary = result;
          this.showDialogForLesson(g);
        }
      );
    }
  }

  onCloseDialog() {
    if (this.dialogParams)
      this.dialogParams.hide();
  }

  private showDialogForLesson(group: any) {
    if (!this.cachedSummary) return;
    this.dialogParams = new LessonDialogParams(
      this.cachedSummary.subjects[group.subject],
      group.class,
      !!group.teacher ? [group.teacher, this.cachedSummary.teachers[group.teacher]] : null,
      !!group.classroom ? [group.classroom, this.cachedSummary.classrooms[group.classroom]] : null,
    );
    this.dialogParams.show();
  }

}
