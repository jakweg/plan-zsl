import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {AdminComponent} from './admin.component';
import {AdminService} from '../admin.service';
import {TimetablesListComponent} from '../timetables-list/timetables-list.component';
import {NewTimetableComponent} from '../new-timetable/new-timetable.component';
import {ManageTimetableComponent} from '../manage-timetable/manage-timetable.component';

const routes: Routes = [
  {
    path: '', component: AdminComponent,
    children: [
      {path: '', component: TimetablesListComponent},
      {path: 'nowy-plan', component: NewTimetableComponent},
      {path: 'plany/:id', component: ManageTimetableComponent},
    ],
  },
];

@NgModule({
  providers: [AdminService],
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule {
}
