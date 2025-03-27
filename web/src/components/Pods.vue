<!-- Pods.vue -->
<template>
  <div class="pods">
    <a-card title="Pod 列表">
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
        :dataSource="pods"
        :columns="columns"
        :loading="loading"
        rowKey="metadata.name"
      >
        <template #bodyCell="{ column, record }">
          <!-- 状态列 -->
          <template v-if="column.key === 'status'">
            <a-tag :color="getPodStatusColor(record.status.phase)">
              {{ record.status.phase }}
            </a-tag>
          </template>

          <!-- IP 地址列 -->
          <template v-if="column.key === 'ip'">
            <div>
              <p>Pod IP: {{ record.status.podIP || '-' }}</p>
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
import type { Pod } from '../api/cluster';

const pods = ref<Pod[]>([]);
const loading = ref(true);
const selectedNamespace = ref('');
const namespaces = ref<string[]>([]);

// 表格列定义
const columns = [
  {
    title: '名称',
    dataIndex: ['metadata', 'name'],
    key: 'name',
    width: 300,
  },
  {
    title: '命名空间',
    dataIndex: ['metadata', 'namespace'],
    key: 'namespace',
    width: 150,
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
  },
  {
    title: 'IP 地址',
    key: 'ip',
    width: 150,
  },
  {
    title: '创建时间',
    key: 'age',
    width: 150,
  },
];

// 获取 Pod 状态颜色
const getPodStatusColor = (phase: string) => {
  switch (phase.toLowerCase()) {
    case 'running':
      return 'green';
    case 'pending':
      return 'orange';
    case 'succeeded':
      return 'blue';
    case 'failed':
      return 'red';
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
    pods.value = await clusterAPI.getPods(selectedNamespace.value);

    // 更新命名空间列表
    const namespaceSet = new Set<string>();
    pods.value.forEach(pod => {
      if (pod.metadata.namespace) {
        namespaceSet.add(pod.metadata.namespace);
      }
    });
    namespaces.value = Array.from(namespaceSet).sort();
  } catch (error) {
    console.error('加载 Pod 数据失败:', error);
  } finally {
    loading.value = false;
  }
};

// 组件挂载时加载数据
onMounted(loadData);
</script>

<style scoped>
.pods {
  padding: 24px;
}
</style> 