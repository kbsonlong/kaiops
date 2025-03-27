<!-- Nodes.vue -->
<template>
  <div class="nodes">
    <a-card title="节点列表">
      <template #extra>
        <a-button type="primary" @click="loadData">
          <template #icon><ReloadOutlined /></template>
          刷新
        </a-button>
      </template>

      <a-table
        :dataSource="nodes"
        :columns="columns"
        :loading="loading"
        rowKey="metadata.name"
      >
        <template #bodyCell="{ column, record }">
          <!-- 状态列 -->
          <template v-if="column.key === 'status'">
            <a-tag :color="getNodeStatusColor(record)">
              {{ getNodeStatus(record) }}
            </a-tag>
          </template>

          <!-- 版本信息列 -->
          <template v-if="column.key === 'version'">
            <div>
              <p>Kubelet: {{ record.status.nodeInfo.kubeletVersion }}</p>
              <p>容器运行时: {{ record.status.nodeInfo.containerRuntimeVersion }}</p>
            </div>
          </template>

          <!-- 系统信息列 -->
          <template v-if="column.key === 'system'">
            <div>
              <p>系统: {{ record.status.nodeInfo.osImage }}</p>
              <p>内核: {{ record.status.nodeInfo.kernelVersion }}</p>
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
import type { Node } from '../api/cluster';

const nodes = ref<Node[]>([]);
const loading = ref(true);

// 表格列定义
const columns = [
  {
    title: '名称',
    dataIndex: ['metadata', 'name'],
    key: 'name',
    width: 200,
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
  },
  {
    title: '版本信息',
    key: 'version',
    width: 250,
  },
  {
    title: '系统信息',
    key: 'system',
    width: 300,
  },
  {
    title: '创建时间',
    key: 'age',
    width: 150,
  },
];

// 获取节点状态
const getNodeStatus = (node: Node) => {
  const readyCondition = node.status.conditions.find(
    condition => condition.type === 'Ready'
  );
  return readyCondition?.status === 'True' ? '就绪' : '未就绪';
};

// 获取节点状态颜色
const getNodeStatusColor = (node: Node) => {
  const readyCondition = node.status.conditions.find(
    condition => condition.type === 'Ready'
  );
  return readyCondition?.status === 'True' ? 'green' : 'red';
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
    nodes.value = await clusterAPI.getNodes();
  } catch (error) {
    console.error('加载节点数据失败:', error);
  } finally {
    loading.value = false;
  }
};

// 组件挂载时加载数据
onMounted(loadData);
</script>

<style scoped>
.nodes {
  padding: 24px;
}
</style> 