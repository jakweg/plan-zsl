
export type SERVER_SETTING = 'auto-rotation' | 'use-ip-filter' | 'whitelisted-ips' | 'timetable-info-cache-duration';

export class ServerSettings {
  public token: string;
  public rotationEnabled: boolean;
  public timetableCacheDuration: number;
  public useIpFilter: boolean;
  public whitelistedIps: string[];
}
