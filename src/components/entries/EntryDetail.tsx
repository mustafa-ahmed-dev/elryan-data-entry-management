"use client";

import { useState } from "react";
import {
  Modal,
  Descriptions,
  Tag,
  Space,
  Typography,
  Divider,
  Card,
  Row,
  Col,
  Badge,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  CalendarOutlined,
  TagOutlined,
  FileTextOutlined,
  SafetyOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Text, Paragraph, Title } = Typography;

interface Entry {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeEmail: string;
  entryTypeId: number;
  entryTypeName: string;
  productName: string;
  productDescription: string;
  followsNamingConvention: boolean;
  followsSpecificationOrder: boolean;
  containsUnwantedKeywords: boolean;
  entryTime: string;
  hasEvaluation: boolean;
}

interface EntryDetailProps {
  entry: Entry;
  visible: boolean;
  onClose: () => void;
}

export function EntryDetail({ entry, visible, onClose }: EntryDetailProps) {
  const [expanded, setExpanded] = useState(false);

  // Calculate quality status
  const qualityChecks = [
    {
      label: "Follows Naming Convention",
      value: entry.followsNamingConvention,
      icon: entry.followsNamingConvention ? (
        <CheckCircleOutlined />
      ) : (
        <CloseCircleOutlined />
      ),
      color: entry.followsNamingConvention ? "success" : "error",
    },
    {
      label: "Follows Specification Order",
      value: entry.followsSpecificationOrder,
      icon: entry.followsSpecificationOrder ? (
        <CheckCircleOutlined />
      ) : (
        <CloseCircleOutlined />
      ),
      color: entry.followsSpecificationOrder ? "success" : "error",
    },
    {
      label: "No Unwanted Keywords",
      value: !entry.containsUnwantedKeywords,
      icon: !entry.containsUnwantedKeywords ? (
        <CheckCircleOutlined />
      ) : (
        <CloseCircleOutlined />
      ),
      color: !entry.containsUnwantedKeywords ? "success" : "error",
    },
  ];

  const passedChecks = qualityChecks.filter((check) => check.value).length;
  const totalChecks = qualityChecks.length;

  const getOverallQualityStatus = () => {
    if (passedChecks === totalChecks) {
      return { color: "success", text: "Excellent", badge: "success" };
    } else if (passedChecks >= totalChecks - 1) {
      return { color: "warning", text: "Good", badge: "warning" };
    } else {
      return { color: "error", text: "Needs Improvement", badge: "error" };
    }
  };

  const overallStatus = getOverallQualityStatus();

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
      width={800}
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
          <Descriptions.Item label="Product Name" span={2}>
            <Text strong>{entry.productName}</Text>
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
            {entry.employeeName}
          </Descriptions.Item>
          <Descriptions.Item label="Email">
            {entry.employeeEmail}
          </Descriptions.Item>
          <Descriptions.Item label="Employee ID">
            <Tag>#{entry.employeeId}</Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Product Description */}
      <Card
        size="small"
        title={
          <Space>
            <FileTextOutlined />
            <span>Product Description</span>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Paragraph
          ellipsis={
            expanded
              ? false
              : {
                  rows: 3,
                  expandable: true,
                  symbol: "Show more",
                  onExpand: () => setExpanded(true),
                }
          }
          style={{ marginBottom: 0 }}
        >
          {entry.productDescription}
        </Paragraph>
        {expanded && (
          <a
            onClick={() => setExpanded(false)}
            style={{ fontSize: "14px", marginTop: 8, display: "inline-block" }}
          >
            Show less
          </a>
        )}
      </Card>

      {/* Quality Checks */}
      <Card
        size="small"
        title={
          <Space>
            <SafetyOutlined />
            <span>Quality Checks</span>
            <Badge
              status={overallStatus.badge as any}
              text={overallStatus.text}
            />
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Space orientation="vertical" style={{ width: "100%" }} size="middle">
          {qualityChecks.map((check, index) => (
            <Row key={index} align="middle" gutter={8}>
              <Col flex="none">
                <Tag
                  icon={check.icon}
                  color={check.color}
                  style={{ minWidth: 70, textAlign: "center" }}
                >
                  {check.value ? "Pass" : "Fail"}
                </Tag>
              </Col>
              <Col flex="auto">
                <Text>{check.label}</Text>
              </Col>
            </Row>
          ))}
        </Space>

        <Divider style={{ margin: "12px 0" }} />

        <Row justify="space-between">
          <Col>
            <Text strong>Overall Score:</Text>
          </Col>
          <Col>
            <Text strong style={{ color: overallStatus.color }}>
              {passedChecks} / {totalChecks} Checks Passed
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Evaluation Status */}
      <Card size="small" title="Evaluation Status">
        <Space>
          {entry.hasEvaluation ? (
            <>
              <Tag
                icon={<CheckCircleOutlined />}
                color="success"
                style={{ fontSize: "14px" }}
              >
                This entry has been evaluated
              </Tag>
            </>
          ) : (
            <>
              <Tag
                icon={<CloseCircleOutlined />}
                color="default"
                style={{ fontSize: "14px" }}
              >
                Not yet evaluated
              </Tag>
            </>
          )}
        </Space>
      </Card>
    </Modal>
  );
}
