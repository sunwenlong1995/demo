import { createServer } from 'http'
import app from '../api/index.js'
import path from 'path'

const server = createServer(app)
const PORT = process.env.PORT || 3000

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    next()
  } else {
    res.sendFile(path.join(process.cwd(), 'dist', 'index.html'))
  }
})

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})