import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/login', name: 'Login', component: () => import('../views/Login.vue') },
  { path: '/register', name: 'Register', component: () => import('../views/Register.vue') },
  { path: '/forgot-password', name: 'ForgotPassword', component: () => import('../views/ForgotPassword.vue') },
  { path: '/', name: 'Home', component: () => import('../views/Home.vue') },
  { path: '/book/:id', name: 'BookDetail', component: () => import('../views/BookDetail.vue') },
  { path: '/my-borrows', name: 'MyBorrows', component: () => import('../views/MyBorrows.vue') },
  { path: '/profile', name: 'Profile', component: () => import('../views/Profile.vue') },
  { path: '/admin/books', name: 'AdminBooks', component: () => import('../views/admin/BookManage.vue'), meta: { role: 'ADMIN' } },
  { path: '/admin/users', name: 'AdminUsers', component: () => import('../views/admin/UserManage.vue'), meta: { role: 'ADMIN' } },
  { path: '/admin/borrows', name: 'AdminBorrows', component: () => import('../views/admin/BorrowManage.vue'), meta: { role: 'ADMIN' } },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.path !== '/login' && to.path !== '/register' && to.path !== '/forgot-password' && !token) {
    next('/login')
  } else if (to.meta.role && to.meta.role !== localStorage.getItem('role')) {
    next('/')
  } else {
    next()
  }
})

export default router
