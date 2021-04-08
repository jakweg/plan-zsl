export class Group {
    public groupNumber: number;

    constructor(public id: string,
        public name: string,
        public classId: string,
        public entireClass: boolean,
        public divisionTag: number,
        public studentCount: number) {
        this.groupNumber = entireClass ? 0 : +name.replace(/\D/g, '');
    }

    static fromXml(xml: any): Group {
        return new Group(xml.id, xml.name.trim(), xml.classid,
            xml.entireclass !== '0',
            parseInt(xml.divisiontag),
            parseInt(xml.studentcount))
    }
}
