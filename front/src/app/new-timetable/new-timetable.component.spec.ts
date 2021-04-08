import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewTimetableComponent } from './new-timetable.component';

describe('NewTimetableComponent', () => {
  let component: NewTimetableComponent;
  let fixture: ComponentFixture<NewTimetableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NewTimetableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewTimetableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
