import {Injectable} from '@angular/core';
import {ToolbarOptions} from './model/ToolbarOptions';
import {BehaviorSubject, Subject} from 'rxjs';

/**
 * N - not found
 * O - offline
 * L - loading
 * I - idle
 * E - error
 */
export type LoadingStatus = 'N' | 'O' | 'L' | 'I' | 'E';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  constructor() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.pwaInstallEvent.next(e);
    });

    window.addEventListener('online', () => this.networkStatus.next(true));
    window.addEventListener('offline', () => this.networkStatus.next(false));
  }

  public static get selectedTimetableId(): number | null | undefined {
    return +localStorage.getItem('selectedTimetableId');
  }

  public static set selectedTimetableId(v: number | null | undefined) {
    localStorage.setItem('selectedTimetableId', v.toString());
  }

  public static get shouldNotifyAboutTimetableChange(): boolean {
    const change = AppService.nextTimetableChange;
    const now = new Date().getTime();
    return change && change > now && change < (now + 7 * 24 * 60 * 60 * 1000);
  }

  public static get nextTimetableChange(): number | null {
    return +localStorage.getItem('nextTimetableChange');
  }

  public static set nextTimetableChange(v: number | null) {
    localStorage.setItem('nextTimetableChange', (v || 0).toString());
  }

  public static get cacheCurrentIdUntil(): number | null {
    return +localStorage.getItem('cacheUntil');
  }

  public static set cacheCurrentIdUntil(v: number | null) {
    localStorage.setItem('cacheUntil', (v || 0).toString());
  }

  static get useNewMap(): boolean {
    return false
  }

  static set useNewMap(v: boolean) {
    localStorage.setItem('newMap', v ? '1' : '0');
  }

  static get mapLink(): string {
    return this.useNewMap ? 'https://mapa.zsll.ga' : 'http://mapa.tl.krakow.pl';
  }

  static get showBookmarkTip(): boolean {
    return localStorage.getItem('dbh') !== '1' && +localStorage.getItem('stvc') >= 3;
  }


  readonly pwaInstallEvent = new BehaviorSubject(undefined);
  readonly networkStatus = new Subject<boolean>();
  private defaultToolbar = new ToolbarOptions('Plan lekcji ZSŁ', null, false, []);
  private currentToolbar = new BehaviorSubject<ToolbarOptions>(this.defaultToolbar);
  private bookmarkedPlans: string[];

  public static notifyTimetableOpened(id: string) {
    if (localStorage.getItem('loti') === id) {
      const count = +localStorage.getItem('stvc') || 0;
      localStorage.setItem('stvc', (count + 1).toString());
    } else {
      localStorage.setItem('loti', id);
      localStorage.setItem('stvc', '1');
    }
  }

  getCurrentToolbar(): BehaviorSubject<ToolbarOptions> {
    return this.currentToolbar;
  }

  setToolbar(newOne: ToolbarOptions) {
    this.currentToolbar.next(newOne || this.defaultToolbar);
  }

  removeToolbar() {
    this.currentToolbar.next(this.defaultToolbar);
  }

  getBookmarkedPlans() {
    if (!this.bookmarkedPlans) {
      this.bookmarkedPlans = !!localStorage ? JSON.parse(localStorage.getItem('bookmarkedPlans') || '[]') : [];
    }
    return this.bookmarkedPlans;
  }

  setBookmarkedPlans(plans: string[]) {
    localStorage.setItem('dbh', '1');
    this.bookmarkedPlans = plans;
    if (!!localStorage)
      setTimeout(() =>
        localStorage.setItem('bookmarkedPlans', JSON.stringify(plans)), 100);
  }

  toggleBookmarkedPlan(name: string) {
    const tmp = this.getBookmarkedPlans();
    const index = tmp.indexOf(name);
    if (index < 0) {
      tmp.push(name);
    } else {
      tmp.splice(index, 1);
    }
    this.setBookmarkedPlans(tmp);

    return index < 0;
  }
}
