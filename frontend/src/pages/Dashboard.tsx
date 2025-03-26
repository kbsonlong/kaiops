import React from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import { ClusterOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';

const Dashboard: React.FC = () => {
  return (
    <div>
      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Statistic
              title="集群总数"
              value={5}
              prefix={<ClusterOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="正常运行"
              value={4}
              prefix={<CheckCircleOutlined style={{ color: '#3f8600' }} />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="异常集群"
              value={1}
              prefix={<WarningOutlined style={{ color: '#cf1322' }} />}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard; 