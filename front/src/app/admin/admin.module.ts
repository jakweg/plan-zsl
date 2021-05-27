import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularFireModule } from '@angular/fire'
import { AngularFireAuth, AngularFireAuthModule } from '@angular/fire/auth'
import { AngularFireStorageModule } from '@angular/fire/storage'

import { AdminRoutingModule } from './admin-routing.module';
import { AdminComponent } from './admin.component';
import { LoginComponent } from '../login/login.component';
import {AdminService} from '../admin.service';
import {FormsModule} from '@angular/forms';
import { TimetablesListComponent } from '../timetables-list/timetables-list.component';
import { NewTimetableComponent } from '../new-timetable/new-timetable.component';
import { ManageTimetableComponent } from '../manage-timetable/manage-timetable.component';


@NgModule({
  providers: [AdminService],
  declarations: [AdminComponent, LoginComponent, TimetablesListComponent, NewTimetableComponent, ManageTimetableComponent],
  imports: [
    CommonModule,
    AdminRoutingModule,
    FormsModule,
      AngularFireModule.initializeApp({
        apiKey: "AIzaSyD8-GioIuMuGPX-EJBzI75oa8SE39BW6Ts",
        authDomain: "zsl-plan.firebaseapp.com",
        projectId: "zsl-plan",
        storageBucket: "zsl-plan.appspot.com",
        appId: "1:852178860337:web:3bbd2af6b6850cbee61810"
      }),
      AngularFireAuthModule,
      AngularFireStorageModule
  ]
})
export class AdminModule { }
