const express = require('express')
const db = require('../db')
const router = express.Router()

function toCamel(book) {
  if (!book) return null
  return {
    id: book.id, title: book.title, author: book.author, isbn: book.isbn,
    publisher: book.publisher, category: book.category, description: book.description,
    coverUrl: book.cover_url, total: book.total, available: book.available,
    createTime: book.create_time, updateTime: book.update_time
  }
}

router.get('/list', (req, res) => {
  let { page = 1, pageSize = 10, keyword, category } = req.query
  page = parseInt(page); pageSize = parseInt(pageSize)

  let where = 'WHERE 1=1'
  const params = []
  if (keyword) {
    where += ' AND (title LIKE ? OR author LIKE ? OR isbn LIKE ?)'
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
  }
  if (category) { where += ' AND category=?'; params.push(category) }

  const row = db.queryOne(`SELECT COUNT(*) as cnt FROM book ${where}`, params)
  const count = row ? row.cnt : 0
  const rows = db.query(`SELECT * FROM book ${where} ORDER BY create_time DESC LIMIT ? OFFSET ?`,
    [...params, pageSize, (page - 1) * pageSize])

  res.json({ code: 200, message: 'success', data: { records: rows.map(toCamel), total: count, size: pageSize, current: page } })
})

router.get('/:id', (req, res) => {
  const book = db.queryOne('SELECT * FROM book WHERE id=?', [req.params.id])
  if (!book) return res.json({ code: 500, message: '图书不存在' })
  res.json({ code: 200, message: 'success', data: toCamel(book) })
})

module.exports = router
