"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Configuration = exports.deleteFolderRecursive = exports.TimetableInfo = void 0;
const fs_1 = require("fs");
const timers_1 = require("timers");
const preference_1 = require("./preferences/preference");
const preference_manager_1 = require("./preferences/preference-manager");
class TimetableInfo {
    constructor(id, name, isValidFrom) {
        this.id = id;
        this.name = name;
        this.isValidFrom = isValidFrom;
    }
}
exports.TimetableInfo = TimetableInfo;
function deleteFolderRecursive(path) {
    let files = [];
    if ((0, fs_1.existsSync)(path)) {
        files = (0, fs_1.readdirSync)(path);
        files.forEach(function (file) {
            let curPath = path + '/' + file;
            if ((0, fs_1.lstatSync)(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            }
            else { // delete file
                (0, fs_1.unlinkSync)(curPath);
            }
        });
        (0, fs_1.rmdirSync)(path);
    }
}
exports.deleteFolderRecursive = deleteFolderRecursive;
function generateNewTimetableId() {
    return Date.now() % ((Math.random() * 1000000000) | 0) | 0;
}
class Configuration {
    constructor() {
        this.prefs = new preference_manager_1.PreferenceManager();
        this.currentTimetableId = new preference_1.Preference('currentTimetableId', 0, 'read-write', true)
            .registerIn(this.prefs);
        this.autoTimetableRotation = new preference_1.Preference('enableAutoTimetableRotation', false, 'read-write', false)
            .registerIn(this.prefs);
        this.disableCors = new preference_1.Preference('disableCors', false, 'read-only', false)
            .registerIn(this.prefs);
        this.currentTimetableCacheSeconds = new preference_1.Preference('currentTimetableCacheSeconds', 5 * 1000, 'read-write', false)
            .registerIn(this.prefs);
        this.adminLogin = new preference_1.Preference('adminLogin', null, 'read-write', true)
            .registerIn(this.prefs);
        this.adminPassword = new preference_1.Preference('adminPassword', null, 'read-write', true)
            .registerIn(this.prefs);
        this.serveFrontendFrom = new preference_1.Preference('serveFrontFrom', '', 'read-write', true)
            .registerIn(this.prefs);
        this.enableIpWhitelist = new preference_1.Preference('enableIpWhitelist', false, 'read-write', false)
            .registerIn(this.prefs);
        this.whitelistedIps = new preference_1.Preference('whitelistedIps', [], 'read-write', false)
            .registerIn(this.prefs);
        this.timetablesPath = new preference_1.Preference('timetablesPath', './timetables', 'read-only', false)
            .registerIn(this.prefs);
        this.timetablesMap = new Map();
        this.nextTimetableChangeTime = null;
        this.prefs.fromJSON(JSON.parse((0, fs_1.readFileSync)(Configuration.CONFIG_PATH, { encoding: 'utf8' })));
        this.prefs.changedListener = () => {
            (0, fs_1.writeFileSync)(Configuration.CONFIG_PATH, JSON.stringify(this.prefs.toJSON(), null, 2), { encoding: 'utf8' });
        };
        this.autoTimetableRotation.changeListeners.push(() => this.doAutoTimetableSelection());
        if (!(0, fs_1.existsSync)(this.timetablesPath.value)) {
            console.warn('Timetables folder does not exists, creating one');
            (0, fs_1.mkdirSync)(this.timetablesPath.value, { recursive: true });
        }
        if ((0, fs_1.existsSync)(`${this.timetablesPath}/.config.json`)) {
            const conf = JSON.parse((0, fs_1.readFileSync)(`${this.timetablesPath}/.config.json`, { encoding: 'utf8' }));
            this.timetablesMap.clear();
            for (const t of conf.timetables) {
                this.timetablesMap.set(t.id, new TimetableInfo(t.id, t.name, t.isValidFrom));
            }
        }
        if (!this.autoTimetableRotation.value && this.currentTimetableId.value === 0) {
            console.warn('No current timetable selected, specify it in config file or enable auto timetable rotation');
        }
        else if (this.autoTimetableRotation.value) {
            if (this.getTimetablesList().length === 0)
                console.warn('No current timetable selected, no available timetable found');
            else {
                this.doAutoTimetableSelection();
                console.log('Selected timetable with id:', this.currentTimetableId.value);
            }
        }
        else {
            console.log('Selected statically timetable with id', this.currentTimetableId.value);
        }
        if (this.currentTimetableId.value !== 0
            && !this.getTimetablesList().find(it => it.id == this.currentTimetableId.value)) {
            throw new Error('Cannot find timetable with id ' + this.currentTimetableId.value);
        }
        (0, timers_1.setInterval)(() => this.doAutoTimetableSelection(), 5000);
    }
    get nextTimetableChange() {
        return this.nextTimetableChangeTime ? this.nextTimetableChangeTime : null;
    }
    get cacheCurrentTimetableUntil() {
        if (!this.nextTimetableChangeTime)
            return new Date().getTime() + this.currentTimetableCacheSeconds.value * 1000;
        else
            return Math.min(new Date().getTime() + this.currentTimetableCacheSeconds.value * 1000, this.nextTimetableChangeTime);
    }
    static get() {
        if (!Configuration.INSTANCE) {
            if (!(0, fs_1.existsSync)(Configuration.CONFIG_PATH))
                throw new Error(`Config file does not exists here: ${Configuration.CONFIG_PATH}`);
            try {
                this.INSTANCE = new Configuration();
            }
            catch (err) {
                throw new Error(`Unable to read or parse config file: ${Configuration.CONFIG_PATH}, because of ${err}`);
            }
        }
        return this.INSTANCE;
    }
    saveTimetablesConfig() {
        (0, fs_1.writeFileSync)(`${this.timetablesPath}/.config.json`, JSON.stringify({
            timetables: Array.from(this.timetablesMap.values()),
        }), { encoding: 'utf8' });
    }
    registerNewTimetable(name, activateSince) {
        const info = new TimetableInfo(generateNewTimetableId(), name, activateSince);
        this.timetablesMap.set(+info.id, info);
        return info;
    }
    deleteTimetable(id, callback) {
        const info = this.timetablesMap.get(id);
        if (!info)
            return callback(true);
        if (info.id === this.currentTimetableId.value)
            return callback(false);
        let err;
        try {
            deleteFolderRecursive(this.getTimetablePathById(id));
        }
        catch (e) {
            err = e;
        }
        if (err) {
            console.error('Unable to delete timetable', err);
            callback(false);
        }
        else {
            this.timetablesMap.delete(id);
            this.saveTimetablesConfig();
            callback(true);
        }
    }
    getTimetablesList() {
        return Array.from(this.timetablesMap.values())
            .sort((o1, o2) => (o2.isValidFrom - o1.isValidFrom));
    }
    timetableExists(id) {
        return this.timetablesMap.has(id);
    }
    getTimetablePathById(id) {
        return `${this.timetablesPath}/${id}`;
    }
    doAutoTimetableSelection() {
        if (!this.autoTimetableRotation.value)
            return;
        const timetables = this.getTimetablesList();
        if (!timetables.length)
            return;
        const now = new Date().getTime();
        timetables.sort((a, b) => b.isValidFrom - a.isValidFrom);
        let i = 0;
        let selectingTimetableId;
        for (const e of timetables) {
            if (e.isValidFrom < now) {
                selectingTimetableId = e.id;
                break;
            }
            i++;
        }
        if (this.currentTimetableId != selectingTimetableId) {
            console.warn('Selecting new timetable', { id: selectingTimetableId });
            this.currentTimetableId.value = selectingTimetableId;
        }
        this.nextTimetableChangeTime = i > 0 ? timetables[i - 1].isValidFrom : null;
    }
}
exports.Configuration = Configuration;
Configuration.CONFIG_PATH = './config.json';
