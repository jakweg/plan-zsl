"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Period = void 0;
class Period {
    constructor(name, short, period, startTime, endTime) {
        this.name = name;
        this.short = short;
        this.period = period;
        this.startTime = startTime;
        this.endTime = endTime;
    }
    static fromXml({ name, short, period, starttime, endtime }) {
        return new Period(name, short, period, starttime, endtime);
    }
}
exports.Period = Period;
