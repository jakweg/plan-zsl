export class Classroom {
	constructor(public id: string,
	            public name: string,
	            public short: string) {
	}

	static fromXml(xml: Element): Classroom {
		const data = [
			xml.getAttribute('id'),
			xml.getAttribute('name'),
			xml.getAttribute('short'),
		]
		// @ts-ignore
		return new Classroom(...data)
	}
}
