export class Class {
    constructor(public id: string,
        public name: string,
        public short: string,
        public teacherId: string,
        public classroomId: string) { }

    static fromXml(xml: any): Class {
        if (xml.classroomids.includes(','))
            throw new Error('More then one classroom per class is not supported')
        return new Class(xml.id, xml.name, xml.short, xml.teacherid, xml.classroomids)
    }
}