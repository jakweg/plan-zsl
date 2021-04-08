import {Injectable, isDevMode} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {DownloadFunction, IndexedDBStore, NoCacheStore, TimetableStore} from './timetable-store';
import {TimetableInfo} from './model/timetable-info';
import {AppService} from './app.service';


@Injectable({
  providedIn: 'root'
})
export class ApiService {

  // private API_BASE_LINK = isDevMode() ? "http://localhost:6823/" : "/api/";
  private API_BASE_LINK = isDevMode() ? 'http://192.168.1.22:6823/' : '/api/';
  private httpOptions = {
    withCredentials: true,
    headers: new HttpHeaders({})
  };
  private readonly timetables: TimetableStore;

  constructor(private http: HttpClient) {
    const httpDownloader: DownloadFunction = (url) => this.get(url);
    this.timetables = !!window.indexedDB
      ? new IndexedDBStore(httpDownloader)
      : new NoCacheStore(httpDownloader);
  }

  async getTimetablesSummary(): Promise<any> {
    return this.timetables.getTimetableSummary(await this.timetables.getCurrentTimetableId());
  }

  async getTimetable(shortName: string): Promise<any> {
    AppService.notifyTimetableOpened(shortName);
    return this.timetables.getPlan(
      await this.timetables.getCurrentTimetableId(), shortName.toLowerCase());
  }

  getAvailableTimetables(): Promise<TimetableInfo[]> {
    return this.timetables.getAvailableTimetablesList();
  }

  public get(url: string[]): Observable<any> {
    return this.http.get(`${this.API_BASE_LINK}${this.encodeUrl(url)}`, this.httpOptions);
  }

  public getP(url: string[]): Promise<any> {
    return new Promise<any>((t, j) => this.get(url).subscribe(r => t(r), e => j(e)));
  }

  public post(url: string[], data: any): Observable<any> {
    return this.http.post(`${this.API_BASE_LINK}${this.encodeUrl(url)}`, data, this.httpOptions);
  }

  public postP(url: string[], data: any): Promise<any> {
    return new Promise<any>((t, j) => this.post(url, data).subscribe(r => t(r), e => j(e)));
  }

  pingCurrentIfNeeded() {
    if (AppService.cacheCurrentIdUntil < new Date().getTime() && navigator.onLine)
      this.timetables.getCurrentTimetableId().then(() => {
      });
  }

  private encodeUrl(url: string[]) {
    return url.map(it => encodeURIComponent(it)).join('/');
  }
}
