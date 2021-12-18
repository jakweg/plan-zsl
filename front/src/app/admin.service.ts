import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {ApiService} from './api.service';
import {SERVER_SETTING, ServerSettings} from './model/server-settings';

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  public readonly signedStatus = new BehaviorSubject(false);
  public readonly isAuthorizing = new BehaviorSubject(false);

  constructor(private api: ApiService) {
    this.checkStatus();
  }


  uploadTimetable(name, isValidFrom, file): Promise<any> {
    const form = new FormData();
    form.append('file', file, file.name);
    form.append('name', name);
    form.append('isValidFrom', isValidFrom);
    return this.post(['new-timetable'], form);
  }

  checkStatus() {
    if (this.isAuthorizing.value) return;
    this.isAuthorizing.next(true);


    this.get(['status'])
      .then(r => {
        this.signedStatus.next(r.signedIn);
        this.isAuthorizing.next(false);
      }).catch(() => {
      this.signedStatus.next(false);
      this.isAuthorizing.next(false);
    });
  }

  authorize(login: string, password: string) {
    if (this.isAuthorizing.value) return;
    this.isAuthorizing.next(true);

    this.post(['authorize'], {login, password})
      .then(() => {
        if (localStorage) localStorage.setItem('wasAdm', '1');
        this.signedStatus.next(true);
        this.isAuthorizing.next(false);
      }).catch(() => {
      this.signedStatus.next(false);
      this.isAuthorizing.next(false);
    });
  }

  logout() {
    if (this.isAuthorizing.value) return;
    this.isAuthorizing.next(true);
    this.signedStatus.next(false);


    this.get(['logout'])
      .then(() => this.isAuthorizing.next(false))
      .catch(() => this.isAuthorizing.next(false));
  }

  getTimetableInfo(id: number): Promise<any> {
    return this.get(['timetable-info', id.toString()]);
  }

  setTimetableInfo(id: number, token: string, name: string, date: number): Promise<any> {
    return this.post(['update-timetable-info', id.toString()], {token, name, date});
  }

  selectTimetable(id: number): Promise<any> {
    return this.get(['select-timetable', id.toString()]);
  }

  deleteTimetable(id: number, token: string): Promise<any> {
    return this.post(['delete-timetable', id.toString()], {token});
  }

  getServerSettings(): Promise<ServerSettings> {
    return this.get(['server-settings']);
  }

  getMyIpAddress(): Promise<string[]> {
    return this.get(['my-ip']);
  }

  setServerSetting(token: string, name: SERVER_SETTING, value: any): Promise<any> {
    return this.post(['set-server-setting'],
      {token, key: name, value});
  }

  getTimetables(): Promise<any[]> {
    return this.get(['list-timetables']);
  }

  private get(url: string[]): Promise<any> {
    return this.api.getP(['admin', ...url]);
  }

  private post(url: string[], data: any): Promise<any> {
    return this.api.postP(['admin', ...url], data);
  }

}
