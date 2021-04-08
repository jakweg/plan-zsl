export class Lesson {
    constructor(public id: string,
        public classIds: string[],
        public subjectId: string,
        public teacherId: string,
        public classroomIds: string[],
        public groupIds: string[],
        public daysDefId: string) { }

    static fromXml(xml: any): Lesson {
        if (xml.teacherids.includes(','))
            throw new Error('Class::fromXml: More then one `teacher` per `lesson` is not supported')
        return new Lesson(
            xml.id,
            xml.classids.split(','),
            xml.subjectid,
            xml.teacherids,
            xml.classroomids.split(','),
            xml.groupids.split(','),
            xml.daysdefid
        )
    }
}