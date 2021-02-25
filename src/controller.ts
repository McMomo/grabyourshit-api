import { Station, Helper } from './types'
import { Firestore } from '@google-cloud/firestore'
import { SecretManagerServiceClient } from '@google-cloud/secret-manager'
import nodemailer from 'nodemailer'
import { emailText, emailHTML } from './mailerContent' 


let db: Firestore;

if (process.env. npm_lifecycle_event === 'dev'){

	db = new Firestore({
		projectId: 'grabyourshit',
		keyFilename: './grabyourshit-a553dc076e1a.json'
	})

} else {
	db = new Firestore()
}

const secretName = 'projects/449655753817/secrets/email_empty_login/versions/latest'
const secretClient = new SecretManagerServiceClient()

let secret: any = {}

async function accessSecretVersion(){
	const [version] = await secretClient.accessSecretVersion({
    	name: secretName,
  	});

	// Extract the payload as a string.
	const payload = version?.payload?.data?.toString();

	if (payload) secret = JSON.parse(payload);
}

accessSecretVersion()

let transporter = nodemailer.createTransport({
	host: 'smtp.ionos.de',
	port: 465,
	secure: true,
	auth: {
    	user: secret?._email,
		pass: secret?._password
  	}
})

transporter.verify(function(error, success) {
  if (error) {
    console.error(error);
  } else {
    console.info("Server is ready to take our messages");
  }
});

const getHelpers = async (station: Station) => {
	const mails: any[] = []

	for (const helper of station.responsible){
		await helper.get()
			.then((value: any) => {
				mails.push(value.data())
		})	
	}
	return mails
}

const sendMail = async (id: string, station: Station) => {

	const helper = await getHelpers(station)

	const toMails = helper.map((helper: any) => helper.email)

	const to = toMails.join(',')

	const mailOptions = {
		from: `grabyourshit ${secret._email}`,
		to: to,
		subject: 'grabyourshit - eine Station wurde als leer gemeldet',
		text: emailText(id, station.nearestAddress),
		html: emailHTML(id, station.nearestAddress)
	}

	transporter.sendMail(mailOptions, (err) => {
		if (err) {
			console.error('Server did not send message')
		}
	})
}

const getStations = async () => { 
	const collection = await db.collection('station').get()
	const stations: Array<any> = []
	collection.forEach((doc: any) => {
			let docObj = { 'id':doc.id, ...doc.data(), responsible:[]}
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
			res.station = {...value.data(), responsible:[]}
			next()
		})
		.catch((err) => (res.status(500).json({ message: err.message })))
}

const setStationStatus = async (req: any, res: any) => {
	const stationRef =  db.collection('station').doc(req.params.id)
	const fill = req.query.fill === 'true'

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
		if (fill !== station?.isFilled){
			stationRef.update({
				isFilled: fill,
				filledLastTime:(req.query.fill? Date.now(): station.filledLastTime)
			})

			//only send if station set to false
			if (station?.isFilled && !fill) {
				sendMail(req.params.id, station)
			}

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