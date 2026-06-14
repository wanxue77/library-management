<template>
  <div class="page-container">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <h3>借阅管理</h3>
      <el-button type="warning" @click="handleCheckOverdue">检查逾期</el-button>
    </div>

    <div style="display:flex;gap:12px;align-items:center;margin-bottom:16px;flex-wrap:wrap">
      <el-input v-model="keyword" placeholder="用户ID / 图书ID" clearable style="width:220px" @keyup.enter="search">
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-radio-group v-model="statusFilter" @change="search">
        <el-radio-button value="">全部</el-radio-button>
        <el-radio-button value="BORROWED">借阅中</el-radio-button>
        <el-radio-button value="RETURNED">已归还</el-radio-button>
        <el-radio-button value="OVERDUE">已逾期</el-radio-button>
      </el-radio-group>
    </div>

    <el-table :data="records" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="userId" label="用户ID" width="80" />
      <el-table-column prop="bookId" label="图书ID" width="80" />
      <el-table-column prop="borrowTime" label="借阅时间" width="170" />
      <el-table-column prop="dueTime" label="应还时间" width="170" />
      <el-table-column prop="returnTime" label="归还时间" width="170" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'BORROWED' ? 'warning' : row.status === 'RETURNED' ? 'success' : 'danger'">
            {{ row.status === 'BORROWED' ? '借阅中' : row.status === 'RETURNED' ? '已归还' : '已逾期' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="fineAmount" label="罚款(元)" width="100" />
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button v-if="row.status === 'BORROWED' || row.status === 'OVERDUE'"
            size="small" type="primary" @click="handleReturn(row.id)">归还</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div style="text-align:center;margin-top:20px" v-if="total > pageSize">
      <el-pagination background layout="prev, pager, next" :total="total" :page-size="pageSize" v-model:current-page="page" @current-change="fetchRecords" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getBorrowList, checkOverdue, adminReturnBook } from '../../api'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'

const records = ref([])
const loading = ref(false)
const statusFilter = ref('')
const keyword = ref('')
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

onMounted(() => fetchRecords())

async function fetchRecords() {
  loading.value = true
  try {
    const res = await getBorrowList({
      page: page.value, pageSize: pageSize.value,
      status: statusFilter.value || undefined,
      keyword: keyword.value || undefined
    })
    if (res.code === 200) {
      records.value = res.data.records
      total.value = res.data.total
    }
  } finally { loading.value = false }
}

function search() { page.value = 1; fetchRecords() }

async function handleReturn(id) {
  try {
    await adminReturnBook(id)
    ElMessage.success('归还成功')
    fetchRecords()
  } catch (e) {
    ElMessage.error('归还失败')
  }
}

async function handleCheckOverdue() {
  await checkOverdue()
  ElMessage.success('逾期检查完成')
  fetchRecords()
}
</script>
