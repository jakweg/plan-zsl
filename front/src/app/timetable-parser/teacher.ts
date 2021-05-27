export class Teacher {
    constructor(public id: string,
        public firstName: string,
        public lastName: string,
        public name: string,
        public short: string,
        public gender: string,
        public color: string) { }

    static fromXml(xml: Element): Teacher {
        const data = [
            xml.getAttribute('id'),
            xml.getAttribute('firstname'),
            xml.getAttribute('lastname'),
            xml.getAttribute('name'),
            xml.getAttribute('short'),
            xml.getAttribute('gender'),
            xml.getAttribute('color'),
        ]
        // @ts-ignore
        return new Teacher(...data);
    }
}
