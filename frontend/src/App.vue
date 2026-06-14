<template>
  <div v-if="$route.path === '/login' || $route.path === '/register' || $route.path === '/forgot-password'">
    <router-view />
  </div>
  <div v-else>
    <div class="header">
      <h1 @click="$router.push('/')">图书管理系统</h1>
      <div class="header-right">
        <template v-if="role === 'ADMIN'">
          <el-dropdown>
            <span style="color:#fff;cursor:pointer">管理菜单<el-icon><ArrowDown /></el-icon></span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="$router.push('/admin/books')">图书管理</el-dropdown-item>
                <el-dropdown-item @click="$router.push('/admin/users')">用户管理</el-dropdown-item>
                <el-dropdown-item @click="$router.push('/admin/borrows')">借阅管理</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <span @click="$router.push('/my-borrows')">我的借阅</span>
        <span @click="$router.push('/profile')">{{ username }}</span>
        <span @click="logout">退出</span>
      </div>
    </div>
    <router-view />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()
const username = ref('')
const role = ref('')

onMounted(() => {
  username.value = localStorage.getItem('username') || ''
  role.value = localStorage.getItem('role') || ''
})

function logout() {
  localStorage.clear()
  router.push('/login')
}
</script>
