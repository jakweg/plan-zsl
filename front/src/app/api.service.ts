import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {DownloadFunction, IndexedDBStore, TimetableStore} from './timetable-store';
import {TimetableInfo} from './model/timetable-info';
import {AppService} from './app.service';


@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private API_BASE_LINK = 'https://storage.googleapis.com/zsl-plan.appspot.com/';
  private httpOptions = {
    withCredentials: false,
    headers: new HttpHeaders({})
  };
  private readonly timetables: TimetableStore;

  constructor(private http: HttpClient) {
    const httpDownloader: DownloadFunction = (url) => this.get(url);
    this.timetables = new IndexedDBStore(httpDownloader)
  }

  async getTimetablesSummary(): Promise<any> {
    return this.timetables.getTimetableSummary(
        AppService.selectedTimetableId || await this.timetables.getCurrentTimetableId()
    );
  }

  async getTimetable(shortName: string): Promise<any> {
    AppService.notifyTimetableOpened(shortName);
    return this.timetables.getPlan(
        AppService.selectedTimetableId || await this.timetables.getCurrentTimetableId(),
        shortName.toLowerCase());
  }

  getAvailableTimetables(): Promise<TimetableInfo[]> {
    return this.timetables.getAvailableTimetablesList();
  }

  public get(url: string[]): Observable<any> {
    return this.http.get(`${this.API_BASE_LINK}${this.encodeUrl(url)}?${Date.now()}`, this.httpOptions);
  }

  pingCurrentIfNeeded() {
    if (AppService.cacheCurrentIdUntil < new Date().getTime() && navigator.onLine)
      this.timetables.forceRefreshData().then();
  }

  private encodeUrl(url: string[]) {
    return url.map(it => encodeURIComponent(it)).join('/');
  }
}
