import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectTeacherComponent } from './select-teacher.component';

describe('SelectTeacherComponent', () => {
  let component: SelectTeacherComponent;
  let fixture: ComponentFixture<SelectTeacherComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SelectTeacherComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectTeacherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
