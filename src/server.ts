import express from 'express'
import admin from 'firebase-admin'
import stationsRouter from './routes/stations'

const app = express()
const PORT = process.env.PORT || 8080

app.use(express.json())
app.use('/stations', stationsRouter)

app.listen(PORT, () => console.info(`Server running on ${PORT}`))