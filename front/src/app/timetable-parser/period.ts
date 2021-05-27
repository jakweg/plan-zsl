export class Period {
    constructor(public name: string,
        public short: string,
        public period: string,
        public startTime: string,
        public endTime: string) { }

    static fromXml(xml: Element): Period {
        const data = [
            xml.getAttribute('name'),
            xml.getAttribute('short'),
            xml.getAttribute('period'),
            xml.getAttribute('starttime'),
            xml.getAttribute('endtime'),
        ]
        // @ts-ignore
        return new Period(...data);
    }
}
