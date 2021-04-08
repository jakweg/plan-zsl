export class Period {
    constructor(public name: string,
        public short: string,
        public period: string,
        public startTime: string,
        public endTime: string) { }

    static fromXml({ name, short, period, starttime, endtime }): Period {
        return new Period(name, short, period, starttime, endtime);
    }
}