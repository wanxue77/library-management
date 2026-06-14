const express = require('express')
const jwt = require('jsonwebtoken')
const md5 = require('md5')
const db = require('../db')
const { authRequired, SECRET } = require('../middleware/auth')
const router = express.Router()

router.post('/register', (req, res) => {
  const { username, password, realName, phone, email } = req.body
  if (!username || !password || !realName) return res.json({ code: 500, message: '参数不完整' })

  // 账号必须是9位纯数字
  if (!/^\d{9}$/.test(username)) return res.json({ code: 500, message: '账号必须为9位纯数字' })

  // 密码验证：大小写字母+数字+特殊符号，6-12位
  if (password.length < 6 || password.length > 12) return res.json({ code: 500, message: '密码长度必须为6-12位' })
  if (!/[A-Z]/.test(password)) return res.json({ code: 500, message: '密码必须包含大写字母' })
  if (!/[a-z]/.test(password)) return res.json({ code: 500, message: '密码必须包含小写字母' })
  if (!/[0-9]/.test(password)) return res.json({ code: 500, message: '密码必须包含数字' })
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) return res.json({ code: 500, message: '密码必须包含特殊符号' })

  // 手机号验证（可选）
  if (phone && !/^1[3-9]\d{9}$/.test(phone)) return res.json({ code: 500, message: '手机号格式不正确' })

  // 邮箱验证（可选）
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.json({ code: 500, message: '邮箱格式不正确' })

  const exist = db.queryOne('SELECT id FROM user WHERE username=?', [username])
  if (exist) return res.json({ code: 500, message: '账号已存在' })
  const result = db.execute('INSERT INTO user (username,password,real_name,phone,email) VALUES (?,?,?,?,?)',
    [username, md5(password), realName, phone || null, email || null])
  res.json({ code: 200, message: 'success', data: { id: result.lastInsertRowid, username } })
})

router.post('/login', (req, res) => {
  const { username, password } = req.body
  const user = db.queryOne('SELECT * FROM user WHERE username=?', [username])
  if (!user || user.password !== md5(password)) return res.json({ code: 500, message: '用户名或密码错误' })
  if (user.status === 0) return res.json({ code: 500, message: '账号已被禁用' })
  const token = jwt.sign({ userId: user.id, username: user.username, role: user.role }, SECRET, { expiresIn: '24h' })
  res.json({ code: 200, message: 'success', data: {
    token, userId: user.id, username: user.username, realName: user.real_name, role: user.role
  }})
})

router.get('/profile', authRequired, (req, res) => {
  const user = db.queryOne('SELECT id,username,real_name,phone,email,role,status,create_time FROM user WHERE id=?', [req.userId])
  if (!user) return res.json({ code: 500, message: '用户不存在' })
  res.json({ code: 200, message: 'success', data: {
    id: user.id, username: user.username, realName: user.real_name, phone: user.phone,
    email: user.email, role: user.role, status: user.status, createTime: user.create_time
  }})
})

router.put('/profile', authRequired, (req, res) => {
  const { realName, phone, email } = req.body
  db.execute('UPDATE user SET real_name=?, phone=?, email=? WHERE id=?', [realName, phone, email, req.userId])
  res.json({ code: 200, message: 'success' })
})

router.put('/password', authRequired, (req, res) => {
  const { oldPassword, newPassword } = req.body
  const user = db.queryOne('SELECT password FROM user WHERE id=?', [req.userId])
  if (user.password !== md5(oldPassword)) return res.json({ code: 500, message: '旧密码错误' })
  db.execute('UPDATE user SET password=? WHERE id=?', [md5(newPassword), req.userId])
  res.json({ code: 200, message: 'success' })
})

// 忘记密码 - 验证身份（用户名+邮箱匹配）
router.post('/verify-identity', (req, res) => {
  const { username, email } = req.body
  if (!username || !email) return res.json({ code: 500, message: '参数不完整' })
  const user = db.queryOne('SELECT id FROM user WHERE username=? AND email=?', [username, email])
  if (!user) return res.json({ code: 500, message: '账号与邮箱不匹配' })
  res.json({ code: 200, message: '验证成功' })
})

// 忘记密码 - 重置密码
router.post('/reset-password', (req, res) => {
  const { username, email, newPassword } = req.body
  if (!username || !email || !newPassword) return res.json({ code: 500, message: '参数不完整' })

  // 再次验证身份
  const user = db.queryOne('SELECT id FROM user WHERE username=? AND email=?', [username, email])
  if (!user) return res.json({ code: 500, message: '身份验证失败' })

  // 密码复杂度验证
  if (newPassword.length < 6 || newPassword.length > 12) return res.json({ code: 500, message: '密码长度必须为6-12位' })
  if (!/[A-Z]/.test(newPassword)) return res.json({ code: 500, message: '密码必须包含大写字母' })
  if (!/[a-z]/.test(newPassword)) return res.json({ code: 500, message: '密码必须包含小写字母' })
  if (!/[0-9]/.test(newPassword)) return res.json({ code: 500, message: '密码必须包含数字' })
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(newPassword)) return res.json({ code: 500, message: '密码必须包含特殊符号' })

  db.execute('UPDATE user SET password=? WHERE id=?', [md5(newPassword), user.id])
  res.json({ code: 200, message: '密码重置成功' })
})

module.exports = router
