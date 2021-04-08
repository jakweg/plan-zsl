
export type SERVER_SETTING = 'use-new-map' | 'auto-rotation' | 'timetable-info-cache-duration';

export class ServerSettings {
  public token: string;
  public currentName: string;
  public currentId: number;
  public rotationEnabled: boolean;
  public useNewMap: boolean;
  public timetableCacheDuration: number;
}
