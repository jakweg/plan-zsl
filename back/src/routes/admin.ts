import express, { Express } from 'express'
import { File, IncomingForm } from 'formidable'
import { readFile } from 'fs'
import { TextDecoder } from 'text-encoding'
import { parseString as parseXmlString } from 'xml2js'
import { Configuration } from '../configuration'
import { TimetableDatabase } from '../timetable/timetable-database'
import { haltWithReason, POST_DATA_HANDLER } from './global'


export const initAdminRoutes = (app: Express) => {
	const config = Configuration.get()


	const generateCsfrToken = () => Array.from(new Array(64),
		() => (Math.random() * Math.pow(2, 31) | 0).toString(16)).join('')

	const adminRoute = express()
	app.use('/admin', adminRoute)

	adminRoute.get('/status', (req, res) => {
		res.send({
			signedIn: (<any>req).session.signedIn || false,
		})
	})

	adminRoute.post('/authorize', POST_DATA_HANDLER, (req, res) => {
		setTimeout(() => {
			if (req.body.login === config.adminLogin.value && req.body.password === config.adminPassword.value) {
				(<any>req).session.signedIn = true;
				(<any>req).session.login = req.body.login;
				(<any>req).session.csrfToken = generateCsfrToken()
				res.sendStatus(204)
			} else {
				if ((<any>req).session)
					(<any>req).session.destroy(() => {
					})
				res.sendStatus(401)
			}
		}, 1000)
	})

	adminRoute.all('/logout', (req, res) => {
		(<any>req).session.destroy(() => {
		})
		res.sendStatus(204)
	})


	const VERIFIED_USER_FILTER = (req: express.Request,
		res: express.Response,
		next: any) => {
		if (((<any>req).session && (<any>req).session.signedIn))
			next()
		else
			haltWithReason(res, 401, 'Unauthorized user')
	}

	const VERIFIED_USER_AND_CSRF_FILTER = (req: express.Request,
		res: express.Response,
		next: any) =>
		POST_DATA_HANDLER(req, res, () =>
			VERIFIED_USER_FILTER(req, res, () => {
				if (req.body.token && req.body.token === (<any>req).session.csrfToken) {
					(<any>req).session.csrfToken = generateCsfrToken()
					next()
				} else
					haltWithReason(res, 401, 'Invalid csrf token')
			}))


	adminRoute.get('/list-timetables', VERIFIED_USER_FILTER, (req, res) => {
		res.type('application/json')
			.send(config
				.getTimetablesList()
				.map(e => ({ ...e, active: e.id === config.currentTimetableId.value })))
	})

	adminRoute.get('/server-settings', VERIFIED_USER_FILTER, (req, res) => {
		const current = config.getTimetablesList().find(e => e.id === config.currentTimetableId.value)
		res.type('application/json')
			.send({
				token: (<any>req).session.csrfToken,
				currentName: current ? current.name : null,
				currentId: current ? current.id : null,
				rotationEnabled: config.autoTimetableRotation.value,
				timetableCacheDuration: config.currentTimetableCacheSeconds.value,
				useIpFilter: config.enableIpWhitelist.value,
				whitelistedIps: config.whitelistedIps.value
			})
	})

	adminRoute.post('/set-server-setting', VERIFIED_USER_AND_CSRF_FILTER, (req, res) => {
		const key = req.body.key
		const value = req.body.value
		if (!key || !value)
			return haltWithReason(res, 400, 'Invalid setting')

		switch (key) {
			case 'auto-rotation':
				switch (value) {
					case '1':
						config.autoTimetableRotation.value = true
						break
					case '0':
						config.autoTimetableRotation.value = false
						break
					default:
						return haltWithReason(res, 400, 'Invalid value')
				}
				break

			case 'use-ip-filter':
				switch (value) {
					case '1':
						config.enableIpWhitelist.value = true
						break
					case '0':
						config.enableIpWhitelist.value = false
						break
					default:
						return haltWithReason(res, 400, 'Invalid value')
				}
				break

			case 'whitelisted-ips':
				// we don't check validity of sent ip networks
				//  just basics so we don't crash backend...
				// we trust admin page
				const isValid = Array.isArray(value) && (value as any[]).every(e => typeof e === 'string' && e.length > 0)
				if (isValid)
					config.whitelistedIps.value = value
				else
					return haltWithReason(res, 400, 'Invalid value')
				break

			case 'timetable-info-cache-duration':
				if (isNaN(+value) || +value < 0)
					return haltWithReason(res, 400, 'Invalid value')
				config.currentTimetableCacheSeconds.value = +value
				break
		}

		res.sendStatus(204)
	})


	adminRoute.get('/timetable-info/:id', VERIFIED_USER_FILTER, (req, res) => {
		const id = +req.params.id
		const current = config.getTimetablesList().find(e => e.id === id)
		if (!current) return haltWithReason(res, 400, 'Plan not found')
		res.type('application/json')
			.send({
				selected: config.currentTimetableId.value === id,
				name: current.name,
				id: current.id,
				isValidFrom: current.isValidFrom,
				autoEnabled: config.autoTimetableRotation.value,
				token: (<any>req).session.csrfToken,
			})
	})

	adminRoute.post('/update-timetable-info/:id', VERIFIED_USER_AND_CSRF_FILTER, (req, res) => {
		const id = +req.params.id
		const current = config.getTimetablesList().find(e => e.id === id)
		if (!current) return haltWithReason(res, 400, 'Plan not found')

		if (req.body.name && req.body.name.length > 3 && req.body.name.length < 40)
			current.name = req.body.name

		if (req.body.date && req.body.date > 0)
			current.isValidFrom = req.body.date

		config.doAutoTimetableSelection()
		config.saveTimetablesConfig()
		res.sendStatus(204)
	})


	adminRoute.get('/select-timetable/:id', VERIFIED_USER_FILTER, (req, res) => {
		const id = +req.params.id
		if (config.autoTimetableRotation.value)
			return haltWithReason(res, 405, 'Auto rotation is enabled!')

		if (!config.timetableExists(id))
			return haltWithReason(res, 400, 'Plan not found')

		config.currentTimetableId.value = id

		res.sendStatus(204)
	})

	adminRoute.get('/my-ip', VERIFIED_USER_FILTER, (req, res) => {
		const ips = [req.ip, ...req.ips]
		res.send(ips)
	})

	adminRoute.post('/delete-timetable/:id', VERIFIED_USER_AND_CSRF_FILTER, (req, res) => {
		const id = +req.params.id

		if (!config.timetableExists(id))
			return haltWithReason(res, 404, 'Plan not found')

		config.deleteTimetable(id, ok => {
			res.sendStatus(ok ? 204 : 400)
		})
	})


	adminRoute.post('/new-timetable', VERIFIED_USER_FILTER, (req, res) => {
		const form = new IncomingForm()
		// form.maxFileSize = 50 * 1024 * 1024

		form.parse(req, (err, fields, files) => {
			if (err)
				return haltWithReason(res, 400, err.message)

			const name = (fields.name || '').toString().trim()
			if (!name || name.length < 5 || name.length > 40)
				return haltWithReason(res, 400, 'Invalid name')

			const activeSinceTimestamp = new Date(
				isNaN(+fields.isValidFrom) ? fields.isValidFrom.toString() : +files.isValidFrom).getTime()
			if (!activeSinceTimestamp)
				return haltWithReason(res, 400, 'Invalid date')

			const file = files.file as File
			if (!file)
				return haltWithReason(res, 406, 'File not given')

			readFile(file.filepath, (err, data) => {
				if (err)
					return haltWithReason(res, 500, 'Unable to read tmp file')

				let decoded = ''
				const decoder = new TextDecoder('windows-1250')
				try {
					decoded = decoder.decode(data, { fatal: true })
				} catch (err) {
					return haltWithReason(res, 422, 'Unable to decode xml file')
				}

				parseXmlString(decoded, (err, result) => {
					if (err)
						return haltWithReason(res, 400, 'Unable to parse XML file')

					try {
						const timetable = TimetableDatabase.fromXml(result)
						const info = config.registerNewTimetable(name, activeSinceTimestamp)

						timetable.dumpSelfIntoFolder(config.getTimetablePathById(info.id))
						config.saveTimetablesConfig()

						res.status(201).send({ newTimetableId: info.id })
					} catch (err) {
						console.error(err)

						return haltWithReason(res, 400, 'An error was thrown while handling timetable')
					}
				})
			})
		})
	})
}
