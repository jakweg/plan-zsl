"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importStar(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const configuration_1 = require("./configuration");
const admin_1 = require("./routes/admin");
const ip_whitelist_1 = require("./routes/ip-whitelist");
const timetable_1 = require("./routes/timetable");
try {
    const config = configuration_1.Configuration.get();
    const port = +process.env.PORT || 8080;
    const app = express_1.default();
    app.set('trust proxy', true);
    app.use(ip_whitelist_1.ipWhitelistMiddleware);
    app.use(express_session_1.default({
        name: 'sid',
        secret: Array.from(new Array(16), () => (Math.random() * Math.pow(2, 31) | 0).toString(16)).join(''),
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 15 * 60 * 1000,
            httpOnly: true,
            secure: false,
            path: '/',
        },
    }));
    if (config.disableCors.value) {
        app.use((req, res, next) => {
            res.set('Access-Control-Allow-Origin', req.header('origin') || 'http://localhost:4200');
            res.set('Access-Control-Allow-Credentials', 'true');
            next('route');
        });
        app.options('/*', (req, res) => {
            res.set('Access-Control-Max-Age', '600');
            res.set('Access-Control-Allow-Headers', 'Content-Type, Cookie');
            res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
            res.status(200).end();
        });
    }
    if (config.serveFrontendFrom.value) {
        console.info('Serving content from ' + config.serveFrontendFrom.value);
        console.info('Registering API at path /api ');
        const api = express_1.default();
        timetable_1.initTimetableRoutes(api);
        admin_1.initAdminRoutes(api);
        app.use('/api', api);
        app.use('/assets', express_1.static(config.serveFrontendFrom.value + '/assets', {
            lastModified: true,
            cacheControl: true,
            dotfiles: 'ignore',
            etag: true,
            redirect: false,
            index: false,
            maxAge: 30 * 24 * 60 * 60 * 1000,
            immutable: true,
        }));
        app.use(express_1.static(config.serveFrontendFrom.value, {
            lastModified: true,
            cacheControl: true,
            dotfiles: 'ignore',
            etag: true,
            redirect: false,
            index: 'index.html',
            maxAge: 2 * 24 * 60 * 60 * 1000,
        }));
        app.get('*', (req, res) => res.sendFile('index.html', {
            maxAge: 2 * 24 * 60 * 60 * 1000,
            root: config.serveFrontendFrom.value,
        }));
    }
    else {
        console.info('Serving only API at / ');
        timetable_1.initTimetableRoutes(app);
        admin_1.initAdminRoutes(app);
        app.all('*', (req, res) => res.status(404).end());
    }
    app.listen(port, '0.0.0.0', () => {
        return console.log(`server is listening on ${port}`);
    });
}
catch (err) {
    console.error('Fatal error! Finishing application');
    console.error(err);
}
