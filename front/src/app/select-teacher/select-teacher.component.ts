import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {AppService, LoadingStatus} from '../app.service';
import {ApiService} from '../api.service';
import {ToolbarOptions} from '../model/ToolbarOptions';
import {ActivatedRoute, Router} from '@angular/router';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-select-teacher',
  templateUrl: './select-teacher.component.html',
  styleUrls: ['./select-teacher.component.css']
})
export class SelectTeacherComponent implements OnInit, OnDestroy {

  @ViewChild('inputElement', {static: true}) inputElement: ElementRef;
  allEntities: any[];
  status: LoadingStatus = 'I';
  searchType;
  private toolbar = new ToolbarOptions(
    'Wybór planu', null, true, []);
  private sub: Subscription;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private app: AppService,
    private api: ApiService) {
  }

  private static transformToSearchable(v: string) {
    return v.toLocaleLowerCase()
      .replace('ę', 'e')
      .replace('ó', 'o')
      .replace('ą', 'a')
      .replace('ś', 's')
      .replace('ł', 'l')
      .replace('ż', 'z')
      .replace('ź', 'z')
      .replace('ć', 'c')
      .replace('ń', 'n');
  }

  ngOnInit() {
    this.app.setToolbar(this.toolbar);
    this.status = 'L';
    this.sub = this.route.data.subscribe(d => {
      this.searchType = d.searchHint;
      this.api.getTimetablesSummary().then(
        (result) => {
          this.allEntities = [];
          result = result[d.type];
          for (const key in result) {
            if (result.hasOwnProperty(key)) {
              const val = result[key];
              this.allEntities.push([key, val, SelectTeacherComponent.transformToSearchable(val), true]);
            }
          }

          this.allEntities.sort((t1, t2) => t1[2] > t2[2] ? 1 : -1);
          this.status = 'O';
        }
      ).catch(() => this.status = 'E');
      this.toolbar.title = 'Wybór ' + d.name;
    });

    setTimeout(() => {
      this.inputElement.nativeElement.focus();
    }, 100);
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  onSearchPhraseChanged(el: any) {
    const value = SelectTeacherComponent.transformToSearchable(el.value.trim());
    if (!value) {
      for (const e of this.allEntities) {
        e[3] = true;
      }
    } else {
      for (const e of this.allEntities) {
        e[3] = (e[2] as string).includes(value);
      }
    }
  }

  enterPressed(event: KeyboardEvent) {
    if (event.key !== 'Enter') return;
    const first = this.allEntities.find(e => e[3]);
    if (!first) return;
    event.preventDefault();
    this.router.navigate(['/plan', first[0]]).then(() => {
    });
  }
}
