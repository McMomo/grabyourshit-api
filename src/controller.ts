import { Station, Helper } from './types'
import { Firestore } from '@google-cloud/firestore'
import { SecretManagerServiceClient } from '@google-cloud/secret-manager'
import nodemailer from 'nodemailer'
import { emailText, emailHTML } from './mailerContent' 


class Controller {
	private static instance: Controller
	db: Firestore;
	transporter: any;
	secret: {email?:string, password?: string};

	constructor() {
		if (process.env. npm_lifecycle_event === 'dev'){

		this.db = new Firestore({
			projectId: 'grabyourshit',
			keyFilename: './grabyourshit-a553dc076e1a.json'
		})

		} else {
			this.db = new Firestore()
		}

		this.transporter = {}

		this.initMailer()
	}

	static getInstance(){
	    if (!Controller.instance) {
		    Controller.instance = new Controller();
	    }
	    return Controller.instance;
	}

	async initMailer(){
		const secretName = 'projects/449655753817/secrets/email_empty_login/versions/latest'
		const secretClient = new SecretManagerServiceClient()

		async function accessSecretVersion(){
			const [version] = await secretClient.accessSecretVersion({
		    	name: secretName,
		  	});

			// Extract the payload as a string.
			const payload = version?.payload?.data?.toString();

			if (payload){
				return JSON.parse(payload);
			} 
		}

		await accessSecretVersion()
			.then((value) => {
				this.secret = value
			})
			.catch((err) => console.error(err))

		this.transporter = nodemailer.createTransport({
			host: 'smtp.ionos.de',
			port: 465,
			secure: true,
			auth: {
		    	user: this.secret?.email,
				pass: this.secret?.password
		  	}
		})

		this.transporter.verify(function(error: any, success: any) {
		  if (error) {
		    console.error(error);
		  } else {
		    console.info("Server is ready to take our messages");
		  }
		});
	}
	
	async getHelpers(station: Station){
		const mails: any[] = []

		for (const helper of station.responsible){
			await helper.get()
				.then((value: any) => {
					mails.push(value.data())
			})	
		}
		return mails
	}

	async sendMail(id: string, station: Station){

		const helper = await this.getHelpers(station)

		const toMails = helper.map((helper: any) => helper.email)

		const to = toMails.join(',')

		const mailOptions = {
			from: `grabyourshit ${this.secret?.email}`,
			to: to,
			subject: 'grabyourshit - eine Station wurde als leer gemeldet',
			text: emailText(id, station.nearestAddress),
			html: emailHTML(id, station.nearestAddress)
		}

		try {
			this.transporter.sendMail(mailOptions, (err: any) => {
				if (err) {
					console.error('Server did not send message')
				}
			})
		} catch (err) {
			console.error(err)
		}
	}

	async getStations(){ 
		const collection = await this.db.collection('station').get()
		const stations: Array<any> = []
		collection.forEach((doc: any) => {
				let docObj = { 'id':doc.id, ...doc.data(), responsible:[]}
				stations.push(docObj)
			});
		return stations
	}

	async getStation (req: any, res: any){
		await this.db.collection('station').doc(req.params.id).get()
			.then((value) => {
				if (!value){
					return res.status(404).json({ message: 'Cant find station'})
				}
				res.station = {...value.data(), responsible:[]}
			})
			.catch((err) => (res.status(500).json({ message: err.message })))
	}


	async setStationStatus(req: any, res: any) {
		const stationRef =  this.db.collection('station').doc(req.params.id)
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
					this.sendMail(req.params.id, station)
				}

				res.status(200).json({ message: 'Field has been toggled ', hasUpdated: true})
			} else {
				res.status(200).json({ message: 'Please use a different status', hasUpdated: false})
			}
		} catch (err) {
			res.status(500).json({ message: err.message })
		}
	}

	getCorsOptions() {
		const whitelist = ['localhost:5000', 'grabyourshit.de']
		return {
		  origin: function (origin: any, callback: any) {
		    if (whitelist.indexOf(origin) !== -1) {
		      callback(null, true)
		    } else {
		      callback(new Error('Not allowed by CORS'))
		    }
		  }
		}
	}
}

export default Controller