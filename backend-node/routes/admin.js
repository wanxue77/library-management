const express = require('express')
const db = require('../db')
const { authRequired, adminRequired } = require('../middleware/auth')
const router = express.Router()

router.use(authRequired, adminRequired)

router.post('/book', (req, res) => {
  const { title, author, isbn, publisher, category, description, coverUrl, total } = req.body
  db.execute('INSERT INTO book (title,author,isbn,publisher,category,description,cover_url,total,available) VALUES (?,?,?,?,?,?,?,?,?)',
    [title, author, isbn, publisher, category, description, coverUrl || null, total, total])
  res.json({ code: 200, message: 'success' })
})

router.put('/book', (req, res) => {
  const { id, title, author, isbn, publisher, category, description, coverUrl, total } = req.body
  const exist = db.queryOne('SELECT * FROM book WHERE id=?', [id])
  if (!exist) return res.json({ code: 500, message: '图书不存在' })
  const newTotal = total || exist.total
  const borrowed = exist.total - exist.available
  db.execute("UPDATE book SET title=?,author=?,isbn=?,publisher=?,category=?,description=?,cover_url=?,total=?,available=?,update_time=datetime('now','localtime') WHERE id=?",
    [title || exist.title, author || exist.author, isbn || exist.isbn, publisher || exist.publisher,
     category || exist.category, description || exist.description, coverUrl || exist.cover_url,
     newTotal, newTotal - borrowed, id])
  res.json({ code: 200, message: 'success' })
})

router.delete('/book/:id', (req, res) => {
  db.execute('DELETE FROM book WHERE id=?', [req.params.id])
  res.json({ code: 200, message: 'success' })
})

router.get('/user/list', (req, res) => {
  let { page = 1, pageSize = 999, keyword } = req.query
  page = parseInt(page); pageSize = parseInt(pageSize)
  let where = 'WHERE 1=1'
  const params = []
  if (keyword) {
    where += ' AND (username LIKE ? OR real_name LIKE ? OR phone LIKE ?)'
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
  }
  const row = db.queryOne(`SELECT COUNT(*) as cnt FROM user ${where}`, params)
  const count = row ? row.cnt : 0
  const rows = db.query(`SELECT id,username,real_name,phone,email,role,status,create_time FROM user ${where} ORDER BY create_time DESC LIMIT ? OFFSET ?`,
    [...params, pageSize, (page - 1) * pageSize])
  const records = rows.map(r => ({
    id: r.id, username: r.username, realName: r.real_name, phone: r.phone,
    email: r.email, role: r.role, status: r.status, createTime: r.create_time
  }))
  res.json({ code: 200, message: 'success', data: { records, total: count, size: pageSize, current: page } })
})

router.put('/user/status/:id', (req, res) => {
  db.execute('UPDATE user SET status=? WHERE id=?', [req.query.status, req.params.id])
  res.json({ code: 200, message: 'success' })
})

router.get('/borrow/list', (req, res) => {
  let { page = 1, pageSize = 10, status } = req.query
  page = parseInt(page); pageSize = parseInt(pageSize)
  let where = 'WHERE 1=1'
  const params = []
  if (status) { where += ' AND status=?'; params.push(status) }
  const row = db.queryOne(`SELECT COUNT(*) as cnt FROM borrow_record ${where}`, params)
  const count = row ? row.cnt : 0
  const rows = db.query(`SELECT * FROM borrow_record ${where} ORDER BY create_time DESC LIMIT ? OFFSET ?`,
    [...params, pageSize, (page - 1) * pageSize])
  const records = rows.map(r => ({
    id: r.id, userId: r.user_id, bookId: r.book_id, borrowTime: r.borrow_time,
    dueTime: r.due_time, returnTime: r.return_time, status: r.status,
    fineAmount: r.fine_amount, createTime: r.create_time
  }))
  res.json({ code: 200, message: 'success', data: { records, total: count, size: pageSize, current: page } })
})

router.post('/borrow/check-overdue', (req, res) => {
  const now = new Date().toISOString().replace('T',' ').substring(0, 19)
  const overdue = db.query("SELECT * FROM borrow_record WHERE status='BORROWED' AND due_time < ?", [now])
  for (const r of overdue) {
    const days = Math.ceil((new Date() - new Date(r.due_time)) / 86400000)
    db.execute('UPDATE borrow_record SET status=?, fine_amount=? WHERE id=?', ['OVERDUE', days * 0.5, r.id])
  }
  res.json({ code: 200, message: 'success' })
})

module.exports = router
