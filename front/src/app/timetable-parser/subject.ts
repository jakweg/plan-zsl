export class Subject {
    constructor(public id: string,
        public name: string,
        public short: string) { }

    static fromXml(xml: Element): Subject {
        const data = [
            xml.getAttribute('id'),
            xml.getAttribute('name'),
            xml.getAttribute('short'),
        ]
        return new Subject(data[0], data[1], data[2])
    }
}
