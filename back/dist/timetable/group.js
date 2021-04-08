"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Group = void 0;
class Group {
    constructor(id, name, classId, entireClass, divisionTag, studentCount) {
        this.id = id;
        this.name = name;
        this.classId = classId;
        this.entireClass = entireClass;
        this.divisionTag = divisionTag;
        this.studentCount = studentCount;
        this.groupNumber = entireClass ? 0 : +name.replace(/\D/g, '');
    }
    static fromXml(xml) {
        return new Group(xml.id, xml.name.trim(), xml.classid, xml.entireclass !== '0', parseInt(xml.divisiontag), parseInt(xml.studentcount));
    }
}
exports.Group = Group;
