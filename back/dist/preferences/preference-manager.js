"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreferenceManager = void 0;
class PreferenceManager {
    constructor() {
        this.registered = new Map();
    }
    register(pref) {
        if (this.registered.has(pref.key))
            throw new Error(`Preference with key ${pref.key} is already registered`);
        this.registered.set(pref.key, pref);
        pref.changeListeners.push(() => this.onChanged());
        return this;
    }
    onChanged() {
        if (this.changedListener)
            this.changedListener(this);
    }
    fromJSON(obj) {
        for (let key in obj) {
            if (this.registered.has(key))
                this.registered.get(key).initialize(obj[key]);
        }
    }
    toJSON() {
        const obj = {};
        for (const [key, val] of this.registered.entries()) {
            if (val.canRead)
                obj[key] = val.value;
        }
        return obj;
    }
}
exports.PreferenceManager = PreferenceManager;
