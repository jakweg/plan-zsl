import {Injectable} from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFireStorage } from '@angular/fire/storage';
import { storage } from 'firebase';
import {BehaviorSubject} from 'rxjs';
import {ApiService} from './api.service';
import { AppService } from './app.service';
import { TimetableDatabase } from './timetable-parser/timetable-database';

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  public readonly appState = new BehaviorSubject<any>({});
  public readonly signedStatus = new BehaviorSubject(false);

  constructor(private api: ApiService,
              private auth: AngularFireAuth,
              private storage: AngularFireStorage) {
    this.refreshStatus().then(() => {
      auth.authState.subscribe(user => {
        this.signedStatus.next(!!user);
      });
    });
  }
  private async refreshStatus() {
    let state
    try {
      const url = await this.storage.ref('app-status.json').getDownloadURL().toPromise()
      const response = await fetch(url)
      state = await response.json()
    } catch (e) {
      console.error(e);
    }
    if (!state)
      state = {}
    this.appState.next(state)
    return state
  }


  uploadTimetable(name, isValidFrom, file): Promise<any> {
    return new Promise<any>((r, e) => {
    const reader = new FileReader();
      reader.addEventListener('load', async (event) => {
        try {
          const result: string = (event.target as any).result;
          const parser = new DOMParser();
          const dom = parser.parseFromString(result, 'application/xml');
          const database = TimetableDatabase.fromXml(dom.querySelector('timetable'))
          const timetables = database.generateJsonForEverything();
          const timetableId = Date.now()/10_000 | 0

          await Promise.all(Object.keys(timetables).map((key) => this.storage
              .ref(`timetables/${timetableId}/${key}.json`)
              .putString(JSON.stringify(timetables[key]))))

          await this.storage.ref(`timetables/${timetableId}.json`).putString(JSON.stringify(timetables))
          await this.refreshStatus()
          const appState = JSON.parse(JSON.stringify(this.appState.value))
          if (!appState.timetables)
            appState.timetables = [];

          (appState.timetables as any[]).push({name, isValidFrom, id: timetableId})

          appState.lastModified = Date.now()
          await this.storage.ref('app-status.json').putString(JSON.stringify(appState))
          await this.refreshStatus()
          r()
        } catch (er) {
          e(er)
        }
      });
    reader.readAsText(file, 'windows-1250');
    reader.addEventListener('error', e)
    })
  }

  authorize(login: string, password: string) {
    this.auth.auth.signInWithEmailAndPassword(login + '@zsl-plan.web.app', password)
        .then(() => {
          localStorage.setItem('wasAdm', '1');
        })
        .catch(e => console.error(e.message));
  }

  logout() {
    this.auth.auth.signOut().then();
  }

  async getTimetableInfo(id: number): Promise<any> {
    const state = await this.refreshStatus()
    if (state.timetables)
      return state.timetables.find(t => t.id === id)
    return null
  }

  async setTimetableInfo(id: number, token: string, name: string, date: number): Promise<any> {
    const appState = JSON.parse(JSON.stringify(await this.refreshStatus()))
    if (!appState.timetables) return;
    const timetable = (appState.timetables as any[]).find(t => t.id === +id);
    if (name)
      timetable.name = name
    if (+date > 0)
      timetable.isValidFrom = +date
    appState.lastModified = Date.now()

    await this.storage.ref('app-status.json').putString(JSON.stringify(appState))

    await this.refreshStatus()
  }

  async deleteTimetable(id: number, token: string): Promise<any> {
    const appState = JSON.parse(JSON.stringify(await this.refreshStatus()))
    if (!appState.timetables) return;
    const index = (appState.timetables as any[]).findIndex(t => t.id === +id);
    if (index < 0) return
    appState.timetables.splice(index, 1)

    appState.lastModified = Date.now()
    await this.storage.ref('app-status.json').putString(JSON.stringify(appState))

    await this.storage.ref(`timetables/${id}.json`).delete().toPromise()
    const files = await this.storage.storage.ref(`timetables/${id}`).listAll()
    await Promise.all(files.items.map(f => f.delete()))

    await this.refreshStatus()
  }

}
