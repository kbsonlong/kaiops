<template>
  <div class="services">
    <a-card>
      <template #title>服务列表</template>
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
      
      <a-table
        :columns="columns"
        :data-source="services"
        :loading="loading"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'type'">
            <a-tag>{{ record.type }}</a-tag>
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
    </a-card>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons-vue'

const loading = ref(false)

const columns = [
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
    title: '类型',
    dataIndex: 'type',
    key: 'type'
  },
  {
    title: '集群IP',
    dataIndex: 'clusterIP',
    key: 'clusterIP'
  },
  {
    title: '外部IP',
    dataIndex: 'externalIP',
    key: 'externalIP'
  },
  {
    title: '端口',
    dataIndex: 'ports',
    key: 'ports'
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

const services = [
  {
    key: '1',
    name: 'kubernetes',
    namespace: 'default',
    type: 'ClusterIP',
    clusterIP: '10.96.0.1',
    externalIP: '-',
    ports: '443/TCP',
    age: '2d'
  },
  {
    key: '2',
    name: 'nginx-service',
    namespace: 'default',
    type: 'NodePort',
    clusterIP: '10.96.0.2',
    externalIP: '-',
    ports: '80:30080/TCP',
    age: '1h'
  }
]
</script>

<style lang="scss" scoped>
.services {
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
  .services {
    .ant-card {
      .ant-card-head {
        min-height: 40px;
      }
    }
  }
}
</style> 