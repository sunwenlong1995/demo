const http = require('http')
const url = require('url')
const fs = require('fs')
const path = require('path')

const DATA_FILE = path.join(__dirname, '../data.json')

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

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
}

const handleApiRequest = (req, res, parsedUrl) => {
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }

  const pathname = parsedUrl.pathname
  const query = parsedUrl.query

  if (req.method === 'GET' && pathname === '/api/items') {
    const page = parseInt(query?.page) || 1
    const limit = parseInt(query?.limit) || 10
    const skip = (page - 1) * limit
    
    const data = readData()
    const total = data.items.length
    const items = [...data.items].reverse().slice(skip, skip + limit)
    
    res.writeHead(200)
    res.end(JSON.stringify({ items, total, page, limit }))
    return
  }

  if (req.method === 'GET' && pathname.match(/^\/api\/items\/(\d+)$/)) {
    const id = parseInt(pathname.split('/')[3])
    const data = readData()
    const item = data.items.find(item => item.id === id)
    if (!item) {
      res.writeHead(404)
      res.end(JSON.stringify({ error: 'Item not found' }))
      return
    }
    res.writeHead(200)
    res.end(JSON.stringify(item))
    return
  }

  if (req.method === 'POST' && pathname === '/api/items') {
    let body = ''
    req.on('data', chunk => body += chunk)
    req.on('end', () => {
      const data = readData()
      const bodyObj = JSON.parse(body)
      const newItem = {
        id: data.nextId++,
        ...bodyObj,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      data.items.push(newItem)
      writeData(data)
      res.writeHead(200)
      res.end(JSON.stringify(newItem))
    })
    return
  }

  if (req.method === 'PUT' && pathname.match(/^\/api\/items\/(\d+)$/)) {
    const id = parseInt(pathname.split('/')[3])
    let body = ''
    req.on('data', chunk => body += chunk)
    req.on('end', () => {
      const data = readData()
      const index = data.items.findIndex(item => item.id === id)
      if (index === -1) {
        res.writeHead(404)
        res.end(JSON.stringify({ error: 'Item not found' }))
        return
      }
      data.items[index] = {
        ...data.items[index],
        ...JSON.parse(body),
        updatedAt: new Date().toISOString()
      }
      writeData(data)
      res.writeHead(200)
      res.end(JSON.stringify(data.items[index]))
    })
    return
  }

  if (req.method === 'DELETE' && pathname.match(/^\/api\/items\/(\d+)$/)) {
    const id = parseInt(pathname.split('/')[3])
    const data = readData()
    data.items = data.items.filter(item => item.id !== id)
    writeData(data)
    res.writeHead(200)
    res.end(JSON.stringify({ success: true }))
    return
  }

  if (req.method === 'POST' && pathname === '/api/items/batch') {
    let body = ''
    req.on('data', chunk => body += chunk)
    req.on('end', () => {
      const data = readData()
      const items = JSON.parse(body).map(item => ({
        id: data.nextId++,
        ...item,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }))
      data.items.push(...items)
      writeData(data)
      res.writeHead(200)
      res.end(JSON.stringify({ count: items.length }))
    })
    return
  }

  res.writeHead(404)
  res.end(JSON.stringify({ error: 'Not found' }))
}

const handleStaticRequest = (req, res, parsedUrl) => {
  const pathname = parsedUrl.pathname === '/' ? '/index.html' : parsedUrl.pathname
  const filePath = path.join(__dirname, '../dist', pathname)
  
  const ext = path.extname(filePath)
  const contentType = mimeTypes[ext] || 'application/octet-stream'

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        fs.readFile(path.join(__dirname, '../dist', 'index.html'), (err, content) => {
          if (err) {
            res.writeHead(500)
            res.end('Internal Server Error')
            return
          }
          res.writeHead(200, { 'Content-Type': 'text/html' })
          res.end(content, 'utf-8')
        })
      } else {
        res.writeHead(500)
        res.end('Internal Server Error')
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType })
      res.end(content, 'utf-8')
    }
  })
}

module.exports = (req, res) => {
  const parsedUrl = url.parse(req.url, true)
  const pathname = parsedUrl.pathname

  if (pathname.startsWith('/api')) {
    handleApiRequest(req, res, parsedUrl)
  } else {
    handleStaticRequest(req, res, parsedUrl)
  }
}