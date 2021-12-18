"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ipWhitelistMiddleware = void 0;
const configuration_1 = require("../configuration");
const fs_1 = require("fs");
function getNetworkPartOfIp(ip, networkPrefix) {
    return ip
        .split('/')[0]
        .split('.')
        .map(e => (+e + 256)
        .toString(2)
        .substr(1))
        .join('')
        .substr(0, networkPrefix);
}
const isIpInSubnet = (ip, subnet) => {
    const networkPrefix = +subnet.substr(subnet.indexOf('/') + 1);
    if (isNaN(networkPrefix))
        return false;
    const networkPartOfIp = getNetworkPartOfIp(ip, networkPrefix);
    const networkPartOfSubnet = getNetworkPartOfIp(subnet, networkPrefix);
    return networkPartOfIp === networkPartOfSubnet;
};
const isThisIpPermitted = (ip) => {
    const config = configuration_1.Configuration.get();
    const whitelisted = config.whitelistedIps.value;
    return whitelisted.some(w => isIpInSubnet(ip, w));
};
function serveBlacklistedPage(res) {
    const config = configuration_1.Configuration.get();
    fs_1.readFile(config.serveFrontendFrom.value + '/assets/non-whitelisted-ip.html', (err, data) => {
        if (err)
            res.sendStatus(401);
        else {
            res.status(401);
            res.contentType('text/html');
            res.end(data);
        }
    });
}
const ipWhitelistMiddleware = (req, res, next) => {
    var _a, _b, _c, _d;
    const config = configuration_1.Configuration.get();
    let isForceAllowed = ((_b = (_a = req.headers) === null || _a === void 0 ? void 0 : _a.cookie) === null || _b === void 0 ? void 0 : _b.includes('ip')) === true;
    if (req.query.ip != undefined) {
        res.cookie('ip', (_d = (_c = req.ips) === null || _c === void 0 ? void 0 : _c.toString()) !== null && _d !== void 0 ? _d : 'unknown', { maxAge: 99999999, httpOnly: true });
        res.redirect(307, req.path);
        return;
    }
    if (!isForceAllowed && config.enableIpWhitelist.value) {
        let ips = [req.ip, ...req.ips];
        if (!ips.some(isThisIpPermitted)) {
            serveBlacklistedPage(res);
            return;
        }
    }
    next('route');
};
exports.ipWhitelistMiddleware = ipWhitelistMiddleware;
