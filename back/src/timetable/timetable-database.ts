import { existsSync, mkdirSync, rmdirSync, writeFileSync } from 'fs'
import { Card } from './card'
import { Class } from './class'
import { Classroom } from './classroom'
import { DayDef } from './daydef'
import { Group } from './group'
import { Lesson } from './lesson'
import { Period } from './period'
import { Subject } from './subject'
import { Teacher } from './teacher'

export class TimetableDatabase {
	private dayIds = [
		['monday', '10000'],
		['tuesday', '01000'],
		['wednesday', '00100'],
		['thursday', '00010'],
		['friday', '00001'],
	]

	constructor(
		public periods: Period[],
		public daydefs: any,
		public subjects: any,
		public teachers: any,
		public classrooms: any,
		public classes: any,
		public groups: any,
		public lessons: any,
		public cards: Card[],
	) {
	}

	static fromXml(xml: any) {
		return new TimetableDatabase(
			TimetableDatabase.mapByXmlEntities(xml, 'period', Period.fromXml, null).sort((o1: Period, o2: Period) => +o1.name > +o2.name ? 1 : -1),
			TimetableDatabase.mapByXmlEntities(xml, 'daysdef', DayDef.fromXml),
			TimetableDatabase.mapByXmlEntities(xml, 'subject', Subject.fromXml),
			TimetableDatabase.mapByXmlEntities(xml, 'teacher', Teacher.fromXml),
			TimetableDatabase.mapByXmlEntities(xml, 'classroom', Classroom.fromXml),
			TimetableDatabase.mapByXmlEntities(xml, 'class', Class.fromXml),
			TimetableDatabase.mapByXmlEntities(xml, 'group', Group.fromXml),
			TimetableDatabase.mapByXmlEntities(xml, 'lesson', Lesson.fromXml),
			TimetableDatabase.mapByXmlEntities(xml, 'card', Card.fromXml, null),
		)
	}

	private static mapByXmlEntities(xml: any, entityName: string, constructor: Function, groupKey: string = 'id'): any {
		const parsed = xml.timetable[entityName + (entityName.endsWith('s') ? 'e' : '') + 's']
			[0][entityName]
			.map(({$}) => constructor($))


		if (!groupKey)
			return parsed
		const tmp = {}
		for (const p of parsed) {
			tmp[p[groupKey].trim()] = p
		}
		return tmp
		// return new Map(parsed.map((it: { [x: string]: string; }) => [it[groupKey], it]))
	}

	dumpSelfIntoFolder(path: string): any {
		if (existsSync(path))
			rmdirSync(path, {recursive: true})
		mkdirSync(path, {recursive: true})

		writeFileSync(path + '/database.json', JSON.stringify(this), {encoding: 'utf8'})
		writeFileSync(path + '/summary.json', JSON.stringify(this.getShortsForEverything()), {encoding: 'utf8'})

		mkdirSync(path + '/plans')
		const obj = this.generateJsonForEverything()

		for (const key in obj) {
			if (key.includes('..')) throw Error(`Path (${key}) not allowed due to '..'`)

			writeFileSync(`${path}/plans/${key.toLowerCase()}`, JSON.stringify(obj[key]), {encoding: 'utf8'})
		}

		return obj
	}

	getGroupedClasses(): any[] {
		const outputArray = []

		const classes: Class[] = []
		for (const key in this.classes)
			if (this.classes[key].short[0] >= '0' && this.classes[key].short[0] <= '9')
				classes.push(this.classes[key])


		const grouped = this.groupBySelector((it: Class) => it.short[0])(classes)
		for (const year in grouped) {
			const groupedByProfiles = this.groupBySelector((it: Class) => it.short[1])(grouped[year])
			for (const profileId in groupedByProfiles) {
				groupedByProfiles[profileId] = groupedByProfiles[profileId]
					.map((it: Class) => it.short)
					.sort((o1: string, o2: string) => o1 > o2 ? 1 : -1)
			}

			outputArray.push({
				year: +year,
				profiles: groupedByProfiles,
			})
		}

		return outputArray
	}

	getTeacherShortsAndNames(): any {
		const outputArray = {}
		for (const key in this.teachers) {
			const it: Teacher = this.teachers[key]
			outputArray[it.short] = it.name
		}
		return outputArray
	}

	getClassroomsShortsAndNames(): any {
		const outputArray = {}
		for (const key in this.classrooms) {
			const it: Classroom = this.classrooms[key]
			outputArray[it.short] = it.name
		}
		return outputArray
	}

	getSubjectsShortsAndNames(): any {
		const outputArray = {}
		for (const key in this.subjects) {
			const it: Subject = this.subjects[key]
			outputArray[it.short] = it.name
		}
		return outputArray
	}

	getShortsForEverything(): any {
		return {
			groupedClasses: this.getGroupedClasses(),
			teachers: this.getTeacherShortsAndNames(),
			classrooms: this.getClassroomsShortsAndNames(),
			subjects: this.getSubjectsShortsAndNames(),
		}
	}

	generateJsonForEverything(): any {
		const everyTimetable = {}

		for (const key in this.classes) {
			const obj: Class = this.classes[key]
			if (everyTimetable[obj.short])
				throw new Error(`Key ${obj.short} already exists`)
			everyTimetable[obj.short] = this.getTimetableByClassId(key)
		}

		for (const key in this.teachers) {
			const obj: Teacher = this.teachers[key]
			if (everyTimetable[obj.short])
				throw new Error(`Key ${obj.short} already exists`)
			everyTimetable[obj.short] = this.getTimetableByTeacherId(key)
		}

		for (const key in this.classrooms) {
			const obj: Classroom = this.classrooms[key]
			if (everyTimetable[obj.short])
				throw new Error(`Key ${obj.short} already exists`)
			everyTimetable[obj.short] = this.getTimetableByClassroomId(key)
		}

		return everyTimetable
	}

	getTimetableByClassId(classId: string): any {
		const clazz: Class = this.classes[classId]
		if (!clazz)
			throw new Error(`Class with id ${classId} not found!`)

		const responseObject = {
			type: 'C',
			fullName: clazz.name,
			teacherName: (this.teachers[clazz.teacherId] || {}).name,
			periods: this.periods.map(it => {
				return {
					num: it.period,
					start: it.startTime,
					end: it.endTime,
				}
			}),
		}


		for (const [keyName, dayId] of this.dayIds) {
			const foundLessons = []

			for (const lessonId in this.lessons) {
				const lesson: Lesson = this.lessons[lessonId]
				if (!lesson.classIds.includes(clazz.id))
					continue

				const cards = this.cards
					.filter(it => it.lessonId === lesson.id)
					.filter(it => it.day === dayId)

				const subject: Subject = this.subjects[lesson.subjectId]
				const teacher: Teacher = this.teachers[lesson.teacherId]


				for (const card of cards) {
					const classroom: Classroom = this.classrooms[card.classroomId]

					for (const group of lesson.groupIds
						.map(it => this.groups[it])
						.filter((it: Group) => it.classId === clazz.id)) {

						foundLessons.push({
							subject: subject.short,
							period: card.period,
							classroom: classroom?.short ?? '',
							teacher: teacher.short,
							entireClass: group.entireClass,
							groupNum: (group as Group).groupNumber,
							group: (group as Group).name,
						})
					}
				}
			}

			const groupedByPeriod = this.groupBy('period')(foundLessons)
			const outputArray = []
			for (const period of this.periods) {
				const array = groupedByPeriod[period.name]
				outputArray.push(!!array ? array.sort(
					(group1: { groupNum: number; }, group2: { groupNum: number; }) => group1.groupNum - group2.groupNum) : null)
			}

			responseObject[keyName] = outputArray
		}
		this.trimFirstAndLastLessonsIfAllEmpty(responseObject)
		return responseObject
	}

	getTimetableByTeacherId(teacherId: string): any {
		const teacher: Teacher = this.teachers[teacherId]
		if (!teacher)
			throw new Error(`Teacher with id ${teacherId} not found!`)

		const responseObject = {
			type: 'T',
			fullName: teacher.name,
			periods: this.periods.map(it => {
				return {
					num: it.period,
					start: it.startTime,
					end: it.endTime,
				}
			}),
		}


		for (const [keyName, dayId] of this.dayIds) {
			const foundLessons = []

			for (const lessonId in this.lessons) {
				const lesson: Lesson = this.lessons[lessonId]
				if (lesson.teacherId !== teacherId)
					continue

				const cards = this.cards
					.filter(it => it.lessonId === lesson.id)
					.filter(it => it.day === dayId)

				const subject: Subject = this.subjects[lesson.subjectId]

				for (const card of cards) {
					const classroom: Classroom = this.classrooms[card.classroomId]

					for (const group of lesson.groupIds
						.map(it => this.groups[it])) {

						foundLessons.push({
							class: group != null ? this.classes[(group as Group).classId].short : '',
							subject: subject.short,
							period: card.period,
							classroom: classroom?.short ?? '',
							teacher: teacher.short,
							entireClass: group?.entireClass ?? true,
							group: (group as Group)?.name,
						})
					}
				}
			}

			const groupedByPeriod = this.groupBy('period')(foundLessons)
			const outputArray = []
			for (const period of this.periods) {
				outputArray.push(groupedByPeriod[period.name] || null)
			}

			responseObject[keyName] = outputArray
		}


		this.trimFirstAndLastLessonsIfAllEmpty(responseObject)
		return responseObject
	}

	getTimetableByClassroomId(classroomId: string): any {
		const classroom: Classroom = this.classrooms[classroomId]
		if (!classroom)
			throw new Error(`Classroom with id ${classroomId} not found!`)

		const responseObject = {
			type: 'R',
			fullName: classroom.name,
			periods: this.periods.map(it => {
				return {
					num: it.period,
					start: it.startTime,
					end: it.endTime,
				}
			}),
		}


		for (const [keyName, dayId] of this.dayIds) {
			const foundLessons = []

			for (const lessonId in this.lessons) {
				const lesson: Lesson = this.lessons[lessonId]
				if (!lesson.classroomIds.includes(classroomId))
					continue


				const cards = this.cards
					.filter(it => it.lessonId === lesson.id)
					.filter(it => it.day === dayId)
					.filter(it => it.classroomId === classroomId)

				const subject: Subject = this.subjects[lesson.subjectId]
				const teacher: Teacher = this.teachers[lesson.teacherId]

				for (const card of cards) {
					for (const group of lesson.groupIds
						.map(it => this.groups[it])) {

						foundLessons.push({
							class: this.classes[(group as Group).classId].short,
							subject: subject.short,
							period: card.period,
							teacher: teacher.short,
							entireClass: group.entireClass,
							group: (group as Group).name,
						})
					}
				}
			}

			const groupedByPeriod = this.groupBy('period')(foundLessons)
			const outputArray = []
			for (const period of this.periods) {
				outputArray.push(groupedByPeriod[period.name] || null)
			}

			responseObject[keyName] = outputArray
		}

		this.trimFirstAndLastLessonsIfAllEmpty(responseObject)
		return responseObject
	}

	private groupBy = (key: string | number) => (array: any[]) =>
		array.reduce((objectsByKeyValue, obj) => {
			const value = obj[key]
			objectsByKeyValue[value] = (objectsByKeyValue[value] || []).concat(obj)
			return objectsByKeyValue
		}, {})

	private groupBySelector = (selector: Function) => (array: any[]) =>
		array.reduce((objectsByKeyValue, obj) => {
			const value = selector(obj)
			objectsByKeyValue[value] = (objectsByKeyValue[value] || []).concat(obj)
			return objectsByKeyValue
		}, {})

	private trimFirstAndLastLessonsIfAllEmpty(responseObject: any) {
		for (let i = 0; i < this.periods.length; i++) {
			const countOfLessons = this.dayIds
				.map(([keyName]) => responseObject[keyName])
				.reduce((value, it) => value + !!it[0], 0)


			if (countOfLessons === 0) {
				this.dayIds
					.map(([keyName]) => responseObject[keyName])
					.forEach(it => it.shift())
				responseObject.periods.shift()
			} else break
		}


		for (let i = this.periods.length - 1; i >= 0; i--) {
			const countOfLessons = this.dayIds
				.map(([keyName]) => responseObject[keyName])
				.reduce((value, it) => value + !!it[it.length - 1], 0)


			if (countOfLessons === 0) {
				this.dayIds
					.map(([keyName]) => responseObject[keyName])
					.forEach(it => it.pop())
				responseObject.periods.pop()
			} else break
		}
	}

}
