import { Component, OnInit } from '@angular/core';
import { AdminService } from '../admin.service';
import { SERVER_SETTING, ServerSettings } from '../model/server-settings';

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
  ipFilterLines: string;
  linesAreModified = false;
  error;

  constructor(private admin: AdminService) {
  }

  ngOnInit() {
    this.refreshSettings();
  }

  setProperty(key: SERVER_SETTING, value: string | string[]) {
    (async () => {
      try {
        await this.admin.setServerSetting(this.currentSettings.token, key, value);
        this.refreshSettings();
      } catch (e) {
        this.error = e;
      }
    })();
  }

  validateAndSendIpLines() {
    const lines = this
        .ipFilterLines
        .split('\n')
        .map(e => e.trim())
        .filter(e => e.length > 0);
    const mappedLines = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const position = line.indexOf('/');
      if (position < 0)
        return alert(`Brak znaku / w linii ${i + 1}`);

      const prefixLength = +line.substr(position + 1);
      if (isNaN(prefixLength) || prefixLength < 0 || prefixLength > 32)
        return alert(`Nieprawidłowa długość prefixu w linii ${i + 1}`);

      const numbers = line.substr(0, position).split('.').map(e => +e);
      if (numbers.length !== 4)
        return alert(`Nieprawidłowa ilość liczb w adresie w linii ${i + 1}`);

      if (!numbers.every(e => e >= 0 && e <= 255))
        return alert(`Nieprawidłowa wartość w adresie w linii ${i + 1}`);

      mappedLines.push(numbers.join('.') + '/' + prefixLength);
    }
    this.linesAreModified = false;
    this.setProperty('whitelisted-ips', mappedLines);
  }

  private refreshSettings() {
    this.currentSettings = null;
    this.admin.getServerSettings()
      .then(r => {
            this.currentSettings = r;
            if (!r.whitelistedIps)
              this.ipFilterLines = '';
            else
              this.ipFilterLines = r.whitelistedIps.join('\n');
            },
        e => this.error = e);
  }

}
