<template>
  <div class="page-container" v-loading="loading">
    <div v-if="book" style="display:flex;gap:32px;flex-wrap:wrap">
      <!-- 左侧封面 -->
      <img :src="bookCover(book)" class="detail-cover" @error="book.imgFailed = true" />

      <!-- 右侧详情 -->
      <div class="detail-info">
        <div class="detail-header">
          <h2>{{ book.title }}</h2>
          <el-tag v-if="book.category"
            :color="tagColor(book.category)"
            style="color:#fff;border:none"
          >{{ book.category }}</el-tag>
        </div>

        <div class="detail-meta">
          <div class="detail-meta-item"><span class="label">作者</span> {{ book.author }}</div>
          <div class="detail-meta-item"><span class="label">出版社</span> {{ book.publisher || '-' }}</div>
          <div class="detail-meta-item"><span class="label">ISBN</span> {{ book.isbn || '-' }}</div>
          <div class="detail-meta-item"><span class="label">上架时间</span> {{ book.createTime }}</div>
        </div>

        <!-- 库存统计 -->
        <div class="stats-row">
          <div class="stat-card" :class="book.available > 0 ? 'avail' : 'unavail'">
            <div class="num">{{ book.available }}</div>
            <div class="lbl">可借数量</div>
          </div>
          <div class="stat-card">
            <div class="num">{{ book.total }}</div>
            <div class="lbl">总数量</div>
          </div>
          <div class="stat-card">
            <div class="num">{{ book.total - book.available }}</div>
            <div class="lbl">已借出</div>
          </div>
        </div>

        <!-- 简介 -->
        <div style="margin-top:24px">
          <h4 style="margin-bottom:8px;color:#303133">图书简介</h4>
          <p style="color:#606266;line-height:1.9;font-size:14px;text-indent:2em">
            {{ book.description || '暂无简介' }}
          </p>
        </div>

        <!-- 操作按钮 -->
        <div style="margin-top:24px">
          <el-button type="primary" size="large" @click="handleBorrow"
            :disabled="book.available <= 0" :loading="borrowing">
            {{ book.available > 0 ? '立即借阅' : '已借完' }}
          </el-button>
          <el-button size="large" @click="$router.push('/')">返回首页</el-button>
          <el-button size="large" plain @click="$router.push('/my-borrows')">我的借阅</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getBookDetail, borrowBook } from '../api'
import { ElMessage } from 'element-plus'

function coverUrl(url) {
  if (!url) return ''
  if (!url.startsWith('http')) return url
  return '/api/proxy-image?url=' + encodeURIComponent(url)
}
function bookCover(book) {
  if (book.coverUrl && book.coverUrl.startsWith('/upload')) return book.coverUrl
  return '/api/cover/' + book.id
}

function catClass(category) {
  if (!category) return 'cat-default'
  return 'cat-' + category
}

// 分类对应的标签颜色
function tagColor(category) {
  const map = {
    '编程': '#667eea', '科幻': '#0c3483', '文学': '#e0406a', '小说': '#ff758c',
    '历史': '#c79081', '哲学': '#a18cd1', '心理学': '#5aa8a0', '经济学': '#11998e',
    '传记': '#e8a840', '科学': '#4facfe', '艺术': '#c090b0', '管理': '#55a0d0',
    '教育': '#7eb8e0', '医学': '#60c080', '法律': '#13547a'
  }
  return map[category] || '#667eea'
}

const route = useRoute()
const router = useRouter()
const book = ref(null)
const loading = ref(false)
const borrowing = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const res = await getBookDetail(route.params.id)
    if (res.code === 200) {
      res.data.imgFailed = false
      book.value = res.data
    }
  } finally { loading.value = false }
})

async function handleBorrow() {
  borrowing.value = true
  try {
    const res = await borrowBook({ bookId: book.value.id })
    if (res.code === 200) {
      ElMessage.success('借阅成功')
      book.value.available--
      router.push('/my-borrows')
    }
  } finally { borrowing.value = false }
}
</script>
