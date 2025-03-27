<template>
  <router-view></router-view>
</template>

<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { watch } from 'vue'

const route = useRoute()

// 监听路由变化
watch(
  () => route.path,
  () => {
    // 路由变化时的处理逻辑
  }
)
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
}

#app {
  height: 100%;
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  #app {
    font-size: 14px;
  }
}
</style> 