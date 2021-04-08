import { Component } from '@angular/core';
import { AppService } from './app.service';
import { ToolbarOptions, ToolbarButton } from './model/ToolbarOptions';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  constructor(
    private router: Router,
    private location: Location,
    private app: AppService, ) { }

  currentToolbar: ToolbarOptions;

  back() {
    if (window.history.length > 1) {
      this.location.back()
    } else {
      this.router.navigate(['/'])
    }
  }

  ngOnInit() {
    this.app.getCurrentToolbar().subscribe(t => requestAnimationFrame(() => {
      this.currentToolbar = t;

      if (!!document)
        document.title = t.longTitle || t.title;
    }));

    if (!!navigator && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/offline-sw.js')
        .then(function () { console.log("Offline Service Worker Registered"); });
    }
  }
}
