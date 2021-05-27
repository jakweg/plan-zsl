import { Observable } from 'rxjs';
import { AppService } from './app.service';
import { TimetableModel } from './model/timetable';
import { TimetableInfo } from './model/timetable-info';

export type DownloadFunction = (url: string[]) => Observable<any>;
type DatabaseCallback = (db: IDBDatabase) => Promise<any>;
type PromiseProducer = () => Promise<any>;
const CACHE_DURATION_MILLIS = 2 * 24 * 60 * 60 * 1000 // two days
// const CACHE_DURATION_MILLIS = 60 * 1000; // one minute

export interface TimetableStore {
    /** Forces refreshing information, even if it should be fresh, other methods may call this method as well */
    forceRefreshData(): Promise<any>

    /** Gets list of timetables - objects containing ID, name and starting date */
    getAvailableTimetablesList(): Promise<TimetableInfo[]>;

    /** Gets number that indicates ID of the timetable that is active now, will take into consideration all timetables, but ignores user preference */
    getCurrentTimetableId(): Promise<number>;

    /** Returns information about specific timetable such as list of classes plans, classrooms plans etc */
    getTimetableSummary(timetableId: number): Promise<any>;

    /** Returns information about specific plan inside specific timetable */
    getPlan(timetableId: number, name: string): Promise<TimetableModel>;
}


export class IndexedDBStore implements TimetableStore {
    private currentAppStatus: any = null;
    private toDoOnReady: ((IDBDatabase) => void)[] = [];
    private database: IDBDatabase;
    private isDbReady = false;

    constructor(private readonly httpDownloader: DownloadFunction) {
        if (!window.indexedDB) throw new Error();

        const dbRequest = indexedDB.open('main-v1', 1);

        dbRequest.onupgradeneeded = () => {
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
            console.error('Unable to open database!');

            this.isDbReady = true;

            for (const todo of this.toDoOnReady) {
                todo(this.database);
            }
            this.toDoOnReady.splice(0, this.toDoOnReady.length);
        };

        const appStatus = JSON.parse(localStorage.getItem('app-status') || '{}');
        if (!appStatus.timetables)
            appStatus.timetables = [];
        this.currentAppStatus = appStatus;
    }

    forceRefreshData(): Promise<any> {
        return this.doWhenOnDbReady(async () => {
            const status = await this.httpDownloader(['app-status.json']).toPromise() || {};
            if (!status.timetables)
                status.timetables = [];
            if (status.lastModified !== (localStorage.getItem('app-status-last-modification') || 0)) {
                localStorage.setItem('app-status-last-modification', `${status.lastModified}`);
                localStorage.setItem('app-status', JSON.stringify(status));
                this.currentAppStatus = status;
                AppService.cacheCurrentIdUntil = Date.now() + CACHE_DURATION_MILLIS;


                const now = Date.now();
                let latestThatIsBeforeNow = null;
                let next = null;
                for (const t of this.currentAppStatus.timetables) {
                    if (t.isValidFrom < now) {
                        if (!latestThatIsBeforeNow || latestThatIsBeforeNow.isValidFrom < t.isValidFrom) {
                            latestThatIsBeforeNow = t;
                        }
                    }

                    if (t.isValidFrom > now && (!next || t.isValidFrom < next.isValidFrom)) {
                        next = t;
                    }
                }

                if (next && next.id !== latestThatIsBeforeNow.id) {
                    AppService.nextTimetableChange = next.isValidFrom;
                } else {
                    AppService.nextTimetableChange = 0;
                }

                if (latestThatIsBeforeNow)
                    AppService.currentTimetableId = latestThatIsBeforeNow.id;
                else if (this.currentAppStatus.timetables.length)
                    AppService.currentTimetableId = this.currentAppStatus.timetables[0].id;
                else
                    AppService.currentTimetableId = 0;
            }
        });
    }

    getAvailableTimetablesList(): Promise<TimetableInfo[]> {
        return this.doWhenOnDbReady(async () => {
            return this.currentAppStatus.timetables;
        });
    }

    getCurrentTimetableId(): Promise<number> {
        return this.doWhenOnDbReady(async () => {
            return AppService.currentTimetableId;
        });
    }

    getPlan(timetableId: number, name: string): Promise<TimetableModel> {
        return this.simpleCacheableQuery('plans', `${+timetableId}_${name}`,
            () => this.httpDownloader(['timetables', `${timetableId}`, name + '.json']).toPromise());
    }

    getTimetableSummary(timetableId: number) {
        return this.simpleCacheableQuery('descriptions', `${+timetableId}`,
            () => this.httpDownloader(['timetables', `${timetableId}`, 'summary.json']).toPromise());
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

//
// abstract class NoCacheStore implements TimetableStore {
//   constructor(protected httpDownloader: DownloadFunction) {
//   }
//
//   getAvailableTimetablesList(): Promise<TimetableInfo[]> {
//     return this.httpGet2Promise(['timetable', 'list']);
//   }
//
//   getTimetableSummary(timetableId: number): Promise<any> {
//     return this.httpGet2Promise(['timetable', (+timetableId).toString(), 'list']);
//   }
//
//   getPlan(timetableId: number, name: string): Promise<TimetableModel> {
//     return this.httpGet2Promise(['timetable', (+timetableId).toString(), 'get', name]);
//   }
//
//   async getCurrentTimetableId(): Promise<number> {
//     const id = AppService.selectedTimetableId;
//     return id || await this.getAutoTimetable();
//   }
//
//   selectTimetable(id: number) {
//     AppService.selectedTimetableId = id;
//   }
//
//   private httpGet2Promise(url: string[]): Promise<any> {
//     return new Promise((resolve, reject) => {
//       this.httpDownloader(url)
//         .subscribe(v => resolve(v), e => reject(e));
//     });
//   }
//
//   private async getAutoTimetable(): Promise<number> {
//     const cacheCurrentIdUntil = new Date(AppService.cacheCurrentIdUntil);
//     if (!cacheCurrentIdUntil || cacheCurrentIdUntil < new Date()) {
//       try {
//         const response = await this.httpGet2Promise(['timetable', 'status']);
//
//         AppService.cacheCurrentIdUntil = response.cacheCurrentUntil;
//         AppService.nextTimetableChange = response.nextChange;
//         AppService.currentTimetableId = response.currentTimetableId;
//         AppService.useNewMap = !!response.useNewMap;
//
//       } catch (e) {
//         // Unable to connect to server, then check if we have cache
//         if (!AppService.currentTimetableId) {
//           throw e;
//         }
//       }
//     }
//
//     return +AppService.currentTimetableId;
//   }
// }

