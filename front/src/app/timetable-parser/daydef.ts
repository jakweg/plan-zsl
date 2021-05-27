export class DayDef {
    constructor(public id: string,
        public name: string,
        public short: string,
        public days: string) { }

    static fromXml(xml: Element): DayDef {
        const data = [
            xml.getAttribute('id'),
            xml.getAttribute('name'),
            xml.getAttribute('short'),
            xml.getAttribute('days'),
        ]
        // @ts-ignore
        return new DayDef(...data)
    }
}
