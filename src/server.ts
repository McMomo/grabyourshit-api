import express from 'express'
import cors from 'cors'

import stationsRouter from './routes/stations'

const app = express()
const PORT = process.env.PORT || 8080

app.use(express.json())

app.use(cors())

app.use('/stations', stationsRouter)

app.listen(PORT, () => console.info(`Server running on ${PORT}`))