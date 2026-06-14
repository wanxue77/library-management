<template>
  <div class="page-container">
    <el-card style="max-width:600px;margin:0 auto">
      <template #header><h3>个人信息</h3></template>
      <el-form :model="form" label-width="80px" :rules="rules" ref="formRef">
        <el-form-item label="用户名"><el-input v-model="form.username" disabled /></el-form-item>
        <el-form-item label="真实姓名" prop="realName"><el-input v-model="form.realName" /></el-form-item>
        <el-form-item label="手机号"><el-input v-model="form.phone" /></el-form-item>
        <el-form-item label="邮箱"><el-input v-model="form.email" /></el-form-item>
        <el-form-item label="角色"><el-tag>{{ form.role === 'ADMIN' ? '管理员' : '用户' }}</el-tag></el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card style="max-width:600px;margin:20px auto">
      <template #header><h3>修改密码</h3></template>
      <el-form :model="pwdForm" label-width="100px" ref="pwdFormRef">
        <el-form-item label="旧密码" prop="oldPassword" :rules="[{ required: true, message: '请输入旧密码' }]">
          <el-input v-model="pwdForm.oldPassword" type="password" />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword" :rules="[{ required: true, message: '请输入新密码', min: 6 }]">
          <el-input v-model="pwdForm.newPassword" type="password" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleChangePwd" :loading="changing">修改密码</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { getProfile, updateProfile, changePassword } from '../api'
import { ElMessage } from 'element-plus'

const form = reactive({ username: '', realName: '', phone: '', email: '', role: '' })
const pwdForm = reactive({ oldPassword: '', newPassword: '' })
const formRef = ref()
const pwdFormRef = ref()
const saving = ref(false)
const changing = ref(false)

const rules = { realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }] }

onMounted(async () => {
  const res = await getProfile()
  if (res.code === 200) Object.assign(form, res.data)
})

async function handleSave() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    await updateProfile({ realName: form.realName, phone: form.phone, email: form.email })
    ElMessage.success('保存成功')
  } finally { saving.value = false }
}

async function handleChangePwd() {
  const valid = await pwdFormRef.value.validate().catch(() => false)
  if (!valid) return
  changing.value = true
  try {
    const res = await changePassword(pwdForm)
    if (res.code === 200) ElMessage.success('密码修改成功')
  } finally { changing.value = false }
}
</script>
