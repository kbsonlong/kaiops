<!-- Services.vue -->
<template>
  <div class="services">
    <a-card title="服务列表">
      <template #extra>
        <a-space>
          <a-select
            v-model:value="selectedNamespace"
            style="width: 200px"
            placeholder="选择命名空间"
            @change="loadData"
          >
            <a-select-option value="">所有命名空间</a-select-option>
            <a-select-option
              v-for="ns in namespaces"
              :key="ns"
              :value="ns"
            >
              {{ ns }}
            </a-select-option>
          </a-select>
          <a-button type="primary" @click="loadData">
            <template #icon><ReloadOutlined /></template>
            刷新
          </a-button>
        </a-space>
      </template>

      <a-table
        :dataSource="services"
        :columns="columns"
        :loading="loading"
        rowKey="metadata.name"
      >
        <template #bodyCell="{ column, record }">
          <!-- 类型列 -->
          <template v-if="column.key === 'type'">
            <a-tag :color="getServiceTypeColor(record.spec.type)">
              {{ record.spec.type }}
            </a-tag>
          </template>

          <!-- 端口列 -->
          <template v-if="column.key === 'ports'">
            <div v-for="port in record.spec.ports" :key="port.port">
              {{ port.port }}:{{ port.targetPort }} ({{ port.protocol }})
            </div>
          </template>

          <!-- 创建时间列 -->
          <template v-if="column.key === 'age'">
            {{ formatAge(record.metadata.creationTimestamp) }}
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ReloadOutlined } from '@ant-design/icons-vue';
import { clusterAPI } from '../api/cluster';
import type { Service } from '../api/cluster';

const services = ref<Service[]>([]);
const loading = ref(true);
const selectedNamespace = ref('');
const namespaces = ref<string[]>([]);

// 表格列定义
const columns = [
  {
    title: '名称',
    dataIndex: ['metadata', 'name'],
    key: 'name',
    width: 250,
  },
  {
    title: '命名空间',
    dataIndex: ['metadata', 'namespace'],
    key: 'namespace',
    width: 150,
  },
  {
    title: '类型',
    key: 'type',
    width: 120,
  },
  {
    title: 'Cluster IP',
    dataIndex: ['spec', 'clusterIP'],
    key: 'clusterIP',
    width: 150,
  },
  {
    title: '端口',
    key: 'ports',
    width: 200,
  },
  {
    title: '创建时间',
    key: 'age',
    width: 150,
  },
];

// 获取服务类型颜色
const getServiceTypeColor = (type: string) => {
  switch (type.toLowerCase()) {
    case 'clusterip':
      return 'blue';
    case 'nodeport':
      return 'green';
    case 'loadbalancer':
      return 'purple';
    case 'externalname':
      return 'orange';
    default:
      return 'default';
  }
};

// 格式化创建时间
const formatAge = (timestamp: string) => {
  const created = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - created.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds}秒`;
  }
  if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)}分钟`;
  }
  if (diffInSeconds < 86400) {
    return `${Math.floor(diffInSeconds / 3600)}小时`;
  }
  return `${Math.floor(diffInSeconds / 86400)}天`;
};

// 加载数据
const loadData = async () => {
  try {
    loading.value = true;
    services.value = await clusterAPI.getServices(selectedNamespace.value);

    // 更新命名空间列表
    const namespaceSet = new Set<string>();
    services.value.forEach(service => {
      if (service.metadata.namespace) {
        namespaceSet.add(service.metadata.namespace);
      }
    });
    namespaces.value = Array.from(namespaceSet).sort();
  } catch (error) {
    console.error('加载服务数据失败:', error);
  } finally {
    loading.value = false;
  }
};

// 组件挂载时加载数据
onMounted(loadData);
</script>

<style scoped>
.services {
  padding: 24px;
}
</style> 