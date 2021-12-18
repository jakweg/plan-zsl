import {Observable} from 'rxjs';
import {TimetableInfo} from './model/timetable-info';
import {TimetableModel} from './model/timetable';
import {AppService} from './app.service';

export type DownloadFunction = (url: string[]) => Observable<any>;
type DatabaseCallback = (db: IDBDatabase) => Promise<any>;
type PromiseProducer = () => Promise<any>;

export interface TimetableStore {
  getAvailableTimetablesList(): Promise<TimetableInfo[]>;

  getCurrentTimetableId(): Promise<number>;

  selectTimetable(id: number): void;

  getTimetableSummary(timetableId: number): Promise<any>;

  getPlan(timetableId: number, name: string): Promise<TimetableModel>;
}

export class NoCacheStore implements TimetableStore {
  constructor(protected httpDownloader: DownloadFunction) {
  }

  getAvailableTimetablesList(): Promise<TimetableInfo[]> {
    return this.httpGet2Promise(['timetable', 'list']);
  }

  getTimetableSummary(timetableId: number): Promise<any> {
    return this.httpGet2Promise(['timetable', (+timetableId).toString(), 'list']);
  }

  getPlan(timetableId: number, name: string): Promise<TimetableModel> {
    return this.httpGet2Promise(['timetable', (+timetableId).toString(), 'get', name]);
  }

  async getCurrentTimetableId(): Promise<number> {
    const id = AppService.selectedTimetableId;
    return id || await this.getAutoTimetable();
  }

  selectTimetable(id: number) {
    AppService.selectedTimetableId = id;
  }

  private httpGet2Promise(url: string[]): Promise<any> {
    return new Promise((resolve, reject) => {
      this.httpDownloader(url)
        .subscribe(v => resolve(v), e => reject(e));
    });
  }

  private async getAutoTimetable(): Promise<number> {
    const cacheCurrentIdUntil = new Date(AppService.cacheCurrentIdUntil);
    if (!cacheCurrentIdUntil || cacheCurrentIdUntil < new Date()) {
      try {
        const response = await this.httpGet2Promise(['timetable', 'status']);

        AppService.cacheCurrentIdUntil = response.cacheCurrentUntil;
        AppService.nextTimetableChange = response.nextChange;
        AppService.currentTimetableId = response.currentTimetableId;

      } catch (e) {
        // Unable to connect to server, then check if we have cache
        if (!AppService.currentTimetableId) {
          throw e;
        }
      }
    }

    return +AppService.currentTimetableId;
  }
}

export class IndexedDBStore extends NoCacheStore {
  private toDoOnReady: ((IDBDatabase) => void)[] = [];
  private database: IDBDatabase;
  private isDbReady = false;

  constructor(httpDownloader: DownloadFunction) {
    super(httpDownloader);
    if (!window.indexedDB) throw new Error();

    const dbRequest = indexedDB.open('main-v1', 1);

    dbRequest.onupgradeneeded = () => {
      dbRequest.result.createObjectStore('timetables', {keyPath: 'id'});
      dbRequest.result.createObjectStore('descriptions');
      dbRequest.result.createObjectStore('plans');
    };

    dbRequest.onsuccess = () => {
      this.isDbReady = true;
      this.database = dbRequest.result;
      for (const todo of this.toDoOnReady) {
        todo(this.database);
      }
      this.toDoOnReady.splice(0, this.toDoOnReady.length);
    };
    dbRequest.onerror = () => {
      console.error('Unable to open database! Fallback to NoCacheStore...');

      this.isDbReady = true;

      for (const todo of this.toDoOnReady) {
        todo(this.database);
      }
      this.toDoOnReady.splice(0, this.toDoOnReady.length);
    };
  }

  getAvailableTimetablesList(): Promise<TimetableInfo[]> {
    return this.doWhenOnDbReady(db => new Promise((done, err) => {
      if (!this.database) return super.getAvailableTimetablesList().then(done, err).catch(err);

      super.getAvailableTimetablesList()
        .then(result => {
          const tx = db.transaction('timetables', 'readwrite');
          tx.onerror = e => err(e);
          const store = tx.objectStore('timetables');
          for (const e of result) {
            store.put(e);
          }

          done(result);
        }).catch(() => {
        // we are offline?
        const req = db.transaction('timetables', 'readonly')
          .objectStore('timetables').getAll();
        req.transaction.oncomplete = () => done(req.result);
        req.transaction.onerror = e => err(e);
      });
    }));
  }

  getPlan(timetableId: number, name: string): Promise<TimetableModel> {
    return this.simpleCacheableQuery('plans', `${+timetableId}_${name}`, () => super.getPlan(timetableId, name));
  }

  getTimetableSummary(timetableId: number) {
    return this.simpleCacheableQuery('descriptions', +timetableId, () => super.getTimetableSummary(timetableId));
  }

  private doWhenOnDbReady(callback: DatabaseCallback): Promise<any> {
    if (this.isDbReady) {
      return callback(this.database);
    }

    return new Promise((resolve, reject) => {
      this.toDoOnReady.push((db: IDBDatabase) => {
        callback(db)
          .then(v => resolve(v))
          .catch(e => reject(e));
      });
    });
  }

  private simpleCacheableQuery(tableName: string,
                               entryId: string | number,
                               networkGetter: PromiseProducer)
    : Promise<any> {
    return this.doWhenOnDbReady(db => new Promise((done, err) => {
      if (!db) return networkGetter().then(done, err).catch(err);

      const req = db
        .transaction(tableName, 'readonly')
        .objectStore(tableName)
        .get(entryId);

      req.transaction.oncomplete = () => {
        if (req.result) {
          done(req.result);
        } else {
          // entity not found :/
          networkGetter()
            .then(result => {
              const tx = db.transaction(tableName, 'readwrite');
              tx.onerror = e => err(e);
              const store = tx.objectStore(tableName);
              store.put(result, entryId);

              done(result);
            })
            .catch(e => err(e));
        }
      };
      req.transaction.onerror = e => err(e);
    }));
  }


}
