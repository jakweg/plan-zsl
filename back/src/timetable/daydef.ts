export class DayDef {
    constructor(public id: string,
        public name: string,
        public short: string,
        public days: string) { }

    static fromXml(xml: any): DayDef {
        return xml; // no name changes
    }
}