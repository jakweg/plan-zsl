import express, { static as expressStatic } from 'express'
import session from 'express-session'
import { Configuration } from './configuration'
import { initAdminRoutes } from './routes/admin'
import { initTimetableRoutes } from './routes/timetable'

try {
	const config = Configuration.get()

	const port = +process.env.PORT || 8080
	const app = express()

	app.use(session({
		name: 'sid',
		secret: Array.from(new Array(16),
			() => (Math.random() * Math.pow(2, 31) | 0).toString(16)).join(''),
		resave: false,
		saveUninitialized: false,
		cookie: {
			maxAge: 15 * 60 * 1000,
			httpOnly: true,
			secure: false,
			path: '/',
		},
	}))

	if (config.disableCors.value) {
		app.use((req, res, next) => {
			res.set('Access-Control-Allow-Origin', req.header('origin') || 'http://localhost:4200')
			res.set('Access-Control-Allow-Credentials', 'true')

			next('route')
		})
		app.options('/*', (req, res) => {
			res.set('Access-Control-Max-Age', '600')
			res.set('Access-Control-Allow-Headers', 'Content-Type, Cookie')
			res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE')
			res.status(200).end()
		})
	}


	if (config.serveFrontendFrom.value) {
		console.info('Serving content from ' + config.serveFrontendFrom.value)
		console.info('Registering API at path /api ')

		const api = express()
		initTimetableRoutes(api)
		initAdminRoutes(api)
		app.use('/api', api)

		app.use('/assets', expressStatic(config.serveFrontendFrom.value + '/assets', {
			lastModified: true,
			cacheControl: true,
			dotfiles: 'ignore',
			etag: true,
			redirect: false,
			index: false,
			maxAge: 30 * 24 * 60 * 60 * 1000,
			immutable: true,
		}))

		app.use(expressStatic(config.serveFrontendFrom.value, {
			lastModified: true,
			cacheControl: true,
			dotfiles: 'ignore',
			etag: true,
			redirect: false,
			index: 'index.html',
			maxAge: 2 * 24 * 60 * 60 * 1000,
		}))

		app.get('*', (req, res) => res.sendFile('index.html', {
			maxAge: 2 * 24 * 60 * 60 * 1000,
			root: config.serveFrontendFrom.value,
		}))

	} else {
		console.info('Serving only API at / ')
		initTimetableRoutes(app)
		initAdminRoutes(app)
		app.all('*', (req, res) => res.status(404).end())
	}


	app.listen(port, '0.0.0.0', () => {
		return console.log(`server is listening on ${port}`)
	})

} catch (err) {
	console.error('Fatal error! Finishing application')
	console.error(err)
}
