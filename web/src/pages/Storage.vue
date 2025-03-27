<template>
  <div class="storage">
    <a-card>
      <template #title>存储</template>
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
        <a-tab-pane key="pvc" tab="持久卷声明">
          <a-table
            :columns="pvcColumns"
            :data-source="pvcs"
            :loading="loading"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <a-tag :color="record.status === 'Bound' ? 'success' : 'warning'">
                  {{ record.status }}
                </a-tag>
              </template>
              <template v-else-if="column.key === 'action'">
                <a-space>
                  <a-button type="link" size="small">详情</a-button>
                  <a-button type="link" size="small">编辑</a-button>
                  <a-button type="link" size="small" danger>删除</a-button>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-tab-pane>
        
        <a-tab-pane key="pv" tab="持久卷">
          <a-table
            :columns="pvColumns"
            :data-source="pvs"
            :loading="loading"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <a-tag :color="record.status === 'Bound' ? 'success' : 'warning'">
                  {{ record.status }}
                </a-tag>
              </template>
              <template v-else-if="column.key === 'action'">
                <a-space>
                  <a-button type="link" size="small">详情</a-button>
                  <a-button type="link" size="small">编辑</a-button>
                  <a-button type="link" size="small" danger>删除</a-button>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-tab-pane>
        
        <a-tab-pane key="sc" tab="存储类">
          <a-table
            :columns="scColumns"
            :data-source="scs"
            :loading="loading"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'default'">
                <a-tag :color="record.default ? 'success' : ''">
                  {{ record.default ? '是' : '否' }}
                </a-tag>
              </template>
              <template v-else-if="column.key === 'action'">
                <a-space>
                  <a-button type="link" size="small">详情</a-button>
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
const activeKey = ref('pvc')

const pvcColumns = [
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
    title: '容量',
    dataIndex: 'capacity',
    key: 'capacity'
  },
  {
    title: '访问模式',
    dataIndex: 'accessModes',
    key: 'accessModes'
  },
  {
    title: '存储类',
    dataIndex: 'storageClass',
    key: 'storageClass'
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
    width: 200
  }
]

const pvColumns = [
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
    title: '容量',
    dataIndex: 'capacity',
    key: 'capacity'
  },
  {
    title: '访问模式',
    dataIndex: 'accessModes',
    key: 'accessModes'
  },
  {
    title: '回收策略',
    dataIndex: 'reclaimPolicy',
    key: 'reclaimPolicy'
  },
  {
    title: '存储类',
    dataIndex: 'storageClass',
    key: 'storageClass'
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
    width: 200
  }
]

const scColumns = [
  {
    title: '名称',
    dataIndex: 'name',
    key: 'name'
  },
  {
    title: '存储插件',
    dataIndex: 'provisioner',
    key: 'provisioner'
  },
  {
    title: '回收策略',
    dataIndex: 'reclaimPolicy',
    key: 'reclaimPolicy'
  },
  {
    title: '默认存储类',
    dataIndex: 'default',
    key: 'default'
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
    width: 200
  }
]

const pvcs = [
  {
    key: '1',
    name: 'data-mysql-0',
    namespace: 'default',
    status: 'Bound',
    capacity: '20Gi',
    accessModes: 'RWO',
    storageClass: 'standard',
    age: '2d'
  }
]

const pvs = [
  {
    key: '1',
    name: 'pv-mysql-0',
    status: 'Bound',
    capacity: '20Gi',
    accessModes: 'RWO',
    reclaimPolicy: 'Delete',
    storageClass: 'standard',
    age: '2d'
  }
]

const scs = [
  {
    key: '1',
    name: 'standard',
    provisioner: 'kubernetes.io/no-provisioner',
    reclaimPolicy: 'Delete',
    default: true,
    age: '2d'
  }
]
</script>

<style lang="scss" scoped>
.storage {
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
  .storage {
    .ant-card {
      .ant-card-head {
        min-height: 40px;
      }
    }
  }
}
</style> 