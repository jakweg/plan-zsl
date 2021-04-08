import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TimetablesListComponent } from './timetables-list.component';

describe('TimetablesListComponent', () => {
  let component: TimetablesListComponent;
  let fixture: ComponentFixture<TimetablesListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TimetablesListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TimetablesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
