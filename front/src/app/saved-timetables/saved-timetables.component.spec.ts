import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SavedTimetablesComponent } from './saved-timetables.component';

describe('SavedTimetablesComponent', () => {
  let component: SavedTimetablesComponent;
  let fixture: ComponentFixture<SavedTimetablesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SavedTimetablesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SavedTimetablesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
