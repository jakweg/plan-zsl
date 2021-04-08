export class Card {
    constructor(public lessonId: string,
        public classroomId: string,
        public period: string,
        public day: string, ) { }

    static fromXml(xml: any): Card {
        if (xml.classroomids.includes(','))
            throw new Error('More then one classroom per card is not supported')
        if (xml.days.includes(','))
            throw new Error('More then one day per card is not supported')
        return new Card(xml.lessonid, xml.classroomids, xml.period, xml.days)
    }
}