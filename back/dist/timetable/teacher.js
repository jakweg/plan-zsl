"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Teacher = void 0;
class Teacher {
    constructor(id, firstName, lastName, name, short, gender, color) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.name = name;
        this.short = short;
        this.gender = gender;
        this.color = color;
    }
    static fromXml(xml) {
        return new Teacher(xml.id, xml.firstname, xml.lastname, xml.name, xml.short, xml.gender, xml.color);
    }
}
exports.Teacher = Teacher;
