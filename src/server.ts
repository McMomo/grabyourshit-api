import express from 'express'
import cors from 'cors'

import jwt from 'express-jwt'
import jwksRsa from 'jwks-rsa'
import authConfig from './auth_config.json'

import stationsRouter from './routes/stations'

const checkJwt = jwt({
	secret: jwksRsa.expressJwtSecret({
		cache:true,
		rateLimit: true,
		jwksRequestsPerMinute: 5,
		jwksUri:  `https://${authConfig.domain}/.well-known/jwks.json`
	}),

	audience: authConfig.audience,
	issuer: `https://${authConfig.domain}/`,
	algorithms: ["RS256"]
})

const app = express()
const PORT = process.env.PORT || 8080

app.use(express.json())

app.use(cors())

app.use('/stations', stationsRouter)

app.get('/secret', checkJwt, (req, res) => {
	res.send({
		msg: 'Your access token was successfully validated!'
	})
})

app.use((err: any, req: any, res: any, next: Function) => {
  if (err.name === "UnauthorizedError") {
    return res.status(401).send({ msg: "Invalid token" });
  }

  next(err, req, res);
});

app.listen(PORT, () => console.info(`Server running on ${PORT}`))