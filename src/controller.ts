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
			let docObj = {[doc.id]: doc.data()}
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

export { getStations, getStation }