import * as bodyParser from 'body-parser'
import express from 'express'


// warning: body parser breaks incoming form
export const POST_DATA_HANDLER = bodyParser.json({
	limit: '2MB',
	type: '*/*',
})

export function haltWithReason(res: express.Response, status: number, reason: string) {
	res.type('application/json')
		.status(status)
		.send({reason})
}
