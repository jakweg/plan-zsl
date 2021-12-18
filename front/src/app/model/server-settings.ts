
export type SERVER_SETTING = 'auto-rotation' | 'timetable-info-cache-duration';

export class ServerSettings {
  public token: string;
  public rotationEnabled: boolean;
  public timetableCacheDuration: number;
}
