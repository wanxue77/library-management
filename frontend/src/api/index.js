import axios from 'axios'
import { ElMessage } from 'element-plus'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res.data,
  err => {
    if (err.response?.status === 401) {
      localStorage.clear()
      window.location.href = '/login'
    }
    ElMessage.error(err.response?.data?.message || '请求失败')
    return Promise.reject(err)
  }
)

// ----- 用户 -----
export const login = data => api.post('/user/login', data)
export const register = data => api.post('/user/register', data)
export const getProfile = () => api.get('/user/profile')
export const updateProfile = data => api.put('/user/profile', data)
export const changePassword = data => api.put('/user/password', data)

// ----- 图书 -----
export const getBookList = params => api.get('/book/list', { params })
export const getBookDetail = id => api.get(`/book/${id}`)

// ----- 借阅 -----
export const borrowBook = data => api.post('/borrow', data)
export const returnBook = recordId => api.put(`/borrow/return/${recordId}`)
export const getMyBorrows = params => api.get('/borrow/my', { params })

// ----- 管理端 -----
export const addBook = data => api.post('/admin/book', data)
export const updateBook = data => api.put('/admin/book', data)
export const deleteBook = id => api.delete(`/admin/book/${id}`)
export const getUserList = params => api.get('/admin/user/list', { params })
export const updateUserStatus = (id, status) => api.put(`/admin/user/status/${id}?status=${status}`)
export const getBorrowList = params => api.get('/admin/borrow/list', { params })
export const checkOverdue = () => api.post('/admin/borrow/check-overdue')
export const adminReturnBook = recordId => api.put(`/admin/borrow/return/${recordId}`)

// ----- 上传 -----
export const uploadFile = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
}

export default api
