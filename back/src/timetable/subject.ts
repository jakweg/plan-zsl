export class Subject {
    constructor(public id: string,
        public name: string,
        public short: string) { }

    static fromXml(xml: any): Subject {
        return xml; // no name changes
    }
}