import { Router } from 'express'

import Controller from '../controller'


const router = Router()
const controller = Controller.getInstance()

router.get('/', async (req, res) => {
	await controller.getStations()
		.then((value) => res.json(value))
		.catch((err) => res.status(500).json({ message: err.message }))
})

router.get('/:id', async (req: any, res: any) => {
	await controller.getStation(req, res)
		.then((value) => res.json(res.station))
		.catch((err) => res.status(500).json({ message: err.message }))
})

router.patch('/:id/:fill', async (req: any, res: any) => {
	controller.setStationStatus(req, res)
})

export default router