import express from 'express'
import path from 'path'
import fs from 'fs'

const app = express()
const DATA_FILE = path.join(process.cwd(), 'data.json')

const initData = () => {
  if (!fs.existsSync(DATA_FILE)) {
    const defaultData = {
      items: [
        { id: 1, name: '张三', email: 'zhangsan@example.com', phone: '13800138001', address: '北京市朝阳区', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 2, name: '李四', email: 'lisi@example.com', phone: '13800138002', address: '上海市浦东新区', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 3, name: '王五', email: 'wangwu@example.com', phone: '13800138003', address: '广州市天河区', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      ],
      nextId: 4
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2))
  }
}

const readData = () => {
  const content = fs.readFileSync(DATA_FILE, 'utf-8')
  return JSON.parse(content)
}

const writeData = (data) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
}

initData()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/api/items', (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 10
  const skip = (page - 1) * limit
  
  const data = readData()
  const total = data.items.length
  const items = [...data.items].reverse().slice(skip, skip + limit)
  
  res.json({ items, total, page, limit })
})

app.get('/api/items/:id', (req, res) => {
  const data = readData()
  const item = data.items.find(item => item.id === parseInt(req.params.id))
  if (!item) return res.status(404).json({ error: 'Item not found' })
  res.json(item)
})

app.post('/api/items', (req, res) => {
  const data = readData()
  const newItem = {
    id: data.nextId++,
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  data.items.push(newItem)
  writeData(data)
  res.json(newItem)
})

app.put('/api/items/:id', (req, res) => {
  const data = readData()
  const index = data.items.findIndex(item => item.id === parseInt(req.params.id))
  if (index === -1) return res.status(404).json({ error: 'Item not found' })
  
  data.items[index] = {
    ...data.items[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  }
  writeData(data)
  res.json(data.items[index])
})

app.delete('/api/items/:id', (req, res) => {
  const data = readData()
  data.items = data.items.filter(item => item.id !== parseInt(req.params.id))
  writeData(data)
  res.json({ success: true })
})

app.post('/api/items/batch', (req, res) => {
  const data = readData()
  const newItems = req.body.map(item => ({
    id: data.nextId++,
    ...item,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }))
  data.items.push(...newItems)
  writeData(data)
  res.json({ count: newItems.length })
})

export default app