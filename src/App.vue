<template>
  <div class="container">
    <h2>数据管理</h2>
    
    <div class="toolbar">
      <el-button type="primary" @click="showAddModal = true">新增</el-button>
      <el-button @click="handleExport">导出</el-button>
      <el-upload
        class="upload-btn"
        :show-file-list="false"
        :before-upload="handleImport"
        accept=".xlsx,.xls"
      >
        <el-button>导入</el-button>
      </el-upload>
    </div>

    <el-table :data="tableData" border>
      <el-table-column prop="id" label="ID" width="80"></el-table-column>
      <el-table-column prop="name" label="姓名"></el-table-column>
      <el-table-column prop="email" label="邮箱"></el-table-column>
      <el-table-column prop="phone" label="电话"></el-table-column>
      <el-table-column prop="address" label="地址"></el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="180"></el-table-column>
      <el-table-column label="操作" width="160">
        <template #default="scope">
          <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      :current-page="page"
      :page-sizes="[10, 20, 50]"
      :page-size="limit"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
    ></el-pagination>

    <el-dialog v-model="showAddModal" title="新增/编辑" @close="resetForm">
      <el-form :model="form" label-width="80px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name"></el-input>
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email"></el-input>
        </el-form-item>
        <el-form-item label="电话" prop="phone">
          <el-input v-model="form.phone"></el-input>
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="form.address"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddModal = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as XLSX from 'xlsx'

const tableData = ref([])
const page = ref(1)
const limit = ref(10)
const total = ref(0)
const showAddModal = ref(false)
const form = ref({ id: null, name: '', email: '', phone: '', address: '' })

const fetchData = async () => {
  const res = await fetch(`/api/items?page=${page.value}&limit=${limit.value}`)
  const data = await res.json()
  tableData.value = data.items
  total.value = data.total
}

const handleSizeChange = (val) => {
  limit.value = val
  fetchData()
}

const handleCurrentChange = (val) => {
  page.value = val
  fetchData()
}

const handleEdit = (row) => {
  form.value = { ...row }
  showAddModal.value = true
}

const handleDelete = async (id) => {
  if (confirm('确定删除吗？')) {
    await fetch(`/api/items/${id}`, { method: 'DELETE' })
    fetchData()
  }
}

const handleSubmit = async () => {
  if (form.value.id) {
    await fetch(`/api/items/${form.value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    })
  } else {
    await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    })
  }
  showAddModal.value = false
  fetchData()
}

const resetForm = () => {
  form.value = { id: null, name: '', email: '', phone: '', address: '' }
}

const handleExport = () => {
  const headers = ['ID', '姓名', '邮箱', '电话', '地址', '创建时间']
  const data = tableData.value.map(row => [
    row.id, row.name, row.email, row.phone, row.address || '', row.createdAt
  ])
  data.unshift(headers)
  
  const ws = XLSX.utils.aoa_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '数据')
  XLSX.writeFile(wb, 'data.xlsx')
}

const handleImport = (file) => {
  const reader = new FileReader()
  reader.onload = async (e) => {
    const data = new Uint8Array(e.target.result)
    const workbook = XLSX.read(data, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const json = XLSX.utils.sheet_to_json(sheet)
    
    const items = json.map(row => ({
      name: row['姓名'] || row['name'] || '',
      email: row['邮箱'] || row['email'] || '',
      phone: row['电话'] || row['phone'] || '',
      address: row['地址'] || row['address'] || ''
    })).filter(item => item.name)
    
    await fetch('/api/items/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(items)
    })
    
    fetchData()
  }
  reader.readAsArrayBuffer(file)
  return false
}

onMounted(fetchData)
</script>

<style>
.container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.toolbar {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}

.upload-btn {
  display: inline-block;
}
</style>