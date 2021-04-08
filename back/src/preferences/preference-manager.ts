import { Preference, PreferenceKey } from './preference'

export type AnyPreferenceChangedListener = (mgr: PreferenceManager) => void

export class PreferenceManager {
	private readonly registered: Map<PreferenceKey, Preference<any>> = new Map<PreferenceKey, Preference<any>>()

	public register(pref: Preference<any>): PreferenceManager {
		if (this.registered.has(pref.key))
			throw new Error(`Preference with key ${pref.key} is already registered`)

		this.registered.set(pref.key, pref)
		pref.changeListeners.push(() => this.onChanged())

		return this
	}

	private onChanged() {
		if (this.changedListener)
			this.changedListener(this);
	}

	public fromJSON(obj: any) {
		for (let key in obj) {
			if (this.registered.has(key))
				this.registered.get(key).initialize(obj[key])
		}
	}

	public toJSON(): any {
		const obj = {}

		for (const [key, val] of this.registered.entries()) {
			if (val.canRead)
				obj[key] = val.value
		}

		return obj
	}

	public changedListener:AnyPreferenceChangedListener | undefined
}
