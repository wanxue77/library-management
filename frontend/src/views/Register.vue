<template>
  <div class="register-wrapper">
    <!-- 背景动画粒子 -->
    <div class="bg-shapes">
      <div class="shape shape-1"></div>
      <div class="shape shape-2"></div>
      <div class="shape shape-3"></div>
      <div class="shape shape-4"></div>
      <div class="shape shape-5"></div>
      <div class="shape shape-6"></div>
    </div>

    <div class="register-container">
      <!-- 左侧品牌面板 -->
      <div class="register-left">
        <div class="brand-content">
          <div class="brand-icon">
            <el-icon :size="64"><UserFilled /></el-icon>
          </div>
          <h1 class="brand-title">加入我们</h1>
          <p class="brand-desc">创建账号，开启阅读之旅</p>
          <p class="brand-sub">万册好书等你来发现</p>
          <div class="brand-features">
            <div class="feature-item">
              <el-icon><Collection /></el-icon>
              <span>海量藏书</span>
            </div>
            <div class="feature-item">
              <el-icon><Reading /></el-icon>
              <span>自由借阅</span>
            </div>
            <div class="feature-item">
              <el-icon><Star /></el-icon>
              <span>专属推荐</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧注册面板 -->
      <div class="register-right">
        <div class="register-form-wrapper">
          <h2 class="form-title">创建账号</h2>
          <p class="form-subtitle">填写以下信息完成注册</p>

          <el-form :model="form" :rules="rules" ref="formRef" class="register-form">
            <el-form-item prop="username">
              <el-input
                v-model="form.username"
                placeholder="账号（9位纯数字）"
                :prefix-icon="User"
                size="large"
                maxlength="9"
                class="custom-input"
              />
            </el-form-item>
            <el-form-item prop="password">
              <el-input
                v-model="form.password"
                type="password"
                placeholder="密码（大小写字母+数字+特殊符号，6-12位）"
                :prefix-icon="Lock"
                size="large"
                class="custom-input"
                show-password
              />
            </el-form-item>
            <el-form-item prop="confirmPassword">
              <el-input
                v-model="form.confirmPassword"
                type="password"
                placeholder="确认密码"
                :prefix-icon="Lock"
                size="large"
                class="custom-input"
                show-password
              />
            </el-form-item>
            <el-form-item prop="realName">
              <el-input
                v-model="form.realName"
                placeholder="真实姓名"
                :prefix-icon="Avatar"
                size="large"
                class="custom-input"
              />
            </el-form-item>
            <el-form-item prop="phone">
              <el-input
                v-model="form.phone"
                placeholder="手机号"
                :prefix-icon="Phone"
                size="large"
                maxlength="11"
                class="custom-input"
              />
            </el-form-item>
            <el-form-item prop="email">
              <el-input
                v-model="form.email"
                placeholder="邮箱"
                :prefix-icon="Message"
                size="large"
                class="custom-input"
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                size="large"
                class="register-btn"
                @click="handleRegister"
                :loading="loading"
                round
              >
                {{ loading ? '注册中...' : '注 册' }}
              </el-button>
            </el-form-item>
          </el-form>

          <div class="form-footer">
            <span class="has-account">已有账号？</span>
            <el-link type="primary" @click="$router.push('/login')" :underline="false" class="login-link">
              返回登录 →
            </el-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { register } from '../api'
import { ElMessage } from 'element-plus'
import { User, Lock, Avatar, Phone, Message, UserFilled, Collection, Reading, Star } from '@element-plus/icons-vue'

const router = useRouter()
const formRef = ref()
const loading = ref(false)
const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  realName: '',
  phone: '',
  email: ''
})

// 自定义验证函数：账号必须是9位纯数字
const validateUsername = (_rule, value, callback) => {
  if (!value) {
    return callback(new Error('请输入账号'))
  }
  if (!/^\d{9}$/.test(value)) {
    return callback(new Error('账号必须为9位纯数字'))
  }
  callback()
}

// 自定义验证函数：密码复杂度
const validatePassword = (_rule, value, callback) => {
  if (!value) {
    return callback(new Error('请输入密码'))
  }
  if (value.length < 6 || value.length > 12) {
    return callback(new Error('密码长度必须为6-12位'))
  }
  if (!/[A-Z]/.test(value)) {
    return callback(new Error('密码必须包含大写字母'))
  }
  if (!/[a-z]/.test(value)) {
    return callback(new Error('密码必须包含小写字母'))
  }
  if (!/[0-9]/.test(value)) {
    return callback(new Error('密码必须包含数字'))
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(value)) {
    return callback(new Error('密码必须包含特殊符号（如 !@#$ 等）'))
  }
  callback()
}

// 自定义验证函数：确认密码
const validateConfirmPassword = (_rule, value, callback) => {
  if (!value) {
    return callback(new Error('请确认密码'))
  }
  if (value !== form.password) {
    return callback(new Error('两次输入的密码不一致'))
  }
  callback()
}

// 自定义验证函数：手机号
const validatePhone = (_rule, value, callback) => {
  if (value && !/^1[3-9]\d{9}$/.test(value)) {
    return callback(new Error('请输入正确的手机号'))
  }
  callback()
}

// 自定义验证函数：邮箱
const validateEmail = (_rule, value, callback) => {
  if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return callback(new Error('请输入正确的邮箱格式'))
  }
  callback()
}

const rules = {
  username: [
    { required: true, validator: validateUsername, trigger: 'blur' }
  ],
  password: [
    { required: true, validator: validatePassword, trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword, trigger: 'blur' }
  ],
  realName: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' }
  ],
  phone: [
    { validator: validatePhone, trigger: 'blur' }
  ],
  email: [
    { validator: validateEmail, trigger: 'blur' }
  ]
}

async function handleRegister() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    await register({
      username: form.username,
      password: form.password,
      realName: form.realName,
      phone: form.phone,
      email: form.email
    })
    ElMessage.success('注册成功，请登录')
    router.push('/login')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-wrapper {
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
.shape-1 { width: 400px; height: 400px; top: -80px; right: -80px; animation: float 8s ease-in-out infinite; }
.shape-2 { width: 300px; height: 300px; bottom: -60px; left: -60px; animation: float 10s ease-in-out infinite reverse; }
.shape-3 { width: 200px; height: 200px; top: 30%; left: 30%; animation: float 7s ease-in-out infinite 1s; }
.shape-4 { width: 150px; height: 150px; bottom: 20%; right: 25%; animation: float 9s ease-in-out infinite 2s; }
.shape-5 { width: 250px; height: 250px; top: 10%; left: 60%; animation: float 11s ease-in-out infinite 0.5s; }
.shape-6 { width: 180px; height: 180px; bottom: 40%; right: 10%; animation: float 8s ease-in-out infinite 3s; }

@keyframes float {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-30px) scale(1.05); }
}

/* 主体卡片 */
.register-container {
  display: flex;
  width: 960px;
  min-height: 660px;
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
.register-left {
  flex: 0 0 420px;
  background: linear-gradient(135deg, rgba(103, 194, 58, 0.85) 0%, rgba(64, 158, 255, 0.9) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  position: relative;
  overflow: hidden;
}
.register-left::before {
  content: '';
  position: absolute;
  top: -40%;
  right: -30%;
  width: 280px;
  height: 280px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
}
.register-left::after {
  content: '';
  position: absolute;
  bottom: -15%;
  left: -20%;
  width: 220px;
  height: 220px;
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
  gap: 16px;
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
.register-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 36px 36px;
}
.register-form-wrapper {
  width: 100%;
  max-width: 380px;
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
  margin-bottom: 24px;
}

.register-form :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  box-shadow: none;
  padding: 2px 14px;
  transition: all 0.3s;
}
.register-form :deep(.el-input__wrapper:hover) {
  border-color: rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.12);
}
.register-form :deep(.el-input__wrapper.is-focus) {
  border-color: #67c23a;
  background: rgba(255, 255, 255, 0.12);
  box-shadow: 0 0 0 2px rgba(103, 194, 58, 0.2);
}
.register-form :deep(.el-input__inner) {
  color: #fff;
  font-size: 14px;
}
.register-form :deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.35);
}
.register-form :deep(.el-input__prefix-inner) {
  color: rgba(255, 255, 255, 0.5);
}
.register-form .el-form-item {
  margin-bottom: 16px;
}

.register-btn {
  width: 100%;
  height: 46px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 4px;
  border-radius: 24px;
  background: linear-gradient(135deg, #67c23a 0%, #409eff 100%);
  border: none;
  margin-top: 4px;
  transition: all 0.3s;
}
.register-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(103, 194, 58, 0.4);
}

.form-footer {
  text-align: center;
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
.has-account {
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
}
.login-link {
  font-size: 14px;
  color: #67c23a;
  font-weight: 500;
}

@media (max-width: 768px) {
  .register-container {
    flex-direction: column;
    width: 90%;
    min-height: auto;
  }
  .register-left {
    flex: none;
    padding: 28px 20px;
  }
  .brand-title { font-size: 22px; }
  .register-right {
    padding: 28px 20px;
  }
}
</style>
