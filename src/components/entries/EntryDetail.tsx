"use client";

import {
  Modal,
  Descriptions,
  Tag,
  Space,
  Typography,
  Divider,
  Card,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  CalendarOutlined,
  TagOutlined,
  FileTextOutlined,
  BarcodeOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Text } = Typography;

interface Entry {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeEmail: string;
  entryTypeId: number;
  entryTypeName: string;
  sku: string;
  entryTime: string;
  hasEvaluation: boolean;
}

interface EntryDetailProps {
  entry: Entry;
  visible: boolean;
  onClose: () => void;
}

export function EntryDetail({ entry, visible, onClose }: EntryDetailProps) {
  return (
    <Modal
      title={
        <Space>
          <FileTextOutlined />
          <span>Entry Details - #{entry.id}</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
      style={{ top: 20 }}
    >
      <Divider style={{ marginTop: 0 }} />

      {/* Entry Information */}
      <Card
        size="small"
        title={
          <Space>
            <TagOutlined />
            <span>Entry Information</span>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Descriptions column={{ xs: 1, sm: 2 }} size="small">
          <Descriptions.Item label="Entry ID">
            <Tag color="blue">#{entry.id}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Entry Type">
            <Tag color="purple">{entry.entryTypeName}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="SKU" span={2}>
            <Space>
              <BarcodeOutlined style={{ fontSize: 16 }} />
              <Text strong style={{ fontSize: 16 }}>
                {entry.sku}
              </Text>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Entry Time" span={2}>
            <Space>
              <CalendarOutlined />
              <Text>
                {dayjs(entry.entryTime).format("YYYY-MM-DD HH:mm:ss")}
              </Text>
            </Space>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Employee Information */}
      <Card
        size="small"
        title={
          <Space>
            <UserOutlined />
            <span>Employee Information</span>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Descriptions column={1} size="small">
          <Descriptions.Item label="Name">
            <Text strong>{entry.employeeName}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Email">
            <Text copyable>{entry.employeeEmail}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Employee ID">
            <Tag>#{entry.employeeId}</Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Evaluation Status */}
      <Card size="small" title="Evaluation Status">
        <Space>
          {entry.hasEvaluation ? (
            <Tag
              icon={<CheckCircleOutlined />}
              color="success"
              style={{ fontSize: "14px", padding: "4px 12px" }}
            >
              This entry has been evaluated
            </Tag>
          ) : (
            <Tag
              icon={<CloseCircleOutlined />}
              color="default"
              style={{ fontSize: "14px", padding: "4px 12px" }}
            >
              Not yet evaluated
            </Tag>
          )}
        </Space>
      </Card>
    </Modal>
  );
}
