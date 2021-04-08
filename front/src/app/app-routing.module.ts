import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {MainPageComponent} from './main-page/main-page.component';
import {YearsListComponent} from './years-list/years-list.component';
import {ClassesListComponent} from './classes-list/classes-list.component';
import {TimetableComponent} from './timetable/timetable.component';
import {SelectTeacherComponent} from './select-teacher/select-teacher.component';
import {SelectTimetableComponent} from './select-timetable/select-timetable.component';
import {SavedTimetablesComponent} from './saved-timetables/saved-timetables.component';


const routes: Routes = [
  {path: '', component: MainPageComponent},
  {
    path: 'klasy', children: [
      {path: '', component: YearsListComponent},
      {path: ':year', component: ClassesListComponent}
    ],
  },
  {
    path: 'nauczyciele',
    component: SelectTeacherComponent,
    data: {type: 'teachers', name: 'nauczyciela', searchHint: 'Imię lub nazwisko nauczyciela'}
  },
  {
    path: 'sale', component: SelectTeacherComponent,
    data: {type: 'classrooms', name: 'sali lekcyjnej', searchHint: 'Nazwa sali lekcyjnej'}
  },
  {path: 'plan/:name', component: TimetableComponent},
  {path: 'zapisane-plany', component: SavedTimetablesComponent},

  {path: 'wybierz-plan', component: SelectTimetableComponent},

  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
