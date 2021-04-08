"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DayDef = void 0;
class DayDef {
    constructor(id, name, short, days) {
        this.id = id;
        this.name = name;
        this.short = short;
        this.days = days;
    }
    static fromXml(xml) {
        return xml; // no name changes
    }
}
exports.DayDef = DayDef;
