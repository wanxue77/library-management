const express = require('express')
const db = require('../db')
const { authRequired } = require('../middleware/auth')
const router = express.Router()

function fmt(d) { return d.toISOString().replace('T',' ').substring(0, 19) }

function toCamel(r) {
  return {
    id: r.id, userId: r.user_id, bookId: r.book_id, borrowTime: r.borrow_time,
    dueTime: r.due_time, returnTime: r.return_time, status: r.status,
    fineAmount: r.fine_amount, createTime: r.create_time
  }
}

router.post('/', authRequired, (req, res) => {
  const { bookId } = req.body
  const book = db.queryOne('SELECT * FROM book WHERE id=?', [bookId])
  if (!book) return res.json({ code: 500, message: '图书不存在' })
  if (book.available <= 0) return res.json({ code: 500, message: '该图书已全部借出' })

  const already = db.queryOne("SELECT id FROM borrow_record WHERE user_id=? AND book_id=? AND status IN ('BORROWED','OVERDUE')",
    [req.userId, bookId])
  if (already) return res.json({ code: 500, message: '您已借阅该书，请先归还' })

  const now = new Date()
  const due = new Date(now.getTime() + 30 * 24 * 3600000)
  db.execute('INSERT INTO borrow_record (user_id,book_id,borrow_time,due_time,status,fine_amount) VALUES (?,?,?,?,?,?)',
    [req.userId, bookId, fmt(now), fmt(due), 'BORROWED', 0])
  db.execute('UPDATE book SET available=available-1 WHERE id=?', [bookId])
  res.json({ code: 200, message: 'success' })
})

router.put('/return/:recordId', authRequired, (req, res) => {
  const record = db.queryOne('SELECT * FROM borrow_record WHERE id=? AND user_id=?', [req.params.recordId, req.userId])
  if (!record) return res.json({ code: 500, message: '借阅记录不存在' })
  if (!['BORROWED','OVERDUE'].includes(record.status)) return res.json({ code: 500, message: '该记录已归还' })

  db.execute('UPDATE borrow_record SET return_time=?, status=? WHERE id=?', [fmt(new Date()), 'RETURNED', record.id])
  db.execute('UPDATE book SET available=available+1 WHERE id=?', [record.book_id])
  res.json({ code: 200, message: 'success' })
})

router.get('/my', authRequired, (req, res) => {
  let { page = 1, pageSize = 10, status } = req.query
  page = parseInt(page); pageSize = parseInt(pageSize)
  let where = 'WHERE user_id=?'
  const params = [req.userId]
  if (status) { where += ' AND status=?'; params.push(status) }

  const row = db.queryOne(`SELECT COUNT(*) as cnt FROM borrow_record ${where}`, params)
  const count = row ? row.cnt : 0
  const rows = db.query(`SELECT * FROM borrow_record ${where} ORDER BY create_time DESC LIMIT ? OFFSET ?`,
    [...params, pageSize, (page - 1) * pageSize])
  res.json({ code: 200, message: 'success', data: { records: rows.map(toCamel), total: count, size: pageSize, current: page } })
})

module.exports = router
