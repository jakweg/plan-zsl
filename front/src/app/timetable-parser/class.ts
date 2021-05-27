export class Class {
    constructor(public id: string,
        public name: string,
        public short: string,
        public teacherId: string,
        public classroomId: string) { }

    static fromXml(xml: Element): Class {
        const data = [
            xml.getAttribute('id'),
            xml.getAttribute('name'),
            xml.getAttribute('short'),
            xml.getAttribute('teacherid'),
            xml.getAttribute('classroomids'),
        ]
        if (data[4].includes(','))
            throw new Error('More then one classroom per class is not supported')
        // @ts-ignore
        return new Class(...data)
    }
}
