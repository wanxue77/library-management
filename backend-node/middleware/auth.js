const jwt = require('jsonwebtoken')
const SECRET = 'library-management-system-secret-key-2024'

function authRequired(req, res, next) {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, message: '未登录或token已过期' })
  }
  try {
    const decoded = jwt.verify(auth.substring(7), SECRET)
    req.userId = decoded.userId
    req.role = decoded.role
    next()
  } catch {
    return res.status(401).json({ code: 401, message: '未登录或token已过期' })
  }
}

function adminRequired(req, res, next) {
  if (req.role !== 'ADMIN') {
    return res.status(403).json({ code: 403, message: '无权限' })
  }
  next()
}

module.exports = { authRequired, adminRequired, SECRET }
