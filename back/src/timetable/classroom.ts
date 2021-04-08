export class Classroom {
	constructor(public id: string,
	            public name: string,
	            public short: string,
	            public capacity: string) {
	}

	static fromXml(xml: any): Classroom {
		return {...xml, name: xml.name.trim(), short: xml.short.trim()}
	}
}
