import { Station, Helper } from './types'
import { Firestore } from '@google-cloud/firestore'

let db: Firestore;

if (process.env. npm_lifecycle_event === 'dev'){

	db = new Firestore({
		projectId: 'grabyourshit',
		keyFilename: './grabyourshit-a553dc076e1a.json',
	})

} else {
	db = new Firestore()
}


const getStations = async () => { 
	const collection = await db.collection('station').get()
	const stations: Array<any> = []
	collection.forEach((doc: any) => {
			let docObj = { 'id':doc.id, ...doc.data()}
			stations.push(docObj)
		});
	return stations
}

const getStation = async (req: any, res: any, next: Function) => {
	await db.collection('station').doc(req.params.id).get()
		.then((value) => {
			if (!value){
				return res.status(404).json({ message: 'Cant find station'})
			}
			res.station = value.data()
			next()
		})
		.catch((err) => (res.status(500).json({ message: err.message })))
}

const setStationStatus = async (req: any, res: any) => {
	const stationRef =  db.collection('station').doc(req.params.id)

	try {
		let station: any = undefined;
		await stationRef.get()
			.then((value) => {
				if (!value){
					return res.status(404).json({ message: 'Cant find station'})
				}
				station = value?.data()
			})


		//only change status if its not the same
		if (req.query.fill !== station?.isFilled){
			stationRef.update({
				isFilled: req.query.fill,
				filledLastTime:(req.query.fill? Date.now(): station.filledLastTime)
			})
			res.status(200).json({ message: 'Field has been toggled ', hasUpdated: true})
		} else {
			res.status(200).json({ message: 'Please use a different status', hasUpdated: false})
		}
	} catch (err) {
		res.status(500).json({ message: err.message })
	}
}

const whitelist = ['localhost:5000', 'grabyourshit.de']
const corsOptions = {
  origin: function (origin: any, callback: any) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}

export { getStations, getStation, corsOptions, setStationStatus }