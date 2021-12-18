import { Configuration } from '../configuration'

function getNetworkPartOfIp(ip: string, networkPrefix: number) {
	return ip
		.split('/')[0]
		.split('.')
		.map(e => (+e + 256)
			.toString(2)
			.substr(1))
		.join('')
		.substr(0, networkPrefix)
}

const isIpInSubnet = (ip: string, subnet: string): boolean => {
	const networkPrefix = +subnet.substr(subnet.indexOf('/') + 1)
	if (isNaN(networkPrefix))
		return false

	const networkPartOfIp = getNetworkPartOfIp(ip, networkPrefix)
	const networkPartOfSubnet = getNetworkPartOfIp(subnet, networkPrefix)

	return networkPartOfIp === networkPartOfSubnet
}

const isThisIpPermitted = (ip: string): boolean => {
	const config = Configuration.get()
	const whitelisted: string[] = config.whitelistedIps.value

	return whitelisted.some(w => isIpInSubnet(ip, w))
}

function serveBlacklistedPage(res) {
	const config = Configuration.get()

	res.sendFile(config.serveFrontendFrom.value + '/assets/non-whitelisted-ip.html', {root: '.'}, (err) => {
		if (err) res.end('no access')
	})
}

export const ipWhitelistMiddleware = (req, res, next) => {
	const config = Configuration.get()
	let isForceAllowed = req.headers?.cookie?.includes('ip') === true
	if (req.query.ip != undefined) {
		res.cookie('ip', req.ips?.toString() ?? 'unknown', {maxAge: 99999999, httpOnly: true})
		res.redirect(307, req.path)
		return
	}

	if (!isForceAllowed && config.enableIpWhitelist.value) {
		let ips: string[] = req.ips

		if (!ips.some(isThisIpPermitted)) {
			serveBlacklistedPage(res)
			return
		}
	}
	next('route')
}
