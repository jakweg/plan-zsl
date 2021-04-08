"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Preference = void 0;
class Preference {
    constructor(key, defaultValue, mode = 'read-write', canBeNull = true) {
        this.key = key;
        this.defaultValue = defaultValue;
        this.mode = mode;
        this.canBeNull = canBeNull;
        this.changeListeners = [];
        this._value = undefined;
        this.toString = () => {
            return this.value.toString();
        };
        this._value = defaultValue;
    }
    get value() {
        if (!this.canRead)
            throw new Error(`Can't read property ${this.key}, because it's write-only`);
        return this._value;
    }
    set value(newValue) {
        if (!this.canChange)
            throw new Error(`Can't read property ${this.key}, because it's read-only`);
        this.validate(newValue);
        this._value = newValue;
        for (const l of this.changeListeners) {
            try {
                l(newValue);
            }
            catch (e) {
                console.error(`Change listener of property ${this.key} thrown exception!`, e);
            }
        }
    }
    validate(newValue) {
        if (!this.canBeNull && newValue === null)
            throw new Error(`Attempt to set ${this.key} setting to null, while it can not be null`);
        if (this.validator) {
            let error;
            try {
                if (!this.validator(newValue))
                    error = new Error('Value validator returned false');
            }
            catch (e) {
                error = e;
            }
            if (error)
                throw new Error('Unable to set preference: ' + error.message);
        }
    }
    get canRead() {
        return this.mode !== 'write-only';
    }
    get canChange() {
        return this.mode !== 'read-only';
    }
    initialize(value) {
        if (value === undefined) {
            if (this.defaultValue === null && !this.canBeNull)
                throw new Error(`Property ${this.key} is required, but undefined`);
            this._value = this.defaultValue;
            return;
        }
        if (value === null) {
            if (!this.canBeNull)
                throw new Error(`Property ${this.key} cannot be null`);
        }
        if (this.defaultValue !== null && typeof this.defaultValue !== typeof value)
            throw new Error(`Unable to set property, required type ${typeof this.defaultValue}, but got ${typeof value}`);
        this.validate(value);
        this._value = value;
    }
    registerIn(store) {
        store.register(this);
        return this;
    }
}
exports.Preference = Preference;
