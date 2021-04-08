import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing.module';
import { AdminComponent } from './admin.component';
import { LoginComponent } from '../login/login.component';
import {AdminService} from '../admin.service';
import {FormsModule} from '@angular/forms';
import { TimetablesListComponent } from '../timetables-list/timetables-list.component';
import { NewTimetableComponent } from '../new-timetable/new-timetable.component';
import { ManageTimetableComponent } from '../manage-timetable/manage-timetable.component';
import { AdminSettingsComponent } from '../admin-settings/admin-settings.component';


@NgModule({
  providers: [AdminService],
  declarations: [AdminComponent, LoginComponent, TimetablesListComponent, NewTimetableComponent, ManageTimetableComponent, AdminSettingsComponent],
  imports: [
    CommonModule,
    AdminRoutingModule,
    FormsModule
  ]
})
export class AdminModule { }
