// 转换为前端期望的格式
func convertToFrontendFormat(workloads []models.Workload) []map[string]interface{} {
	result := make([]map[string]interface{}, len(workloads))
	for i, w := range workloads {
		result[i] = map[string]interface{}{
			"kind": w.Kind,
			"metadata": map[string]interface{}{
				"name":      w.Name,
				"namespace": w.Namespace,
				"labels":    w.Labels,
			},
			"spec": map[string]interface{}{
				"replicas": w.Replicas,
				"template": map[string]interface{}{
					"spec": map[string]interface{}{
						"containers": w.Containers,
					},
				},
			},
			"status": map[string]interface{}{
				"replicas":          w.Status.CurrentReplicas,
				"availableReplicas": w.Status.ReadyReplicas,
				"readyReplicas":     w.Status.ReadyReplicas,
				"updatedReplicas":   w.Status.CurrentReplicas,
				"conditions":        w.Status.Conditions,
			},
		}
	}
	return result
}

