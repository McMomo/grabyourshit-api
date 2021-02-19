import { Router } from 'express'

import { getStations, getStation, setStationStatus } from '../controller'


const router = Router()

router.get('/', async (req, res) => {
	await getStations()
		.then((value) => res.json(value))
		.catch((err) => res.status(500).json({ message: err.message }))
})

router.get('/:id', getStation, async (req: any, res: any) => {
	res.json(res.station)
})

router.patch('/:id', async (req: any, res: any) => {
	if (req.query.fill){
		setStationStatus(req, res)
	} else {
		res.status(500).json({ message: 'add valid queryparams' })
	}
})

module.exports = router

export default router