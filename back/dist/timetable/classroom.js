"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Classroom = void 0;
class Classroom {
    constructor(id, name, short, capacity) {
        this.id = id;
        this.name = name;
        this.short = short;
        this.capacity = capacity;
    }
    static fromXml(xml) {
        return Object.assign(Object.assign({}, xml), { name: xml.name.trim(), short: xml.short.trim() });
    }
}
exports.Classroom = Classroom;
