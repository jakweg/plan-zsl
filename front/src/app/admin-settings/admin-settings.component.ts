import {Component, OnInit} from '@angular/core';
import {AdminService} from '../admin.service';
import {SERVER_SETTING, ServerSettings} from '../model/server-settings';

@Component({
  selector: 'app-admin-settings',
  templateUrl: './admin-settings.component.html',
  styleUrls: ['./admin-settings.component.css']
})
export class AdminSettingsComponent implements OnInit {

  cacheDurations = [
    [0, 'wyłączone'],
    [10, 'dziesięć sekund'],
    [60, 'jedna minuta'],
    [60 * 60, 'jedna godzina'],
    [4 * 60 * 60, 'cztery godziny'],
    [12 * 60 * 60, 'dwanaście godzin'],
    [24 * 60 * 60, 'jeden dzień'],
    [2 * 24 * 60 * 60, 'dwa dni'],
    [7 * 24 * 60 * 60, 'jeden tydzień'],
    [2 * 7 * 24 * 60 * 60, 'dwa tygodnie'],
  ];
  currentSettings: ServerSettings;
  error;

  constructor(private admin: AdminService) {
  }

  ngOnInit() {
    this.refreshSettings();
  }

  setProperty(key: SERVER_SETTING, value: string) {
    (async () => {
      try {
        await this.admin.setServerSetting(this.currentSettings.token, key, value);
        this.refreshSettings();
      } catch (e) {
        this.error = e;
      }
    })();
  }

  private refreshSettings() {
    this.currentSettings = null;
    this.admin.getServerSettings()
      .then(r => this.currentSettings = r,
        e => this.error = e);
  }

}
