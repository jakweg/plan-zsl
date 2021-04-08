"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Class = void 0;
class Class {
    constructor(id, name, short, teacherId, classroomId) {
        this.id = id;
        this.name = name;
        this.short = short;
        this.teacherId = teacherId;
        this.classroomId = classroomId;
    }
    static fromXml(xml) {
        if (xml.classroomids.includes(','))
            throw new Error('More then one classroom per class is not supported');
        return new Class(xml.id, xml.name, xml.short, xml.teacherid, xml.classroomids);
    }
}
exports.Class = Class;
