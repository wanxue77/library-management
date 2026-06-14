const express = require('express')
const cors = require('cors')
const path = require('path')
const https = require('https')
const http = require('http')
const { initDB } = require('./db')

async function start() {
  await initDB()
  console.log('数据库初始化完成')

  const userRoutes = require('./routes/user')
  const bookRoutes = require('./routes/book')
  const borrowRoutes = require('./routes/borrow')
  const adminRoutes = require('./routes/admin')
  const uploadRoutes = require('./routes/upload')

  const app = express()
  app.use(cors())
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  app.use('/upload', express.static(path.join(__dirname, 'upload')))

  app.use('/api/user', userRoutes)
  app.use('/api/book', bookRoutes)
  app.use('/api/borrow', borrowRoutes)
  app.use('/api/admin', adminRoutes)
  app.use('/api/upload', uploadRoutes)

  // 图片代理 —— 解决豆瓣防盗链
  app.get('/api/proxy-image', (req, res) => {
    const url = req.query.url
    if (!url) return res.status(400).end()
    try {
      const parsed = new URL(url)
      const client = parsed.protocol === 'https:' ? https : http
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://book.douban.com/'
      }
      client.get(url, { headers }, (proxyRes) => {
        if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
          // 处理重定向
          const redirectUrl = new URL(proxyRes.headers.location, url).href
          const redirectClient = redirectUrl.startsWith('https:') ? https : http
          redirectClient.get(redirectUrl, { headers }, (redirectRes) => {
            res.setHeader('Content-Type', redirectRes.headers['content-type'] || 'image/jpeg')
            res.setHeader('Cache-Control', 'public, max-age=86400')
            redirectRes.pipe(res)
          }).on('error', () => res.status(404).end())
        } else {
          res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'image/jpeg')
          res.setHeader('Cache-Control', 'public, max-age=86400')
          proxyRes.pipe(res)
        }
      }).on('error', () => res.status(404).end())
    } catch {
      res.status(400).end()
    }
  })

  app.listen(8080, () => {
    console.log('后端服务已启动: http://localhost:8080')
  })
}

start().catch(err => { console.error(err); process.exit(1) })
