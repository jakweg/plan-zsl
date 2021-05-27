export class Lesson {
    constructor(public id: string,
        public classIds: string[],
        public subjectId: string,
        public teacherId: string,
        public classroomIds: string[],
        public groupIds: string[]) { }

    static fromXml(xml: any): Lesson {
        const data = [
            xml.getAttribute('id'),
            xml.getAttribute('classids'),
            xml.getAttribute('subjectid'),
            xml.getAttribute('teacherids'),
            xml.getAttribute('classroomids'),
            xml.getAttribute('groupids'),
        ]

        if (data[3].includes(','))
            throw new Error('Class::fromXml: More then one `teacher` per `lesson` is not supported')
        return new Lesson(
            data[0],
            data[1].split(','),
            data[2],
            data[3],
            data[4].split(','),
            data[5].split(','),
        )
    }
}
