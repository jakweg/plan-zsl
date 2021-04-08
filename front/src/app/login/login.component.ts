import {Component, OnDestroy, OnInit} from '@angular/core';
import {AdminService} from '../admin.service';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {

  constructor(private service: AdminService) {
  }

  isAuthorizing: boolean;
  triedToSignIn: boolean;
  private subs: Subscription[] = [];

  private static getInputValue(e: any, name: string): string {
    return e.querySelector('[name=' + name + ']').value;
  }

  ngOnInit() {
    this.subs.push(this.service.isAuthorizing.subscribe(v => {
      this.isAuthorizing = v;
    }));
  }

  ngOnDestroy(): void {
    for (const s of this.subs) s.unsubscribe();
  }

  submit(event) {
    event.stopPropagation();
    event.preventDefault();
    const login =  LoginComponent.getInputValue(event.target, 'login');
    const password = LoginComponent.getInputValue(event.target, 'password');

    this.triedToSignIn = true;
    this.service.authorize(login, password);
  }

}
