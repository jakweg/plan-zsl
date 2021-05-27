import {Component, OnInit} from '@angular/core';
import {AdminService} from '../admin.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-new-timetable',
  templateUrl: './new-timetable.component.html',
  styleUrls: ['./new-timetable.component.css']
})
export class NewTimetableComponent implements OnInit {

  working: boolean;
  error: string;

  constructor(private service: AdminService, private router: Router) {
  }

  private static getInputValue(e: any, name: string, p: string = 'value'): any {
    return e.querySelector('[name=' + name + ']')[p];
  }

  ngOnInit() {
  }

  submit(e) {
    if (this.working) return;
    e.stopPropagation();
    e.preventDefault();
    e = e.target;

    const name = NewTimetableComponent.getInputValue(e, 'name');
    const isValidFrom = new Date(NewTimetableComponent.getInputValue(e, 'isValidFrom')).getTime() || 0;
    const file = NewTimetableComponent.getInputValue(e, 'file', 'files')[0];

    let error;

    if (name.length < 5 || name.length > 40)
      error = 'Podaj nazwę tego planu';
    else if (!isValidFrom)
      error = 'Podaj datę rozpoczęcia obowiązywania tego planu';
    else if (!file)
      error = 'Wybierz plik do przesłania';
    else if (!file.name.endsWith('.xml'))
      error = 'Wybrany plik powinien być plikiem z rozszerzeniem .xml';

    if (error)
      alert(error);
    else {
      this.working = true;
      (async () => {
        try {
          await this.service.uploadTimetable(name, isValidFrom, file);
          await this.router.navigate(['/admin', ]);
        } catch (e) {
          this.error = e.statusText;
        } finally {
          this.working = false;
        }
      })();
    }
  }
}
