"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lesson = void 0;
class Lesson {
    constructor(id, classIds, subjectId, teacherId, classroomIds, groupIds, daysDefId) {
        this.id = id;
        this.classIds = classIds;
        this.subjectId = subjectId;
        this.teacherId = teacherId;
        this.classroomIds = classroomIds;
        this.groupIds = groupIds;
        this.daysDefId = daysDefId;
    }
    static fromXml(xml) {
        if (xml.teacherids.includes(','))
            throw new Error('Class::fromXml: More then one `teacher` per `lesson` is not supported');
        return new Lesson(xml.id, xml.classids.split(','), xml.subjectid, xml.teacherids, xml.classroomids.split(','), xml.groupids.split(','), xml.daysdefid);
    }
}
exports.Lesson = Lesson;
