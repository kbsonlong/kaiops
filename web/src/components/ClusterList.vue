<!-- ClusterList.vue -->
<template>
  <div class="cluster-list">
    <a-card title="集群管理">
      <template #extra>
        <a-button type="primary" @click="showAddClusterModal">
          <template #icon><PlusOutlined /></template>
          添加集群
        </a-button>
      </template>

      <a-table
        :dataSource="clusters"
        :columns="columns"
        :loading="loading"
        rowKey="id"
      >
        <template #bodyCell="{ column, record }">
          <!-- 状态列 -->
          <template v-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">
              {{ getStatusText(record.status) }}
            </a-tag>
          </template>

          <!-- 操作列 -->
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" @click="viewCluster(record)">查看</a-button>
              <a-button type="link" @click="editCluster(record)">编辑</a-button>
              <a-popconfirm
                title="确定要删除这个集群吗?"
                @confirm="deleteCluster(record)"
              >
                <a-button type="link" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 添加/编辑集群对话框 -->
    <a-modal
      v-model:visible="modalVisible"
      :title="editingCluster ? '编辑集群' : '添加集群'"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
    >
      <a-form
        ref="formRef"
        :model="clusterForm"
        :rules="rules"
        layout="vertical"
      >
        <a-form-item label="集群名称" name="name">
          <a-input v-model:value="clusterForm.name" placeholder="请输入集群名称" />
        </a-form-item>
        <a-form-item label="API 服务器地址" name="apiServer">
          <a-input v-model:value="clusterForm.apiServer" placeholder="请输入 API 服务器地址" />
        </a-form-item>
        <a-form-item label="KubeConfig" name="kubeConfig">
          <a-textarea
            v-model:value="clusterForm.kubeConfig"
            :rows="4"
            placeholder="请输入 KubeConfig 内容"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { PlusOutlined } from '@ant-design/icons-vue';
import type { Cluster } from '../types/cluster';
import type { FormInstance } from 'ant-design-vue';

const router = useRouter();
const clusters = ref<Cluster[]>([]);
const loading = ref(false);
const modalVisible = ref(false);
const editingCluster = ref<Cluster | null>(null);
const formRef = ref<FormInstance>();

// 表单数据
const clusterForm = ref({
  name: '',
  apiServer: '',
  kubeConfig: '',
});

// 表单验证规则
const rules = {
  name: [{ required: true, message: '请输入集群名称' }],
  apiServer: [{ required: true, message: '请输入 API 服务器地址' }],
};

// 表格列定义
const columns = [
  {
    title: '集群名称',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: 'API 服务器',
    dataIndex: 'apiServer',
    key: 'apiServer',
  },
  {
    title: '状态',
    key: 'status',
  },
  {
    title: '最后连接时间',
    dataIndex: 'lastConnected',
    key: 'lastConnected',
  },
  {
    title: '操作',
    key: 'action',
    width: 200,
  },
];

// 获取状态颜色
const getStatusColor = (status: string) => {
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
const getStatusText = (status: string) => {
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

// 显示添加集群对话框
const showAddClusterModal = () => {
  editingCluster.value = null;
  clusterForm.value = {
    name: '',
    apiServer: '',
    kubeConfig: '',
  };
  modalVisible.value = true;
};

// 编辑集群
const editCluster = (cluster: Cluster) => {
  editingCluster.value = cluster;
  clusterForm.value = {
    name: cluster.name,
    apiServer: cluster.apiServer,
    kubeConfig: cluster.kubeConfig || '',
  };
  modalVisible.value = true;
};

// 查看集群
const viewCluster = (cluster: Cluster) => {
  router.push(`/dashboard/${cluster.id}`);
};

// 删除集群
const deleteCluster = async (cluster: Cluster) => {
  try {
    loading.value = true;
    // TODO: 调用删除集群的 API
    await new Promise(resolve => setTimeout(resolve, 1000));
    // 重新加载集群列表
    loadClusters();
  } catch (error) {
    console.error('删除集群失败:', error);
  } finally {
    loading.value = false;
  }
};

// 处理对话框确认
const handleModalOk = async () => {
  try {
    await formRef.value?.validate();
    loading.value = true;
    
    if (editingCluster.value) {
      // TODO: 调用更新集群的 API
    } else {
      // TODO: 调用添加集群的 API
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    modalVisible.value = false;
    // 重新加载集群列表
    loadClusters();
  } catch (error) {
    console.error('保存集群失败:', error);
  } finally {
    loading.value = false;
  }
};

// 处理对话框取消
const handleModalCancel = () => {
  modalVisible.value = false;
};

// 加载集群列表
const loadClusters = async () => {
  try {
    loading.value = true;
    // TODO: 调用获取集群列表的 API
    await new Promise(resolve => setTimeout(resolve, 1000));
    // 模拟数据
    clusters.value = [
      {
        id: '1',
        name: '测试集群',
        apiServer: 'https://kubernetes.default.svc',
        status: 'connected',
        createdAt: '2024-01-01T00:00:00Z',
        lastConnected: '2024-01-20T10:00:00Z',
      },
    ];
  } catch (error) {
    console.error('加载集群列表失败:', error);
  } finally {
    loading.value = false;
  }
};

// 组件挂载时加载数据
onMounted(loadClusters);
</script>

<style scoped>
.cluster-list {
  padding: 24px;
}
</style> 