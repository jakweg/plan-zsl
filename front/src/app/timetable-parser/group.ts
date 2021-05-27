export class Group {
    public groupNumber: number;

    constructor(public id: string,
        public name: string,
        public classId: string,
        public entireClass: boolean,
        public divisionTag: number,) {
        this.groupNumber = entireClass ? 0 : +name.replace(/\D/g, '');
    }

    static fromXml(xml: Element): Group {
        const data = [
            xml.getAttribute('id'),
            xml.getAttribute('name'),
            xml.getAttribute('classid'),
            xml.getAttribute('entireclass'),
            xml.getAttribute('divisiontag'),
        ]

        return new Group(data[0], data[1].trim(), data[2],
            data[3] !== '0',
            parseInt(data[4]),)
    }
}
