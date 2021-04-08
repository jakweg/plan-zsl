import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectTimetableComponent } from './select-timetable.component';

describe('SelectTimetableComponent', () => {
  let component: SelectTimetableComponent;
  let fixture: ComponentFixture<SelectTimetableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SelectTimetableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectTimetableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
