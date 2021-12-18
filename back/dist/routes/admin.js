"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initAdminRoutes = void 0;
const express_1 = __importDefault(require("express"));
const formidable_1 = require("formidable");
const fs_1 = require("fs");
const text_encoding_1 = require("text-encoding");
const xml2js_1 = require("xml2js");
const configuration_1 = require("../configuration");
const timetable_database_1 = require("../timetable/timetable-database");
const global_1 = require("./global");
const initAdminRoutes = (app) => {
    const config = configuration_1.Configuration.get();
    const generateCsfrToken = () => Array.from(new Array(64), () => (Math.random() * Math.pow(2, 31) | 0).toString(16)).join('');
    const adminRoute = express_1.default();
    app.use('/admin', adminRoute);
    adminRoute.get('/status', (req, res) => {
        res.send({
            signedIn: req.session.signedIn || false,
        });
    });
    adminRoute.post('/authorize', global_1.POST_DATA_HANDLER, (req, res) => {
        setTimeout(() => {
            if (req.body.login === config.adminLogin.value && req.body.password === config.adminPassword.value) {
                req.session.signedIn = true;
                req.session.login = req.body.login;
                req.session.csrfToken = generateCsfrToken();
                res.sendStatus(204);
            }
            else {
                if (req.session)
                    req.session.destroy(() => {
                    });
                res.sendStatus(401);
            }
        }, 1000);
    });
    adminRoute.all('/logout', (req, res) => {
        req.session.destroy(() => {
        });
        res.sendStatus(204);
    });
    const VERIFIED_USER_FILTER = (req, res, next) => {
        if ((req.session && req.session.signedIn))
            next();
        else
            global_1.haltWithReason(res, 401, 'Unauthorized user');
    };
    const VERIFIED_USER_AND_CSRF_FILTER = (req, res, next) => global_1.POST_DATA_HANDLER(req, res, () => VERIFIED_USER_FILTER(req, res, () => {
        if (req.body.token && req.body.token === req.session.csrfToken) {
            req.session.csrfToken = generateCsfrToken();
            next();
        }
        else
            global_1.haltWithReason(res, 401, 'Invalid csrf token');
    }));
    adminRoute.get('/list-timetables', VERIFIED_USER_FILTER, (req, res) => {
        res.type('application/json')
            .send(config
            .getTimetablesList()
            .map(e => (Object.assign(Object.assign({}, e), { active: e.id === config.currentTimetableId.value }))));
    });
    adminRoute.get('/server-settings', VERIFIED_USER_FILTER, (req, res) => {
        const current = config.getTimetablesList().find(e => e.id === config.currentTimetableId.value);
        res.type('application/json')
            .send({
            token: req.session.csrfToken,
            currentName: current ? current.name : null,
            currentId: current ? current.id : null,
            rotationEnabled: config.autoTimetableRotation.value,
            timetableCacheDuration: config.currentTimetableCacheSeconds.value,
        });
    });
    adminRoute.post('/set-server-setting', VERIFIED_USER_AND_CSRF_FILTER, (req, res) => {
        const key = req.body.key;
        const value = req.body.value;
        if (!key || !value)
            return global_1.haltWithReason(res, 400, 'Invalid setting');
        switch (key) {
            case 'auto-rotation':
                switch (value) {
                    case '1':
                        config.autoTimetableRotation.value = true;
                        break;
                    case '0':
                        config.autoTimetableRotation.value = false;
                        break;
                    default:
                        return global_1.haltWithReason(res, 400, 'Invalid value');
                }
                break;
            case 'timetable-info-cache-duration':
                if (isNaN(+value) || +value < 0)
                    return global_1.haltWithReason(res, 400, 'Invalid value');
                config.currentTimetableCacheSeconds.value = +value;
                break;
        }
        res.sendStatus(204);
    });
    adminRoute.get('/timetable-info/:id', VERIFIED_USER_FILTER, (req, res) => {
        const id = +req.params.id;
        const current = config.getTimetablesList().find(e => e.id === id);
        if (!current)
            return global_1.haltWithReason(res, 400, 'Plan not found');
        res.type('application/json')
            .send({
            selected: config.currentTimetableId.value === id,
            name: current.name,
            id: current.id,
            isValidFrom: current.isValidFrom,
            autoEnabled: config.autoTimetableRotation.value,
            token: req.session.csrfToken,
        });
    });
    adminRoute.post('/update-timetable-info/:id', VERIFIED_USER_AND_CSRF_FILTER, (req, res) => {
        const id = +req.params.id;
        const current = config.getTimetablesList().find(e => e.id === id);
        if (!current)
            return global_1.haltWithReason(res, 400, 'Plan not found');
        if (req.body.name && req.body.name.length > 3 && req.body.name.length < 40)
            current.name = req.body.name;
        if (req.body.date && req.body.date > 0)
            current.isValidFrom = req.body.date;
        config.doAutoTimetableSelection();
        config.saveTimetablesConfig();
        res.sendStatus(204);
    });
    adminRoute.get('/select-timetable/:id', VERIFIED_USER_FILTER, (req, res) => {
        const id = +req.params.id;
        if (config.autoTimetableRotation.value)
            return global_1.haltWithReason(res, 405, 'Auto rotation is enabled!');
        if (!config.timetableExists(id))
            return global_1.haltWithReason(res, 400, 'Plan not found');
        config.currentTimetableId.value = id;
        res.sendStatus(204);
    });
    adminRoute.post('/delete-timetable/:id', VERIFIED_USER_AND_CSRF_FILTER, (req, res) => {
        const id = +req.params.id;
        if (!config.timetableExists(id))
            return global_1.haltWithReason(res, 404, 'Plan not found');
        config.deleteTimetable(id, ok => {
            res.sendStatus(ok ? 204 : 400);
        });
    });
    adminRoute.post('/new-timetable', VERIFIED_USER_FILTER, (req, res) => {
        const form = new formidable_1.IncomingForm();
        // form.maxFileSize = 50 * 1024 * 1024
        form.parse(req, (err, fields, files) => {
            if (err)
                return global_1.haltWithReason(res, 400, err.message);
            const name = (fields.name || '').toString().trim();
            if (!name || name.length < 5 || name.length > 40)
                return global_1.haltWithReason(res, 400, 'Invalid name');
            const activeSinceTimestamp = new Date(isNaN(+fields.isValidFrom) ? fields.isValidFrom.toString() : +files.isValidFrom).getTime();
            if (!activeSinceTimestamp)
                return global_1.haltWithReason(res, 400, 'Invalid date');
            const file = files.file;
            if (!file)
                return global_1.haltWithReason(res, 406, 'File not given');
            fs_1.readFile(file.path, (err, data) => {
                if (err)
                    return global_1.haltWithReason(res, 500, 'Unable to read tmp file');
                let decoded = '';
                const decoder = new text_encoding_1.TextDecoder('windows-1250');
                try {
                    decoded = decoder.decode(data, { fatal: true });
                }
                catch (err) {
                    return global_1.haltWithReason(res, 422, 'Unable to decode xml file');
                }
                xml2js_1.parseString(decoded, (err, result) => {
                    if (err)
                        return global_1.haltWithReason(res, 400, 'Unable to parse XML file');
                    try {
                        const timetable = timetable_database_1.TimetableDatabase.fromXml(result);
                        const info = config.registerNewTimetable(name, activeSinceTimestamp);
                        timetable.dumpSelfIntoFolder(config.getTimetablePathById(info.id));
                        config.saveTimetablesConfig();
                        res.status(201).send({ newTimetableId: info.id });
                    }
                    catch (err) {
                        console.error(err);
                        return global_1.haltWithReason(res, 400, 'An error was thrown while handling timetable');
                    }
                });
            });
        });
    });
};
exports.initAdminRoutes = initAdminRoutes;
