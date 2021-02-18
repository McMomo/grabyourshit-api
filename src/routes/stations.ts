import { Router } from 'express'

import { getStations, getStation, toggleStation } from '../controller'


const router = Router()

router.get('/', async (req, res) => {
	await getStations()
		.then((value) => res.json(value))
		.catch((err) => res.status(500).json({ message: err.message }))
})

router.get('/:id', getStation, async (req: any, res: any) => {
	res.json(res.station)
})

router.patch('/:id/isFilled', async (req: any, res: any) => {
	toggleStation(req, res)
})

module.exports = router

export default router