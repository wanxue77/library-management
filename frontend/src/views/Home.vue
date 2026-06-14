<template>
  <div class="page-container">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-input v-model="keyword" placeholder="书名 / 作者 / ISBN" clearable style="width:300px" @keyup.enter="search">
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-button type="primary" @click="search">搜索</el-button>
      <div style="flex:1" />
      <el-radio-group v-model="viewMode" size="small">
        <el-radio-button value="grid"><el-icon><Grid /></el-icon></el-radio-button>
        <el-radio-button value="list"><el-icon><List /></el-icon></el-radio-button>
      </el-radio-group>
    </div>

    <!-- 分类标签 -->
    <div class="category-tags">
      <span
        class="category-tag" :class="{ active: activeCategory === '' }"
        @click="filterCategory('')"
      >全部</span>
      <span
        v-for="c in categories" :key="c"
        class="category-tag"
        :class="{ active: activeCategory === c }"
        @click="filterCategory(c)"
      >{{ c }}</span>
    </div>

    <!-- 网格视图 -->
    <div class="book-grid" v-loading="loading" v-if="viewMode === 'grid'">
      <el-card class="book-card" v-for="book in books" :key="book.id"
        @click="$router.push(`/book/${book.id}`)" shadow="hover">
        <div class="book-cover-wrap">
          <img :src="bookCover(book)" @error="book.imgFailed = true"
            style="width:100%;height:100%;object-fit:cover;display:block" />
          <span class="cover-badge" :class="badgeClass(book.category)" v-if="book.category">
            {{ book.category }}
          </span>
        </div>
        <div class="card-body">
          <div class="title">{{ book.title }}</div>
          <div class="author-row">{{ book.author }} / {{ book.publisher || '未知出版社' }}</div>
          <div class="bottom-row">
            <el-tag size="small" :type="book.available > 0 ? 'success' : 'danger'" effect="plain">
              {{ book.available > 0 ? `可借 ${book.available}/${book.total}` : '已借完' }}
            </el-tag>
            <span style="font-size:12px;color:#c0c4cc">{{ book.isbn ? book.isbn.slice(-4) : '' }}</span>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 列表视图 -->
    <div class="book-list" v-loading="loading" v-if="viewMode === 'list'">
      <div class="book-list-item" v-for="book in books" :key="book.id"
        @click="$router.push(`/book/${book.id}`)">
        <div class="book-list-cover">
          <img :src="bookCover(book)" @error="book.imgFailed = true"
            style="width:100%;height:100%;object-fit:cover;display:block" />
        </div>
        <div class="book-list-info">
          <div class="list-title">{{ book.title }}</div>
          <div class="list-meta">{{ book.author }} · {{ book.publisher || '未知出版社' }} · {{ book.category || '未分类' }}</div>
          <div class="list-desc">{{ book.description || '暂无简介' }}</div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <el-tag :type="book.available > 0 ? 'success' : 'danger'" effect="plain">
            {{ book.available > 0 ? `可借 ${book.available}/${book.total}` : '已借完' }}
          </el-tag>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <el-empty v-if="!loading && books.length === 0" description="暂无图书，换个关键词试试吧" />

    <!-- 分页 -->
    <div style="text-align:center;margin-top:24px" v-if="total > pageSize">
      <el-pagination background layout="prev, pager, next" :total="total"
        :page-size="pageSize" v-model:current-page="page" @current-change="fetchBooks" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getBookList } from '../api'

const books = ref([])
const loading = ref(false)
const keyword = ref('')
const activeCategory = ref('')
const viewMode = ref('grid')
const page = ref(1)
const pageSize = ref(12)
const total = ref(0)

const categories = [
  '编程', '文学', '科幻', '小说', '历史', '哲学', '心理学',
  '经济学', '传记', '科学', '艺术', '管理', '教育', '医学', '法律'
]

function coverUrl(url) {
  if (!url) return ''
  if (!url.startsWith('http')) return url
  return '/api/proxy-image?url=' + encodeURIComponent(url)
}
// 使用后端生成的SVG封面图
function bookCover(book) {
  if (book.coverUrl && book.coverUrl.startsWith('/upload')) return book.coverUrl
  return '/api/cover/' + book.id
}

function catClass(category) {
  if (!category) return 'cat-default'
  return 'cat-' + category
}

function badgeClass(category) {
  if (!category) return ''
  return 'badge-' + category
}

function initBooks(list) {
  return list.map(b => { b.imgFailed = false; return b })
}

onMounted(() => fetchBooks())

async function fetchBooks() {
  loading.value = true
  try {
    const res = await getBookList({
      page: page.value, pageSize: pageSize.value,
      keyword: keyword.value, category: activeCategory.value
    })
    if (res.code === 200) {
      books.value = initBooks(res.data.records)
      total.value = res.data.total
    }
  } finally { loading.value = false }
}

function search() { page.value = 1; fetchBooks() }
function filterCategory(cat) { activeCategory.value = cat; page.value = 1; fetchBooks() }
</script>
