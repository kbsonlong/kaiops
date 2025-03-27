<template>
  <div class="nodes">
    <a-card>
      <template #title>节点列表</template>
      <template #extra>
        <a-space>
          <a-button type="primary">
            <template #icon><reload-outlined /></template>
            刷新
          </a-button>
        </a-space>
      </template>
      
      <a-table
        :columns="columns"
        :data-source="nodes"
        :loading="loading"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status === 'Ready' ? 'success' : 'error'">
              {{ record.status }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small">详情</a-button>
              <a-button type="link" size="small">编辑标签</a-button>
              <a-button type="link" size="small" danger>驱逐</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { ReloadOutlined } from '@ant-design/icons-vue'

const loading = ref(false)

const columns = [
  {
    title: '名称',
    dataIndex: 'name',
    key: 'name'
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status'
  },
  {
    title: '角色',
    dataIndex: 'roles',
    key: 'roles'
  },
  {
    title: '版本',
    dataIndex: 'version',
    key: 'version'
  },
  {
    title: '内部IP',
    dataIndex: 'internalIP',
    key: 'internalIP'
  },
  {
    title: '外部IP',
    dataIndex: 'externalIP',
    key: 'externalIP'
  },
  {
    title: '操作',
    key: 'action',
    fixed: 'right',
    width: 200
  }
]

const nodes = [
  {
    key: '1',
    name: 'node-1',
    status: 'Ready',
    roles: 'control-plane,master',
    version: 'v1.23.6',
    internalIP: '10.254.0.0/16',
    externalIP: '172.30.0.0/16'
  }
]
</script>

<style lang="scss" scoped>
.nodes {
  .ant-card {
    .ant-card-head {
      min-height: 48px;
      
      .ant-card-head-title {
        padding: 8px 0;
      }
      
      .ant-card-extra {
        padding: 8px 0;
      }
    }
  }
}

@media screen and (max-width: 768px) {
  .nodes {
    .ant-card {
      .ant-card-head {
        min-height: 40px;
      }
    }
  }
}
</style> 