<template>
  <div class="workloads">
    <a-card>
      <template #title>工作负载</template>
      <template #extra>
        <a-space>
          <a-button type="primary">
            <template #icon><plus-outlined /></template>
            创建
          </a-button>
          <a-button>
            <template #icon><reload-outlined /></template>
            刷新
          </a-button>
        </a-space>
      </template>
      
      <a-tabs v-model:activeKey="activeKey">
        <a-tab-pane key="pods" tab="Pods">
          <a-table
            :columns="podColumns"
            :data-source="pods"
            :loading="loading"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <a-tag :color="record.status === 'Running' ? 'success' : 'error'">
                  {{ record.status }}
                </a-tag>
              </template>
              <template v-else-if="column.key === 'action'">
                <a-space>
                  <a-button type="link" size="small">详情</a-button>
                  <a-button type="link" size="small">日志</a-button>
                  <a-button type="link" size="small">终端</a-button>
                  <a-button type="link" size="small" danger>删除</a-button>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-tab-pane>
        
        <a-tab-pane key="deployments" tab="Deployments">
          <a-table
            :columns="deploymentColumns"
            :data-source="deployments"
            :loading="loading"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <a-tag :color="record.available === record.replicas ? 'success' : 'warning'">
                  {{ record.available }}/{{ record.replicas }}
                </a-tag>
              </template>
              <template v-else-if="column.key === 'action'">
                <a-space>
                  <a-button type="link" size="small">详情</a-button>
                  <a-button type="link" size="small">伸缩</a-button>
                  <a-button type="link" size="small">编辑</a-button>
                  <a-button type="link" size="small" danger>删除</a-button>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons-vue'

const loading = ref(false)
const activeKey = ref('pods')

const podColumns = [
  {
    title: '名称',
    dataIndex: 'name',
    key: 'name'
  },
  {
    title: '命名空间',
    dataIndex: 'namespace',
    key: 'namespace'
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status'
  },
  {
    title: '重启次数',
    dataIndex: 'restarts',
    key: 'restarts'
  },
  {
    title: '运行时间',
    dataIndex: 'age',
    key: 'age'
  },
  {
    title: '操作',
    key: 'action',
    fixed: 'right',
    width: 250
  }
]

const deploymentColumns = [
  {
    title: '名称',
    dataIndex: 'name',
    key: 'name'
  },
  {
    title: '命名空间',
    dataIndex: 'namespace',
    key: 'namespace'
  },
  {
    title: '副本状态',
    dataIndex: 'status',
    key: 'status'
  },
  {
    title: '创建时间',
    dataIndex: 'age',
    key: 'age'
  },
  {
    title: '操作',
    key: 'action',
    fixed: 'right',
    width: 250
  }
]

const pods = [
  {
    key: '1',
    name: 'nginx-pod',
    namespace: 'default',
    status: 'Running',
    restarts: 0,
    age: '2h'
  }
]

const deployments = [
  {
    key: '1',
    name: 'nginx-deployment',
    namespace: 'default',
    replicas: 3,
    available: 3,
    age: '2h'
  }
]
</script>

<style lang="scss" scoped>
.workloads {
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
  .workloads {
    .ant-card {
      .ant-card-head {
        min-height: 40px;
      }
    }
  }
}
</style> 