"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimetableDatabase = void 0;
const fs_1 = require("fs");
const card_1 = require("./card");
const class_1 = require("./class");
const classroom_1 = require("./classroom");
const daydef_1 = require("./daydef");
const group_1 = require("./group");
const lesson_1 = require("./lesson");
const period_1 = require("./period");
const subject_1 = require("./subject");
const teacher_1 = require("./teacher");
class TimetableDatabase {
    constructor(periods, daydefs, subjects, teachers, classrooms, classes, groups, lessons, cards) {
        this.periods = periods;
        this.daydefs = daydefs;
        this.subjects = subjects;
        this.teachers = teachers;
        this.classrooms = classrooms;
        this.classes = classes;
        this.groups = groups;
        this.lessons = lessons;
        this.cards = cards;
        this.dayIds = [
            ['monday', '10000'],
            ['tuesday', '01000'],
            ['wednesday', '00100'],
            ['thursday', '00010'],
            ['friday', '00001'],
        ];
        this.groupBy = (key) => (array) => array.reduce((objectsByKeyValue, obj) => {
            const value = obj[key];
            objectsByKeyValue[value] = (objectsByKeyValue[value] || []).concat(obj);
            return objectsByKeyValue;
        }, {});
        this.groupBySelector = (selector) => (array) => array.reduce((objectsByKeyValue, obj) => {
            const value = selector(obj);
            objectsByKeyValue[value] = (objectsByKeyValue[value] || []).concat(obj);
            return objectsByKeyValue;
        }, {});
    }
    static fromXml(xml) {
        return new TimetableDatabase(TimetableDatabase.mapByXmlEntities(xml, 'period', period_1.Period.fromXml, null).sort((o1, o2) => +o1.name > +o2.name ? 1 : -1), TimetableDatabase.mapByXmlEntities(xml, 'daysdef', daydef_1.DayDef.fromXml), TimetableDatabase.mapByXmlEntities(xml, 'subject', subject_1.Subject.fromXml), TimetableDatabase.mapByXmlEntities(xml, 'teacher', teacher_1.Teacher.fromXml), TimetableDatabase.mapByXmlEntities(xml, 'classroom', classroom_1.Classroom.fromXml), TimetableDatabase.mapByXmlEntities(xml, 'class', class_1.Class.fromXml), TimetableDatabase.mapByXmlEntities(xml, 'group', group_1.Group.fromXml), TimetableDatabase.mapByXmlEntities(xml, 'lesson', lesson_1.Lesson.fromXml), TimetableDatabase.mapByXmlEntities(xml, 'card', card_1.Card.fromXml, null));
    }
    static mapByXmlEntities(xml, entityName, constructor, groupKey = 'id') {
        const parsed = xml.timetable[entityName + (entityName.endsWith('s') ? 'e' : '') + 's'][0][entityName]
            .map(({ $ }) => constructor($));
        if (!groupKey)
            return parsed;
        const tmp = {};
        for (const p of parsed) {
            tmp[p[groupKey].trim()] = p;
        }
        return tmp;
        // return new Map(parsed.map((it: { [x: string]: string; }) => [it[groupKey], it]))
    }
    dumpSelfIntoFolder(path) {
        if (fs_1.existsSync(path))
            fs_1.rmdirSync(path, { recursive: true });
        fs_1.mkdirSync(path, { recursive: true });
        fs_1.writeFileSync(path + '/database.json', JSON.stringify(this), { encoding: 'utf8' });
        fs_1.writeFileSync(path + '/summary.json', JSON.stringify(this.getShortsForEverything()), { encoding: 'utf8' });
        fs_1.mkdirSync(path + '/plans');
        const obj = this.generateJsonForEverything();
        for (const key in obj) {
            if (key.includes('..'))
                throw Error(`Path (${key}) not allowed due to '..'`);
            fs_1.writeFileSync(`${path}/plans/${key.toLowerCase()}`, JSON.stringify(obj[key]), { encoding: 'utf8' });
        }
        return obj;
    }
    getGroupedClasses() {
        const outputArray = [];
        const classes = [];
        for (const key in this.classes)
            if (this.classes[key].short[0] >= '0' && this.classes[key].short[0] <= '9')
                classes.push(this.classes[key]);
        const grouped = this.groupBySelector((it) => it.short[0])(classes);
        for (const year in grouped) {
            const groupedByProfiles = this.groupBySelector((it) => it.short[1])(grouped[year]);
            for (const profileId in groupedByProfiles) {
                groupedByProfiles[profileId] = groupedByProfiles[profileId]
                    .map((it) => it.short)
                    .sort((o1, o2) => o1 > o2 ? 1 : -1);
            }
            outputArray.push({
                year: +year,
                profiles: groupedByProfiles,
            });
        }
        return outputArray;
    }
    getTeacherShortsAndNames() {
        const outputArray = {};
        for (const key in this.teachers) {
            const it = this.teachers[key];
            outputArray[it.short] = it.name;
        }
        return outputArray;
    }
    getClassroomsShortsAndNames() {
        const outputArray = {};
        for (const key in this.classrooms) {
            const it = this.classrooms[key];
            outputArray[it.short] = it.name;
        }
        return outputArray;
    }
    getSubjectsShortsAndNames() {
        const outputArray = {};
        for (const key in this.subjects) {
            const it = this.subjects[key];
            outputArray[it.short] = it.name;
        }
        return outputArray;
    }
    getShortsForEverything() {
        return {
            groupedClasses: this.getGroupedClasses(),
            teachers: this.getTeacherShortsAndNames(),
            classrooms: this.getClassroomsShortsAndNames(),
            subjects: this.getSubjectsShortsAndNames(),
        };
    }
    generateJsonForEverything() {
        const everyTimetable = {};
        for (const key in this.classes) {
            const obj = this.classes[key];
            if (everyTimetable[obj.short])
                throw new Error(`Key ${obj.short} already exists`);
            everyTimetable[obj.short] = this.getTimetableByClassId(key);
        }
        for (const key in this.teachers) {
            const obj = this.teachers[key];
            if (everyTimetable[obj.short])
                throw new Error(`Key ${obj.short} already exists`);
            everyTimetable[obj.short] = this.getTimetableByTeacherId(key);
        }
        for (const key in this.classrooms) {
            const obj = this.classrooms[key];
            if (everyTimetable[obj.short])
                throw new Error(`Key ${obj.short} already exists`);
            everyTimetable[obj.short] = this.getTimetableByClassroomId(key);
        }
        return everyTimetable;
    }
    getTimetableByClassId(classId) {
        var _a;
        const clazz = this.classes[classId];
        if (!clazz)
            throw new Error(`Class with id ${classId} not found!`);
        const responseObject = {
            type: 'C',
            fullName: clazz.name,
            teacherName: (this.teachers[clazz.teacherId] || {}).name,
            periods: this.periods.map(it => {
                return {
                    num: it.period,
                    start: it.startTime,
                    end: it.endTime,
                };
            }),
        };
        for (const [keyName, dayId] of this.dayIds) {
            const foundLessons = [];
            for (const lessonId in this.lessons) {
                const lesson = this.lessons[lessonId];
                if (!lesson.classIds.includes(clazz.id))
                    continue;
                const cards = this.cards
                    .filter(it => it.lessonId === lesson.id)
                    .filter(it => it.day === dayId);
                const subject = this.subjects[lesson.subjectId];
                const teacher = this.teachers[lesson.teacherId];
                for (const card of cards) {
                    const classroom = this.classrooms[card.classroomId];
                    for (const group of lesson.groupIds
                        .map(it => this.groups[it])
                        .filter((it) => it.classId === clazz.id)) {
                        foundLessons.push({
                            subject: subject.short,
                            period: card.period,
                            classroom: (_a = classroom === null || classroom === void 0 ? void 0 : classroom.short) !== null && _a !== void 0 ? _a : '',
                            teacher: teacher.short,
                            entireClass: group.entireClass,
                            groupNum: group.groupNumber,
                            group: group.name,
                        });
                    }
                }
            }
            const groupedByPeriod = this.groupBy('period')(foundLessons);
            const outputArray = [];
            for (const period of this.periods) {
                const array = groupedByPeriod[period.name];
                outputArray.push(!!array ? array.sort((group1, group2) => group1.groupNum - group2.groupNum) : null);
            }
            responseObject[keyName] = outputArray;
        }
        this.trimFirstAndLastLessonsIfAllEmpty(responseObject);
        return responseObject;
    }
    getTimetableByTeacherId(teacherId) {
        var _a;
        const teacher = this.teachers[teacherId];
        if (!teacher)
            throw new Error(`Teacher with id ${teacherId} not found!`);
        const responseObject = {
            type: 'T',
            fullName: teacher.name,
            periods: this.periods.map(it => {
                return {
                    num: it.period,
                    start: it.startTime,
                    end: it.endTime,
                };
            }),
        };
        for (const [keyName, dayId] of this.dayIds) {
            const foundLessons = [];
            for (const lessonId in this.lessons) {
                const lesson = this.lessons[lessonId];
                if (lesson.teacherId !== teacherId)
                    continue;
                const cards = this.cards
                    .filter(it => it.lessonId === lesson.id)
                    .filter(it => it.day === dayId);
                const subject = this.subjects[lesson.subjectId];
                for (const card of cards) {
                    const classroom = this.classrooms[card.classroomId];
                    for (const group of lesson.groupIds
                        .map(it => this.groups[it])) {
                        foundLessons.push({
                            class: this.classes[group.classId].short,
                            subject: subject.short,
                            period: card.period,
                            classroom: (_a = classroom === null || classroom === void 0 ? void 0 : classroom.short) !== null && _a !== void 0 ? _a : '',
                            teacher: teacher.short,
                            entireClass: group.entireClass,
                            group: group.name,
                        });
                    }
                }
            }
            const groupedByPeriod = this.groupBy('period')(foundLessons);
            const outputArray = [];
            for (const period of this.periods) {
                outputArray.push(groupedByPeriod[period.name] || null);
            }
            responseObject[keyName] = outputArray;
        }
        this.trimFirstAndLastLessonsIfAllEmpty(responseObject);
        return responseObject;
    }
    getTimetableByClassroomId(classroomId) {
        const classroom = this.classrooms[classroomId];
        if (!classroom)
            throw new Error(`Classroom with id ${classroomId} not found!`);
        const responseObject = {
            type: 'R',
            fullName: classroom.name,
            periods: this.periods.map(it => {
                return {
                    num: it.period,
                    start: it.startTime,
                    end: it.endTime,
                };
            }),
        };
        for (const [keyName, dayId] of this.dayIds) {
            const foundLessons = [];
            for (const lessonId in this.lessons) {
                const lesson = this.lessons[lessonId];
                if (!lesson.classroomIds.includes(classroomId))
                    continue;
                const cards = this.cards
                    .filter(it => it.lessonId === lesson.id)
                    .filter(it => it.day === dayId)
                    .filter(it => it.classroomId === classroomId);
                const subject = this.subjects[lesson.subjectId];
                const teacher = this.teachers[lesson.teacherId];
                for (const card of cards) {
                    for (const group of lesson.groupIds
                        .map(it => this.groups[it])) {
                        foundLessons.push({
                            class: this.classes[group.classId].short,
                            subject: subject.short,
                            period: card.period,
                            teacher: teacher.short,
                            entireClass: group.entireClass,
                            group: group.name,
                        });
                    }
                }
            }
            const groupedByPeriod = this.groupBy('period')(foundLessons);
            const outputArray = [];
            for (const period of this.periods) {
                outputArray.push(groupedByPeriod[period.name] || null);
            }
            responseObject[keyName] = outputArray;
        }
        this.trimFirstAndLastLessonsIfAllEmpty(responseObject);
        return responseObject;
    }
    trimFirstAndLastLessonsIfAllEmpty(responseObject) {
        for (let i = 0; i < this.periods.length; i++) {
            const countOfLessons = this.dayIds
                .map(([keyName]) => responseObject[keyName])
                .reduce((value, it) => value + !!it[0], 0);
            if (countOfLessons === 0) {
                this.dayIds
                    .map(([keyName]) => responseObject[keyName])
                    .forEach(it => it.shift());
                responseObject.periods.shift();
            }
            else
                break;
        }
        for (let i = this.periods.length - 1; i >= 0; i--) {
            const countOfLessons = this.dayIds
                .map(([keyName]) => responseObject[keyName])
                .reduce((value, it) => value + !!it[it.length - 1], 0);
            if (countOfLessons === 0) {
                this.dayIds
                    .map(([keyName]) => responseObject[keyName])
                    .forEach(it => it.pop());
                responseObject.periods.pop();
            }
            else
                break;
        }
    }
}
exports.TimetableDatabase = TimetableDatabase;
