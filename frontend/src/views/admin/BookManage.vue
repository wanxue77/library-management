<template>
  <div class="page-container">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <h3>图书管理</h3>
      <el-button type="primary" @click="openAdd">新增图书</el-button>
    </div>

    <div class="search-bar">
      <el-input v-model="keyword" placeholder="书名 / 作者 / ISBN" clearable style="width:280px" @keyup.enter="search">
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-button type="primary" @click="search">搜索</el-button>
    </div>

    <el-table :data="books" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="title" label="书名" min-width="160" />
      <el-table-column prop="author" label="作者" width="120" />
      <el-table-column prop="isbn" label="ISBN" width="140" />
      <el-table-column prop="category" label="分类" width="90" />
      <el-table-column label="库存" width="90">
        <template #default="{ row }">{{ row.available }}/{{ row.total }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-popconfirm title="确认删除？" @confirm="handleDelete(row.id)">
            <template #reference><el-button size="small" type="danger">删除</el-button></template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <div style="text-align:center;margin-top:20px" v-if="total > pageSize">
      <el-pagination background layout="prev, pager, next" :total="total" :page-size="pageSize" v-model:current-page="page" @current-change="fetchBooks" />
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑图书' : '新增图书'" width="640px" top="5vh">
      <el-form :model="form" label-width="80px" :rules="rules" ref="formRef">
        <el-row :gutter="16">
          <el-col :span="14">
            <el-form-item label="书名" prop="title"><el-input v-model="form.title" /></el-form-item>
          </el-col>
          <el-col :span="10">
            <el-form-item label="分类" prop="category">
              <el-select v-model="form.category" placeholder="选择分类" clearable style="width:100%">
                <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="作者" prop="author"><el-input v-model="form.author" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="出版社"><el-input v-model="form.publisher" /></el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="ISBN"><el-input v-model="form.isbn" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="总数量" prop="total">
              <el-input-number v-model="form.total" :min="1" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="简介">
          <el-input v-model="form.description" type="textarea" rows="3" />
        </el-form-item>
        <el-form-item label="封面">
          <el-upload :action="uploadUrl" :headers="uploadHeaders"
            :on-success="onUploadSuccess" :show-file-list="false" accept="image/*">
            <el-button>上传封面图片</el-button>
          </el-upload>
          <img v-if="form.coverUrl"
            :src="form.coverUrl.startsWith('/upload') ? form.coverUrl : '/api/proxy-image?url=' + encodeURIComponent(form.coverUrl)"
            style="width:120px;margin-top:10px;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,0.15)"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getBookList, addBook, updateBook, deleteBook } from '../../api'
import { Search } from '@element-plus/icons-vue'

const books = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const saving = ref(false)
const formRef = ref()
const keyword = ref('')
const page = ref(1)
const pageSize = ref(12)
const total = ref(0)
const form = ref({ title: '', author: '', isbn: '', publisher: '', category: '', description: '', coverUrl: '', total: 1 })
const uploadUrl = '/api/upload'
const uploadHeaders = { Authorization: `Bearer ${localStorage.getItem('token')}` }

const categories = [
  '编程', '文学', '科幻', '小说', '历史', '哲学', '心理学',
  '经济学', '传记', '科学', '艺术', '管理', '教育', '医学', '法律'
]

const rules = {
  title: [{ required: true, message: '请输入书名', trigger: 'blur' }],
  author: [{ required: true, message: '请输入作者', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  total: [{ required: true, message: '请输入数量', trigger: 'blur' }]
}

onMounted(() => fetchBooks())

async function fetchBooks() {
  loading.value = true
  try {
    const res = await getBookList({ page: page.value, pageSize: pageSize.value, keyword: keyword.value })
    if (res.code === 200) {
      books.value = res.data.records
      total.value = res.data.total
    }
  } finally { loading.value = false }
}

function search() { page.value = 1; fetchBooks() }

function openAdd() {
  isEdit.value = false
  form.value = { title: '', author: '', isbn: '', publisher: '', category: '', description: '', coverUrl: '', total: 1 }
  dialogVisible.value = true
}

function openEdit(row) {
  isEdit.value = true
  form.value = { ...row }
  dialogVisible.value = true
}

function onUploadSuccess(res) {
  if (res.code === 200) form.value.coverUrl = res.data.url
}

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    if (isEdit.value) {
      await updateBook(form.value)
    } else {
      await addBook(form.value)
    }
    dialogVisible.value = false
    fetchBooks()
  } finally { saving.value = false }
}

async function handleDelete(id) {
  await deleteBook(id)
  fetchBooks()
}
</script>
