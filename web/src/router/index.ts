import { createRouter, createWebHistory } from 'vue-router'
import Layout from '../components/Layout.vue'
import ClusterList from '../components/ClusterList.vue'
import Dashboard from '../components/Dashboard.vue'
import Nodes from '../components/Nodes.vue'
import Pods from '../components/Pods.vue'
import Services from '../components/Services.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: Layout,
      children: [
        {
          path: '',
          name: 'ClusterList',
          component: ClusterList,
        },
        {
          path: 'dashboard/:clusterId',
          name: 'Dashboard',
          component: Dashboard,
        },
        {
          path: 'nodes/:clusterId',
          name: 'Nodes',
          component: Nodes,
        },
        {
          path: 'pods/:clusterId',
          name: 'Pods',
          component: Pods,
        },
        {
          path: 'services/:clusterId',
          name: 'Services',
          component: Services,
        },
      ],
    },
  ],
})

export default router 