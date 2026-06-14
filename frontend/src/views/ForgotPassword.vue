<template>
  <div class="forgot-wrapper">
    <div class="bg-shapes">
      <div class="shape shape-1"></div>
      <div class="shape shape-2"></div>
      <div class="shape shape-3"></div>
      <div class="shape shape-4"></div>
    </div>

    <div class="forgot-card">
      <!-- 步骤1：验证身份 -->
      <div v-if="step === 1">
        <div class="card-header">
          <div class="header-icon">
            <el-icon :size="40"><Lock /></el-icon>
          </div>
          <h2>忘记密码</h2>
          <p>请验证您的身份信息</p>
        </div>

        <el-form :model="form" :rules="verifyRules" ref="verifyFormRef" class="forgot-form">
          <el-form-item prop="username">
            <el-input
              v-model="form.username"
              placeholder="请输入账号（9位数字）"
              :prefix-icon="User"
              size="large"
              maxlength="9"
            />
          </el-form-item>
          <el-form-item prop="email">
            <el-input
              v-model="form.email"
              placeholder="请输入注册时填写的邮箱"
              :prefix-icon="Message"
              size="large"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="large" class="submit-btn" @click="handleVerify" :loading="verifying" round>
              {{ verifying ? '验证中...' : '验证身份' }}
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 步骤2：重置密码 -->
      <div v-else>
        <div class="card-header">
          <div class="header-icon success-icon">
            <el-icon :size="40"><CircleCheckFilled /></el-icon>
          </div>
          <h2>重置密码</h2>
          <p>身份验证成功，请设置新密码</p>
        </div>

        <el-form :model="form2" :rules="pwdRules" ref="pwdFormRef" class="forgot-form">
          <el-form-item prop="password">
            <el-input
              v-model="form2.password"
              type="password"
              placeholder="新密码（大小写+数字+特殊符号，6-12位）"
              :prefix-icon="Lock"
              size="large"
              show-password
            />
          </el-form-item>
          <el-form-item prop="confirmPassword">
            <el-input
              v-model="form2.confirmPassword"
              type="password"
              placeholder="确认新密码"
              :prefix-icon="Lock"
              size="large"
              show-password
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="large" class="submit-btn" @click="handleReset" :loading="resetting" round>
              {{ resetting ? '重置中...' : '重置密码' }}
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <div class="form-footer">
        <el-link type="primary" @click="$router.push('/login')" :underline="false">← 返回登录</el-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Message, CircleCheckFilled } from '@element-plus/icons-vue'
import api from '../api'

const router = useRouter()
const step = ref(1)
const verifying = ref(false)
const resetting = ref(false)
const verifyFormRef = ref()
const pwdFormRef = ref()

const form = reactive({ username: '', email: '' })
const form2 = reactive({ password: '', confirmPassword: '' })
// 验证成功后暂存
const verifiedUser = ref(null)

// 步骤1验证规则
const verifyRules = {
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { pattern: /^\d{9}$/, message: '账号必须为9位纯数字', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '请输入正确的邮箱格式', trigger: 'blur' }
  ]
}

// 密码验证
const validatePwd = (_rule, value, callback) => {
  if (!value) return callback(new Error('请输入新密码'))
  if (value.length < 6 || value.length > 12) return callback(new Error('密码长度必须为6-12位'))
  if (!/[A-Z]/.test(value)) return callback(new Error('密码必须包含大写字母'))
  if (!/[a-z]/.test(value)) return callback(new Error('密码必须包含小写字母'))
  if (!/[0-9]/.test(value)) return callback(new Error('密码必须包含数字'))
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(value)) return callback(new Error('密码必须包含特殊符号'))
  callback()
}
const validateConfirm = (_rule, value, callback) => {
  if (!value) return callback(new Error('请确认密码'))
  if (value !== form2.password) return callback(new Error('两次输入的密码不一致'))
  callback()
}

const pwdRules = {
  password: [{ required: true, validator: validatePwd, trigger: 'blur' }],
  confirmPassword: [{ required: true, validator: validateConfirm, trigger: 'blur' }]
}

async function handleVerify() {
  const valid = await verifyFormRef.value.validate().catch(() => false)
  if (!valid) return
  verifying.value = true
  try {
    const res = await api.post('/user/verify-identity', {
      username: form.username,
      email: form.email
    })
    if (res.code === 200) {
      verifiedUser.value = form.username
      ElMessage.success('身份验证成功，请设置新密码')
      step.value = 2
    }
  } finally {
    verifying.value = false
  }
}

async function handleReset() {
  const valid = await pwdFormRef.value.validate().catch(() => false)
  if (!valid) return
  resetting.value = true
  try {
    const res = await api.post('/user/reset-password', {
      username: verifiedUser.value,
      email: form.email,
      newPassword: form2.password
    })
    if (res.code === 200) {
      ElMessage.success('密码重置成功，请使用新密码登录')
      router.push('/login')
    }
  } finally {
    resetting.value = false
  }
}
</script>

<style scoped>
.forgot-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 30%, #1a5276 60%, #0f172a 100%);
  position: relative;
  overflow: hidden;
}

.bg-shapes {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}
.shape {
  position: absolute;
  border-radius: 50%;
  opacity: 0.06;
  background: #fff;
}
.shape-1 { width: 360px; height: 360px; top: -80px; right: -80px; animation: float 8s ease-in-out infinite; }
.shape-2 { width: 260px; height: 260px; bottom: -60px; left: -60px; animation: float 10s ease-in-out infinite reverse; }
.shape-3 { width: 180px; height: 180px; top: 50%; left: 15%; animation: float 7s ease-in-out infinite 1s; }
.shape-4 { width: 140px; height: 140px; bottom: 20%; right: 15%; animation: float 9s ease-in-out infinite 2s; }

@keyframes float {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-30px) scale(1.05); }
}

.forgot-card {
  width: 440px;
  padding: 48px 40px;
  background: rgba(255, 255, 255, 0.07);
  border-radius: 24px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  z-index: 1;
  position: relative;
}

.card-header {
  text-align: center;
  margin-bottom: 32px;
}
.header-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  background: rgba(64, 158, 255, 0.2);
  border-radius: 50%;
  color: #409eff;
  margin-bottom: 16px;
}
.success-icon {
  background: rgba(103, 194, 58, 0.2);
  color: #67c23a;
}
.card-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 6px;
}
.card-header p {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
}

.forgot-form :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  box-shadow: none;
  padding: 4px 16px;
  transition: all 0.3s;
}
.forgot-form :deep(.el-input__wrapper:hover) {
  border-color: rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.12);
}
.forgot-form :deep(.el-input__wrapper.is-focus) {
  border-color: #409eff;
  background: rgba(255, 255, 255, 0.12);
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}
.forgot-form :deep(.el-input__inner) {
  color: #fff;
  font-size: 15px;
}
.forgot-form :deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.35);
}
.forgot-form :deep(.el-input__prefix-inner) {
  color: rgba(255, 255, 255, 0.5);
}
.forgot-form .el-form-item {
  margin-bottom: 20px;
}

.submit-btn {
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
.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(64, 158, 255, 0.4);
}

.form-footer {
  text-align: center;
  margin-top: 20px;
}
</style>
