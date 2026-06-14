<template>
  <div class="login-wrapper">
    <!-- 背景动画粒子 -->
    <div class="bg-shapes">
      <div class="shape shape-1"></div>
      <div class="shape shape-2"></div>
      <div class="shape shape-3"></div>
      <div class="shape shape-4"></div>
      <div class="shape shape-5"></div>
      <div class="shape shape-6"></div>
    </div>

    <div class="login-container">
      <!-- 左侧品牌面板 -->
      <div class="login-left">
        <div class="brand-content">
          <div class="brand-icon">
            <el-icon :size="64"><Reading /></el-icon>
          </div>
          <h1 class="brand-title">图书管理系统</h1>
          <p class="brand-desc">海量好书，随时借阅</p>
          <p class="brand-sub">知识的海洋，从这里启航</p>
          <div class="brand-features">
            <div class="feature-item">
              <el-icon><Notebook /></el-icon>
              <span>藏书丰富</span>
            </div>
            <div class="feature-item">
              <el-icon><Timer /></el-icon>
              <span>借阅便捷</span>
            </div>
            <div class="feature-item">
              <el-icon><Management /></el-icon>
              <span>管理高效</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧登录面板 -->
      <div class="login-right">
        <div class="login-form-wrapper">
          <h2 class="form-title">欢迎回来</h2>
          <p class="form-subtitle">请登录您的账号</p>

          <el-form :model="form" :rules="rules" ref="formRef" class="login-form">
            <el-form-item prop="username">
              <el-input
                v-model="form.username"
                placeholder="请输入用户名"
                :prefix-icon="User"
                size="large"
                class="custom-input"
              />
            </el-form-item>
            <el-form-item prop="password">
              <el-input
                v-model="form.password"
                type="password"
                placeholder="请输入密码"
                :prefix-icon="Lock"
                size="large"
                class="custom-input"
                show-password
                @keyup.enter="handleLogin"
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                size="large"
                class="login-btn"
                @click="handleLogin"
                :loading="loading"
                round
              >
                {{ loading ? '登录中...' : '登 录' }}
              </el-button>
            </el-form-item>
          </el-form>

          <div class="form-footer">
            <span class="no-account">还没有账号？</span>
            <el-link type="primary" @click="$router.push('/register')" :underline="false" class="register-link">
              立即注册 →
            </el-link>
          </div>
          <div style="text-align:center;margin-top:12px">
            <el-link @click="$router.push('/forgot-password')" :underline="false" style="color:rgba(255,255,255,0.4);font-size:13px">忘记密码？</el-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, markRaw } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '../api'
import { ElMessage } from 'element-plus'
import { User, Lock, Reading, Notebook, Timer, Management } from '@element-plus/icons-vue'

const router = useRouter()
const formRef = ref()
const loading = ref(false)
const form = reactive({ username: '', password: '' })
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function handleLogin() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    const res = await login(form)
    if (res.code === 200) {
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('userId', res.data.userId)
      localStorage.setItem('username', res.data.username)
      localStorage.setItem('role', res.data.role)
      ElMessage.success('登录成功')
      router.push('/')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 30%, #1a5276 60%, #0f172a 100%);
  position: relative;
  overflow: hidden;
}

/* 背景浮动形状 */
.bg-shapes {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}
.shape {
  position: absolute;
  border-radius: 50%;
  opacity: 0.08;
  background: #fff;
}
.shape-1 { width: 400px; height: 400px; top: -100px; left: -100px; animation: float 8s ease-in-out infinite; }
.shape-2 { width: 300px; height: 300px; bottom: -80px; right: -60px; animation: float 10s ease-in-out infinite reverse; }
.shape-3 { width: 200px; height: 200px; top: 50%; left: 40%; animation: float 7s ease-in-out infinite 1s; }
.shape-4 { width: 150px; height: 150px; top: 20%; right: 20%; animation: float 9s ease-in-out infinite 2s; }
.shape-5 { width: 250px; height: 250px; bottom: 10%; left: 15%; animation: float 11s ease-in-out infinite 0.5s; }
.shape-6 { width: 180px; height: 180px; top: 35%; right: 35%; animation: float 8s ease-in-out infinite 3s; }

@keyframes float {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-30px) scale(1.05); }
}

/* 主体卡片 */
.login-container {
  display: flex;
  width: 960px;
  min-height: 580px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 24px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  overflow: hidden;
  z-index: 1;
  position: relative;
}

/* 左侧品牌区 */
.login-left {
  flex: 0 0 460px;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.85) 0%, rgba(54, 108, 244, 0.9) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  position: relative;
  overflow: hidden;
}
.login-left::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -30%;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
}
.login-left::after {
  content: '';
  position: absolute;
  bottom: -20%;
  right: -20%;
  width: 250px;
  height: 250px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.04);
}

.brand-content {
  text-align: center;
  color: #fff;
  position: relative;
  z-index: 1;
}
.brand-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 50%;
  margin-bottom: 24px;
  backdrop-filter: blur(10px);
}
.brand-title {
  font-size: 30px;
  font-weight: 700;
  margin-bottom: 8px;
  letter-spacing: 2px;
}
.brand-desc {
  font-size: 17px;
  opacity: 0.9;
  margin-bottom: 4px;
  font-weight: 300;
}
.brand-sub {
  font-size: 15px;
  opacity: 0.7;
  margin-bottom: 36px;
  font-weight: 300;
}
.brand-features {
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
}
.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.15);
  padding: 10px 18px;
  border-radius: 24px;
  font-size: 14px;
  backdrop-filter: blur(4px);
}

/* 右侧表单区 */
.login-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 40px;
}
.login-form-wrapper {
  width: 100%;
  max-width: 360px;
}
.form-title {
  font-size: 26px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 6px;
}
.form-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.55);
  margin-bottom: 32px;
}

.login-form :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  box-shadow: none;
  padding: 4px 16px;
  transition: all 0.3s;
}
.login-form :deep(.el-input__wrapper:hover) {
  border-color: rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.12);
}
.login-form :deep(.el-input__wrapper.is-focus) {
  border-color: #409eff;
  background: rgba(255, 255, 255, 0.12);
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}
.login-form :deep(.el-input__inner) {
  color: #fff;
  font-size: 15px;
}
.login-form :deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.4);
}
.login-form :deep(.el-input__prefix-inner) {
  color: rgba(255, 255, 255, 0.5);
}
.login-form .el-form-item {
  margin-bottom: 20px;
}

.login-btn {
  width: 100%;
  height: 46px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 4px;
  border-radius: 24px;
  background: linear-gradient(135deg, #409eff 0%, #366cf4 100%);
  border: none;
  margin-top: 8px;
  transition: all 0.3s;
}
.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(64, 158, 255, 0.4);
}

.form-footer {
  text-align: center;
  margin-top: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
.no-account {
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
}
.register-link {
  font-size: 14px;
  color: #409eff;
  font-weight: 500;
}

@media (max-width: 768px) {
  .login-container {
    flex-direction: column;
    width: 90%;
    min-height: auto;
  }
  .login-left {
    flex: none;
    padding: 32px 24px;
  }
  .brand-title { font-size: 22px; }
  .login-right {
    padding: 32px 24px;
  }
}
</style>
