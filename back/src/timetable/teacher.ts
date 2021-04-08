export class Teacher {
    constructor(public id: string,
        public firstName: string,
        public lastName: string,
        public name: string,
        public short: string,
        public gender: string,
        public color: string) { }

    static fromXml(xml: any): Teacher {
        return new Teacher(xml.id, xml.firstname, xml.lastname, xml.name, xml.short, xml.gender, xml.color);
    }
}