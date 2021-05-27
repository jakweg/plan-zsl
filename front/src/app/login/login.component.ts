import {Component, OnDestroy, OnInit} from '@angular/core';
import {AdminService} from '../admin.service';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  constructor(private service: AdminService) {
  }

  private static getInputValue(e: any, name: string): string {
    return e.querySelector('[name=' + name + ']').value;
  }

  submit(event) {
    event.stopPropagation();
    event.preventDefault();
    const login =  LoginComponent.getInputValue(event.target, 'login');
    const password = LoginComponent.getInputValue(event.target, 'password');

    this.service.authorize(login, password);
  }

}
