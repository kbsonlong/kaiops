<template>
  <a-layout class="layout">
    <a-layout-sider v-model:collapsed="collapsed" collapsible>
      <div class="logo">K8s Dashboard</div>
      <template v-if="clusterId">
        <a-menu
          v-model:selectedKeys="selectedKeys"
          theme="dark"
          mode="inline"
        >
          <a-menu-item key="clusters" @click="$router.push('/')">
            <template #icon><ClusterOutlined /></template>
            <span>集群列表</span>
          </a-menu-item>
          <a-menu-item key="dashboard" @click="$router.push(`/dashboard/${clusterId}`)">
            <template #icon><DashboardOutlined /></template>
            <span>仪表盘</span>
          </a-menu-item>
          <a-menu-item key="nodes" @click="$router.push(`/nodes/${clusterId}`)">
            <template #icon><CloudServerOutlined /></template>
            <span>节点</span>
          </a-menu-item>
          <a-menu-item key="pods" @click="$router.push(`/pods/${clusterId}`)">
            <template #icon><AppstoreOutlined /></template>
            <span>Pod</span>
          </a-menu-item>
          <a-menu-item key="services" @click="$router.push(`/services/${clusterId}`)">
            <template #icon><ApiOutlined /></template>
            <span>服务</span>
          </a-menu-item>
        </a-menu>
      </template>
    </a-layout-sider>
    <a-layout>
      <a-layout-header class="header">
        <a-space>
          <reload-outlined
            :class="{ 'loading-icon': isLoading }"
            @click="handleRefresh"
          />
        </a-space>
      </a-layout-header>
      <a-layout-content class="content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  DashboardOutlined,
  CloudServerOutlined,
  AppstoreOutlined,
  ApiOutlined,
  ReloadOutlined,
  ClusterOutlined,
} from '@ant-design/icons-vue';

const route = useRoute();
const router = useRouter();
const collapsed = ref(false);
const isLoading = ref(false);
const selectedKeys = ref<string[]>(['clusters']);

// 获取当前集群 ID
const clusterId = computed(() => route.params.clusterId as string);

// 根据路由更新选中的菜单项
watch(
  () => route.path,
  (path) => {
    const segments = path.split('/');
    const key = segments[1] || 'clusters';
    selectedKeys.value = [key];
  },
  { immediate: true }
);

// 刷新当前页面组件
const handleRefresh = () => {
  isLoading.value = true;
  // 触发当前组件的重新加载
  setTimeout(() => {
    isLoading.value = false;
  }, 1000);
};
</script>

<style scoped>
.layout {
  min-height: 100vh;
}

.logo {
  height: 32px;
  margin: 16px;
  color: white;
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  line-height: 32px;
  white-space: nowrap;
  overflow: hidden;
}

.header {
  padding: 0 24px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.content {
  margin: 0;
  min-height: 280px;
  background: #f0f2f5;
}

.loading-icon {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style> 