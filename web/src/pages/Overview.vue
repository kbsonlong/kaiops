<template>
  <div class="overview">
    <a-row :gutter="[16, 16]">
      <!-- CPU使用率 -->
      <a-col :xs="24" :sm="12" :md="6">
        <a-card>
          <template #title>
            <span class="card-title">
              <dashboard-outlined /> CPU使用率
            </span>
          </template>
          <div class="metric">
            <a-progress type="dashboard" :percent="4.82" status="normal" />
            <div class="metric-detail">
              <div>总计: 4 Cores</div>
              <div>已使用: 0.19 Cores</div>
            </div>
          </div>
        </a-card>
      </a-col>

      <!-- 内存使用率 -->
      <a-col :xs="24" :sm="12" :md="6">
        <a-card>
          <template #title>
            <span class="card-title">
              <database-outlined /> 内存使用率
            </span>
          </template>
          <div class="metric">
            <a-progress type="dashboard" :percent="61.16" status="normal" />
            <div class="metric-detail">
              <div>总计: 7.64 GiB</div>
              <div>已使用: 4.67 GiB</div>
            </div>
          </div>
        </a-card>
      </a-col>

      <!-- 节点状态 -->
      <a-col :xs="24" :sm="12" :md="6">
        <a-card>
          <template #title>
            <span class="card-title">
              <cluster-outlined /> 节点状态
            </span>
          </template>
          <div class="metric">
            <a-statistic title="运行中" :value="1" />
            <a-divider type="vertical" />
            <a-statistic title="总节点" :value="1" />
          </div>
        </a-card>
      </a-col>

      <!-- Pod状态 -->
      <a-col :xs="24" :sm="12" :md="6">
        <a-card>
          <template #title>
            <span class="card-title">
              <container-outlined /> Pod状态
            </span>
          </template>
          <div class="metric">
            <a-statistic title="运行中" :value="5" />
            <a-divider type="vertical" />
            <a-statistic title="总数" :value="5" />
          </div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 集群事件 -->
    <a-card class="events-card" title="集群事件">
      <template #extra>
        <a-button type="link">
          查看全部
        </a-button>
      </template>
      <a-table
        :columns="columns"
        :data-source="events"
        :pagination="false"
        size="small"
      />
    </a-card>
  </div>
</template>

<script lang="ts" setup>
import {
  DashboardOutlined,
  DatabaseOutlined,
  ClusterOutlined,
  ContainerOutlined
} from '@ant-design/icons-vue'

const columns = [
  {
    title: '时间',
    dataIndex: 'time',
    key: 'time',
    width: 200
  },
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
    width: 100
  },
  {
    title: '原因',
    dataIndex: 'reason',
    key: 'reason',
    width: 150
  },
  {
    title: '对象',
    dataIndex: 'object',
    key: 'object',
    width: 200
  },
  {
    title: '消息',
    dataIndex: 'message',
    key: 'message'
  }
]

const events = [
  {
    key: '1',
    time: '2024-01-20 10:30:00',
    type: 'Normal',
    reason: 'Started',
    object: 'Pod/nginx-deployment-xxx',
    message: 'Started container nginx'
  },
  {
    key: '2',
    time: '2024-01-20 10:29:55',
    type: 'Normal',
    reason: 'Pulled',
    object: 'Pod/nginx-deployment-xxx',
    message: 'Successfully pulled image "nginx:latest"'
  }
]
</script>

<style lang="scss" scoped>
.overview {
  .card-title {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .metric {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;

    &-detail {
      text-align: center;
      color: rgba(0, 0, 0, 0.45);
    }
  }

  .events-card {
    margin-top: 16px;
  }
}

@media screen and (max-width: 768px) {
  .overview {
    .metric {
      gap: 8px;
    }

    .events-card {
      margin-top: 12px;
    }
  }
}
</style> 