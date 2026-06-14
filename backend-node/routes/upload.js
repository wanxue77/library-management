const express = require('express')
const multer = require('multer')
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const router = express.Router()

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'upload'),
  filename(req, file, cb) {
    const ext = path.extname(file.originalname)
    cb(null, uuidv4() + ext)
  }
})
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } })

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) return res.json({ code: 500, message: '请选择文件' })
  res.json({ code: 200, message: 'success', data: { url: '/upload/' + req.file.filename, filename: req.file.originalname } })
})

module.exports = router
