"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subject = void 0;
class Subject {
    constructor(id, name, short) {
        this.id = id;
        this.name = name;
        this.short = short;
    }
    static fromXml(xml) {
        return xml; // no name changes
    }
}
exports.Subject = Subject;
