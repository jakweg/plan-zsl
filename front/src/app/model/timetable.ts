export class LessonModel {
  constructor(
    public teacherShort: string,
    public classShort: string,
    public groupName: string,
    public entireClass: boolean) {
  }
}

export interface PeriodModel {
  num: number;
  start: string;
  end: string;
}


export class TimetableModel {
  constructor(public id: string,
              public type: string,
              public fullName: string,
              public teacherName: string,
              public periods: PeriodModel[],
              public monday: LessonModel[],
              public tuesday: LessonModel[],
              public wednesday: LessonModel[],
              public thursday: LessonModel[],
              public friday: LessonModel[],
  ) {
  }
}
