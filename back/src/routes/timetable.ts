import express, { Express } from 'express'
import { readFile } from 'fs'
import { Configuration } from '../configuration'
import { haltWithReason } from './global'


export const initTimetableRoutes = (app: Express) => {
	const config = Configuration.get()


	app.get('/timetable/list', (req, res) => {
		res.type('application/json')
			.send(config
				.getTimetablesList()
				.map(
					it => ({
						id: +it.id,
						name: it.name,
						isValidFrom: it.isValidFrom
					}))
				.sort((a, b) => a.isValidFrom - b.isValidFrom),
			)
	})

	app.get('/timetable/status', (req, res) => {
		res.type('application/json')
		res.send({
			currentTimetableId: config.currentTimetableId.value,
			nextChange: config.nextTimetableChange,
			cacheCurrentUntil: config.cacheCurrentTimetableUntil,
		})
	})


	const timetableRoute = express()
	app.get('/timetable/:timetableId/*', (req, res) => {
		let id = +req.params.timetableId

		if (isNaN(id))
			return haltWithReason(res, 400, 'Invalid timetable id')


		if (id === 0) {
			id = config.currentTimetableId.value
			// @ts-ignore
			req.query.selectedCurrent = true
		}

		if (!config.timetableExists(id))
			return haltWithReason(res, 404, 'Timetable with this id not found')

		// @ts-ignore
		req.query.timetableId = id

		req.next('route')
	})
	app.use('/timetable/:timetableId', timetableRoute)


	timetableRoute.get('/list', (req, res) => {
		const path = config.getTimetablePathById(+req.query.timetableId)
		readFile(path + '/summary.json', {encoding: 'utf8'}, (err, data) => {
			if (err)
				return haltWithReason(res, 500, 'unable to read file')

			res.type('application/json')
			// TODO increase cache?
			// TODO set cache up to the time of replacing current timetable
			res.set('Cache-Control', 'max-age=' + (req.query.selectedCurrent ? 3000 : 10 * 60 * 60 * 7))
			res.send(data)
		})
	})

	timetableRoute.get('/get/:short', (req, res) => {
		const path = config.getTimetablePathById(+req.query.timetableId)
		const short = req.params.short.trim().toLowerCase()
		if (short.includes('..')) return haltWithReason(res, 404, 'Plan not found')
		readFile(path + '/plans/' + short, {encoding: 'utf8'}, (err, data) => {
			if (err)
				return haltWithReason(res, 404, 'Plan not found')

			res.type('application/json')
			// TODO increase cache?
			// TODO set cache up to the time of replacing current timetable
			res.set('Cache-Control', 'max-age=' + (req.query.selectedCurrent ? 3000 : 10 * 60 * 60 * 7))
			res.send(data)
		})
	})


}
