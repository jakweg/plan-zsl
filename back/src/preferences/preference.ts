import { PreferenceManager } from './preference-manager'

export type PreferenceMode = 'read-write' | 'write-only' | 'read-only'

export type PreferenceKey = string

export type PreferenceType = string | number | boolean | string[]

export type PreferenceValidator<T> = (newValue: T) => boolean

export type PreferenceChangedListener<T> = (newValue: T) => void

export class Preference<T extends PreferenceType> {
	public validator: PreferenceValidator<T> | undefined
	public readonly changeListeners: PreferenceChangedListener<T>[] = []

	public constructor(
		public readonly key: PreferenceKey,
		public readonly defaultValue: T,
		public readonly mode: PreferenceMode = 'read-write',
		public readonly canBeNull: boolean = true,
	) {
		this._value = defaultValue
	}

	protected _value: T = undefined

	public get value(): T {
		if (!this.canRead)
			throw new Error(`Can't read property ${this.key}, because it's write-only`)
		return this._value
	}

	public set value(newValue: T | null) {
		if (!this.canChange)
			throw new Error(`Can't read property ${this.key}, because it's read-only`)

		this.validate(newValue)

		this._value = newValue
		for (const l of this.changeListeners) {
			try {
				l(newValue);
			} catch (e) {
				console.error(`Change listener of property ${this.key} thrown exception!`, e)
			}
		}
	}

	private validate(newValue: T): void {
		if (!this.canBeNull && newValue === null)
			throw new Error(`Attempt to set ${this.key} setting to null, while it can not be null`)

		if (this.validator) {
			let error
			try {
				if (!this.validator(newValue))
					error = new Error('Value validator returned false')
			} catch (e) {
				error = e
			}
			if (error)
				throw new Error('Unable to set preference: ' + error.message)
		}
	}

	public get canRead(): boolean {
		return this.mode !== 'write-only'
	}

	public get canChange(): boolean {
		return this.mode !== 'read-only'
	}

	public initialize(value: any) {
		if (value === undefined) {
			if (this.defaultValue === null && !this.canBeNull)
				throw new Error(`Property ${this.key} is required, but undefined`)
			this._value = this.defaultValue
			return;
		}

		if (value === null) {
			if (!this.canBeNull)
				throw new Error(`Property ${this.key} cannot be null`)
		}

		if (this.defaultValue !== null && typeof this.defaultValue !== typeof value)
			throw new Error(`Unable to set property, required type ${typeof this.defaultValue}, but got ${typeof value}`)

		this.validate(value)

		this._value = value
	}

	public toString = () : string => {
		return this.value.toString()
	}

	public registerIn(store: PreferenceManager): Preference<T> {
		store.register(this);
		return this;
	}
}
