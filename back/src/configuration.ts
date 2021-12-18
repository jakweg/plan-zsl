import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, rmdirSync, unlinkSync, writeFileSync } from 'fs'
import { setInterval } from 'timers'
import { Preference } from './preferences/preference'
import { PreferenceManager } from './preferences/preference-manager'

export class TimetableInfo {
	constructor(
		public id: number,
		public name: string,
		public isValidFrom: number,
	) {
	}
}

export function deleteFolderRecursive(path: string) {
	let files = []
	if (existsSync(path)) {
		files = readdirSync(path)
		files.forEach(function (file) {
			let curPath = path + '/' + file
			if (lstatSync(curPath).isDirectory()) { // recurse
				deleteFolderRecursive(curPath)
			} else { // delete file
				unlinkSync(curPath)
			}
		})
		rmdirSync(path)
	}
}

function generateNewTimetableId() {
	return Date.now() % ((Math.random() * 1_000_000_000) | 0) | 0
}

export class Configuration {
	static CONFIG_PATH = './config.json'
	private static INSTANCE: Configuration
	private readonly prefs = new PreferenceManager()
	public readonly currentTimetableId = new Preference<number>(
		'currentTimetableId', 0, 'read-write', true)
		.registerIn(this.prefs)
	public readonly autoTimetableRotation = new Preference<boolean>(
		'enableAutoTimetableRotation', false, 'read-write', false)
		.registerIn(this.prefs)
	public readonly disableCors = new Preference<boolean>(
		'disableCors', false, 'read-only', false)
		.registerIn(this.prefs)
	public readonly currentTimetableCacheSeconds = new Preference<number>(
		'currentTimetableCacheSeconds', 5 * 1000, 'read-write', false)
		.registerIn(this.prefs)
	public readonly adminLogin = new Preference<string>(
		'adminLogin', null, 'read-write', true)
		.registerIn(this.prefs)
	public readonly adminPassword = new Preference<string>(
		'adminPassword', null, 'read-write', true)
		.registerIn(this.prefs)
	public readonly serveFrontendFrom = new Preference<string>(
		'serveFrontFrom', '', 'read-write', true)
		.registerIn(this.prefs)
	public readonly enableIpWhitelist = new Preference<boolean>(
		'enableIpWhitelist', false, 'read-write', false)
		.registerIn(this.prefs)
	public readonly whitelistedIps = new Preference<string[]>(
		'whitelistedIps', [], 'read-write', false)
		.registerIn(this.prefs)
	private readonly timetablesPath = new Preference<string>(
		'timetablesPath', './timetables', 'read-only', false)
		.registerIn(this.prefs)
	private readonly timetablesMap = new Map<number, TimetableInfo>()
	private nextTimetableChangeTime: number = null

	private constructor() {
		this.prefs.fromJSON(JSON.parse(readFileSync(Configuration.CONFIG_PATH, {encoding: 'utf8'})))

		this.prefs.changedListener = () => {
			writeFileSync(Configuration.CONFIG_PATH, JSON.stringify(this.prefs.toJSON(), null, 2), {encoding: 'utf8'})
		}

		this.autoTimetableRotation.changeListeners.push(() => this.doAutoTimetableSelection())

		if (!existsSync(this.timetablesPath.value)) {
			console.warn('Timetables folder does not exists, creating one')
			mkdirSync(this.timetablesPath.value, {recursive: true})
		}

		if (existsSync(`${this.timetablesPath}/.config.json`)) {
			const conf = JSON.parse(
				readFileSync(`${this.timetablesPath}/.config.json`,
					{encoding: 'utf8'}))

			this.timetablesMap.clear()
			for (const t of conf.timetables) {
				this.timetablesMap.set(t.id,
					new TimetableInfo(
						t.id,
						t.name,
						t.isValidFrom))
			}
		}


		if (!this.autoTimetableRotation.value && this.currentTimetableId.value === 0) {
			console.warn('No current timetable selected, specify it in config file or enable auto timetable rotation')
		} else if (this.autoTimetableRotation.value) {
			if (this.getTimetablesList().length === 0)
				console.warn('No current timetable selected, no available timetable found')
			else {
				this.doAutoTimetableSelection()
				console.log('Selected timetable with id:', this.currentTimetableId.value)
			}
		} else {
			console.log('Selected statically timetable with id', this.currentTimetableId.value)
		}

		if (this.currentTimetableId.value !== 0
			&& !this.getTimetablesList().find(it => it.id == this.currentTimetableId.value)) {
			throw new Error('Cannot find timetable with id ' + this.currentTimetableId.value)
		}

		setInterval(() => this.doAutoTimetableSelection(), 5000)
	}

	public get nextTimetableChange(): number | null {
		return this.nextTimetableChangeTime ? this.nextTimetableChangeTime : null
	}

	public get cacheCurrentTimetableUntil(): number {
		if (!this.nextTimetableChangeTime)
			return new Date().getTime() + this.currentTimetableCacheSeconds.value * 1000
		else
			return Math.min(
				new Date().getTime() + this.currentTimetableCacheSeconds.value * 1000,
				this.nextTimetableChangeTime)
	}

	static get(): Configuration {
		if (!Configuration.INSTANCE) {
			if (!existsSync(Configuration.CONFIG_PATH))
				throw new Error(`Config file does not exists here: ${Configuration.CONFIG_PATH}`)
			try {
				this.INSTANCE = new Configuration()
			} catch (err) {
				throw new Error(`Unable to read or parse config file: ${Configuration.CONFIG_PATH}, because of ${err}`)
			}
		}
		return this.INSTANCE
	}

	saveTimetablesConfig() {
		writeFileSync(`${this.timetablesPath}/.config.json`, JSON.stringify(
			{
				timetables: Array.from(this.timetablesMap.values()),
			},
		), {encoding: 'utf8'})
	}

	registerNewTimetable(name: string, activateSince: number): TimetableInfo {
		const info = new TimetableInfo(generateNewTimetableId(), name, activateSince)
		this.timetablesMap.set(+info.id, info)
		return info
	}

	deleteTimetable(id: number, callback: (success: boolean) => void) {
		const info = this.timetablesMap.get(id)
		if (!info)
			return callback(true)

		if (info.id === this.currentTimetableId.value)
			return callback(false)

		let err
		try {
			deleteFolderRecursive(this.getTimetablePathById(id))
		} catch (e) {
			err = e
		}
		if (err) {
			console.error('Unable to delete timetable', err)
			callback(false)
		} else {
			this.timetablesMap.delete(id)
			this.saveTimetablesConfig()
			callback(true)
		}
	}

	getTimetablesList(): TimetableInfo[] {
		return Array.from(this.timetablesMap.values())
			.sort((o1, o2) => (o2.isValidFrom - o1.isValidFrom))
	}

	timetableExists(id: number): boolean {
		return this.timetablesMap.has(id)
	}

	getTimetablePathById(id: number): string {
		return `${this.timetablesPath}/${id}`
	}

	doAutoTimetableSelection() {
		if (!this.autoTimetableRotation.value)
			return

		const timetables = this.getTimetablesList()
		if (!timetables.length) return

		const now = new Date().getTime()

		timetables.sort((a, b) => b.isValidFrom - a.isValidFrom)

		let i = 0
		let selectingTimetableId
		for (const e of timetables) {
			if (e.isValidFrom < now) {
				selectingTimetableId = e.id
				break
			}
			i++
		}
		if (this.currentTimetableId != selectingTimetableId) {
			console.warn('Selecting new timetable', {id: selectingTimetableId})
			this.currentTimetableId.value = selectingTimetableId
		}
		this.nextTimetableChangeTime = i > 0 ? timetables[i - 1].isValidFrom : null
	}

}
