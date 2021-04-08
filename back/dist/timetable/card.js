"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Card = void 0;
class Card {
    constructor(lessonId, classroomId, period, day) {
        this.lessonId = lessonId;
        this.classroomId = classroomId;
        this.period = period;
        this.day = day;
    }
    static fromXml(xml) {
        if (xml.classroomids.includes(','))
            throw new Error('More then one classroom per card is not supported');
        if (xml.days.includes(','))
            throw new Error('More then one day per card is not supported');
        return new Card(xml.lessonid, xml.classroomids, xml.period, xml.days);
    }
}
exports.Card = Card;
