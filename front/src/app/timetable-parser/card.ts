export class Card {
    constructor(public lessonId: string,
                public classroomId: string,
                public period: string,
                public day: string) {
    }

    static fromXml(xml: Element): Card {
        const a = xml.getAttribute('classroomids');
        if (a.includes(','))
            throw new Error('More then one classroom per card is not supported');
        const b = xml.getAttribute('days');
        if (b.includes(','))
            throw new Error('More then one day per card is not supported');
        return new Card(
            xml.getAttribute('lessonid'), a,
            xml.getAttribute('period'), b);
    }
}
