<template>
  <div class="page-container">
    <h3 style="margin-bottom:16px">我的借阅记录</h3>
    <el-radio-group v-model="statusFilter" @change="fetchRecords" style="margin-bottom:16px">
      <el-radio-button value="">全部</el-radio-button>
      <el-radio-button value="BORROWED">借阅中</el-radio-button>
      <el-radio-button value="RETURNED">已归还</el-radio-button>
      <el-radio-button value="OVERDUE">已逾期</el-radio-button>
    </el-radio-group>

    <el-table :data="records" v-loading="loading" border stripe>
      <el-table-column prop="id" label="记录ID" width="80" />
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
      <el-table-column prop="fineAmount" label="罚款(元)" width="80" />
      <el-table-column label="操作" width="100">
        <template #default="{ row }">
          <el-button v-if="row.status === 'BORROWED' || row.status === 'OVERDUE'" type="primary" size="small" @click="handleReturn(row)">归还</el-button>
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
import { getMyBorrows, returnBook } from '../api'
import { ElMessage, ElMessageBox } from 'element-plus'

const records = ref([])
const loading = ref(false)
const statusFilter = ref('')
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

onMounted(() => fetchRecords())

async function fetchRecords() {
  loading.value = true
  try {
    const res = await getMyBorrows({ page: page.value, pageSize: pageSize.value, status: statusFilter.value })
    if (res.code === 200) {
      records.value = res.data.records
      total.value = res.data.total
    }
  } finally {
    loading.value = false
  }
}

async function handleReturn(row) {
  await ElMessageBox.confirm('确认归还该书？', '提示', { type: 'info' })
  try {
    await returnBook(row.id)
    ElMessage.success('归还成功')
    fetchRecords()
  } catch {}
}
</script>
