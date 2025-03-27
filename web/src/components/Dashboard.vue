<!-- Dashboard.vue -->
<template>
  <div class="dashboard">
    <!-- 集群信息 -->
    <a-card class="mb-4">
      <a-descriptions title="集群信息" bordered>
        <a-descriptions-item label="集群名称">{{ cluster?.name }}</a-descriptions-item>
        <a-descriptions-item label="API 服务器">{{ cluster?.apiServer }}</a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-tag :color="getStatusColor(cluster?.status)">
            {{ getStatusText(cluster?.status) }}
          </a-tag>
        </a-descriptions-item>
      </a-descriptions>
    </a-card>

    <a-row :gutter="[16, 16]">
      <!-- CPU 使用情况 -->
      <a-col :xs="24" :sm="12" :md="6">
        <a-card>
          <template #title>CPU 使用情况</template>
          <a-progress
            type="circle"
            :percent="cpuUsagePercent"
            :format="percent => `${percent}%`"
          />
          <div class="metric-details">
            <p>已用: {{ formatCPU(metrics?.cpu.used) }}</p>
            <p>总量: {{ formatCPU(metrics?.cpu.total) }}</p>
          </div>
        </a-card>
      </a-col>

      <!-- 内存使用情况 -->
      <a-col :xs="24" :sm="12" :md="6">
        <a-card>
          <template #title>内存使用情况</template>
          <a-progress
            type="circle"
            :percent="memoryUsagePercent"
            :format="percent => `${percent}%`"
          />
          <div class="metric-details">
            <p>已用: {{ formatMemory(metrics?.memory.used) }}</p>
            <p>总量: {{ formatMemory(metrics?.memory.total) }}</p>
          </div>
        </a-card>
      </a-col>

      <!-- 节点状态 -->
      <a-col :xs="24" :sm="12" :md="6">
        <a-card>
          <template #title>节点状态</template>
          <a-progress
            type="circle"
            :percent="nodeReadyPercent"
            :format="percent => `${percent}%`"
            :status="nodeReadyStatus"
          />
          <div class="metric-details">
            <p>就绪: {{ metrics?.nodes.ready }}</p>
            <p>总量: {{ metrics?.nodes.total }}</p>
          </div>
        </a-card>
      </a-col>

      <!-- Pod 状态 -->
      <a-col :xs="24" :sm="12" :md="6">
        <a-card>
          <template #title>Pod 状态</template>
          <a-progress
            type="circle"
            :percent="podRunningPercent"
            :format="percent => `${percent}%`"
            :status="podRunningStatus"
          />
          <div class="metric-details">
            <p>运行中: {{ metrics?.pods.running }}</p>
            <p>总量: {{ metrics?.pods.total }}</p>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 最近事件 -->
    <a-card class="mt-4" title="最近事件">
      <a-table :dataSource="events" :columns="eventColumns" :loading="loading">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'type'">
            <a-tag :color="getEventTypeColor(record.type)">
              {{ record.type }}
            </a-tag>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { clusterAPI } from '../api/cluster';
import type { ClusterMetrics, Event, Cluster } from '../types/cluster';

const route = useRoute();
const metrics = ref<ClusterMetrics | null>(null);
const events = ref<Event[]>([]);
const loading = ref(true);
const cluster = ref<Cluster | null>(null);

// 计算百分比
const cpuUsagePercent = computed(() => {
  if (!metrics.value?.cpu.total) return 0;
  return Math.round((metrics.value.cpu.used / metrics.value.cpu.total) * 100);
});

const memoryUsagePercent = computed(() => {
  if (!metrics.value?.memory.total) return 0;
  return Math.round((metrics.value.memory.used / metrics.value.memory.total) * 100);
});

const nodeReadyPercent = computed(() => {
  if (!metrics.value?.nodes.total) return 0;
  return Math.round((metrics.value.nodes.ready / metrics.value.nodes.total) * 100);
});

const podRunningPercent = computed(() => {
  if (!metrics.value?.pods.total) return 0;
  return Math.round((metrics.value.pods.running / metrics.value.pods.total) * 100);
});

// 状态颜色
const nodeReadyStatus = computed(() => nodeReadyPercent.value === 100 ? 'success' : 'warning');
const podRunningStatus = computed(() => podRunningPercent.value >= 90 ? 'success' : 'warning');

// 格式化函数
const formatCPU = (millicores?: number) => {
  if (!millicores) return '0';
  return `${(millicores / 1000).toFixed(1)} 核`;
};

const formatMemory = (bytes?: number) => {
  if (!bytes) return '0';
  const gb = bytes / (1024 * 1024 * 1024);
  return `${gb.toFixed(1)} GB`;
};

const getEventTypeColor = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'normal':
      return 'green';
    case 'warning':
      return 'orange';
    default:
      return 'blue';
  }
};

// 获取状态颜色
const getStatusColor = (status?: string) => {
  switch (status) {
    case 'connected':
      return 'green';
    case 'disconnected':
      return 'orange';
    case 'error':
      return 'red';
    default:
      return 'default';
  }
};

// 获取状态文本
const getStatusText = (status?: string) => {
  switch (status) {
    case 'connected':
      return '已连接';
    case 'disconnected':
      return '未连接';
    case 'error':
      return '错误';
    default:
      return '未知';
  }
};

// 表格列定义
const eventColumns = [
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
    width: 100,
  },
  {
    title: '资源类型',
    dataIndex: ['involvedObject', 'kind'],
    key: 'kind',
    width: 120,
  },
  {
    title: '资源名称',
    dataIndex: ['involvedObject', 'name'],
    key: 'name',
    width: 200,
  },
  {
    title: '原因',
    dataIndex: 'reason',
    key: 'reason',
    width: 150,
  },
  {
    title: '消息',
    dataIndex: 'message',
    key: 'message',
  },
  {
    title: '时间',
    dataIndex: 'lastTimestamp',
    key: 'lastTimestamp',
    width: 200,
  },
];

// 加载集群信息
const loadCluster = async () => {
  try {
    // TODO: 调用获取集群信息的 API
    await new Promise(resolve => setTimeout(resolve, 1000));
    // 模拟数据
    cluster.value = {
      id: route.params.clusterId as string,
      name: '测试集群',
      apiServer: 'https://kubernetes.default.svc',
      status: 'connected',
      createdAt: '2024-01-01T00:00:00Z',
      lastConnected: '2024-01-20T10:00:00Z',
    };
  } catch (error) {
    console.error('加载集群信息失败:', error);
  }
};

// 加载数据
const loadData = async () => {
  try {
    loading.value = true;
    const [metricsData, eventsData] = await Promise.all([
      clusterAPI.getMetrics(),
      clusterAPI.getEvents(),
    ]);
    metrics.value = metricsData;
    events.value = eventsData;
  } catch (error) {
    console.error('加载数据失败:', error);
  } finally {
    loading.value = false;
  }
};

// 定时器引用
let timer: NodeJS.Timer;

// 监听路由参数变化
watch(
  () => route.params.clusterId,
  () => {
    loadCluster();
    loadData();
  },
  { immediate: true }
);

// 组件挂载时启动定时器
onMounted(() => {
  timer = setInterval(loadData, 30000); // 每30秒刷新一次
});

// 组件卸载时清除定时器
onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
  }
});
</script>

<style scoped>
.dashboard {
  padding: 24px;
}

.metric-details {
  margin-top: 16px;
  text-align: center;
}

.metric-details p {
  margin: 4px 0;
}

.ant-card {
  text-align: center;
}

.mt-4 {
  margin-top: 24px;
}

.mb-4 {
  margin-bottom: 24px;
}
</style> 