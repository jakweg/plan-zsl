"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initTimetableRoutes = void 0;
const express_1 = __importDefault(require("express"));
const fs_1 = require("fs");
const configuration_1 = require("../configuration");
const global_1 = require("./global");
const initTimetableRoutes = (app) => {
    const config = configuration_1.Configuration.get();
    app.get('/timetable/list', (req, res) => {
        res.type('application/json')
            .send(config
            .getTimetablesList()
            .map(it => ({
            id: +it.id,
            name: it.name,
            isValidFrom: it.isValidFrom
        }))
            .sort((a, b) => a.isValidFrom - b.isValidFrom));
    });
    app.get('/timetable/status', (req, res) => {
        res.type('application/json');
        res.send({
            currentTimetableId: config.currentTimetableId.value,
            nextChange: config.nextTimetableChange,
            cacheCurrentUntil: config.cacheCurrentTimetableUntil,
        });
    });
    const timetableRoute = express_1.default();
    app.get('/timetable/:timetableId/*', (req, res) => {
        let id = +req.params.timetableId;
        if (isNaN(id))
            return global_1.haltWithReason(res, 400, 'Invalid timetable id');
        if (id === 0) {
            id = config.currentTimetableId.value;
            // @ts-ignore
            req.query.selectedCurrent = true;
        }
        if (!config.timetableExists(id))
            return global_1.haltWithReason(res, 404, 'Timetable with this id not found');
        // @ts-ignore
        req.query.timetableId = id;
        req.next('route');
    });
    app.use('/timetable/:timetableId', timetableRoute);
    timetableRoute.get('/list', (req, res) => {
        const path = config.getTimetablePathById(+req.query.timetableId);
        fs_1.readFile(path + '/summary.json', { encoding: 'utf8' }, (err, data) => {
            if (err)
                return global_1.haltWithReason(res, 500, 'unable to read file');
            res.type('application/json');
            // TODO increase cache?
            // TODO set cache up to the time of replacing current timetable
            res.set('Cache-Control', 'max-age=' + (req.query.selectedCurrent ? 3000 : 10 * 60 * 60 * 7));
            res.send(data);
        });
    });
    timetableRoute.get('/get/:short', (req, res) => {
        const path = config.getTimetablePathById(+req.query.timetableId);
        const short = req.params.short.trim().toLowerCase();
        if (short.includes('..'))
            return global_1.haltWithReason(res, 404, 'Plan not found');
        fs_1.readFile(path + '/plans/' + short, { encoding: 'utf8' }, (err, data) => {
            if (err)
                return global_1.haltWithReason(res, 404, 'Plan not found');
            res.type('application/json');
            // TODO increase cache?
            // TODO set cache up to the time of replacing current timetable
            res.set('Cache-Control', 'max-age=' + (req.query.selectedCurrent ? 3000 : 10 * 60 * 60 * 7));
            res.send(data);
        });
    });
};
exports.initTimetableRoutes = initTimetableRoutes;
