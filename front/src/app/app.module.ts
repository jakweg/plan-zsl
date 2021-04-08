import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {DragDropModule} from '@angular/cdk/drag-drop';

import {AppRoutingModule} from './app-routing.module';
import {HttpClientModule} from '@angular/common/http';
import {AppComponent} from './app.component';
import {MainPageComponent} from './main-page/main-page.component';
import {ClassesListComponent} from './classes-list/classes-list.component';
import {YearsListComponent} from './years-list/years-list.component';
import {TimetableComponent} from './timetable/timetable.component';
import {SelectTeacherComponent} from './select-teacher/select-teacher.component';
import {SelectTimetableComponent} from './select-timetable/select-timetable.component';
import {SavedTimetablesComponent} from './saved-timetables/saved-timetables.component';

@NgModule({
  declarations: [
    AppComponent,
    MainPageComponent,
    ClassesListComponent,
    YearsListComponent,
    TimetableComponent,
    SelectTeacherComponent,
    SelectTimetableComponent,
    SavedTimetablesComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    DragDropModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
