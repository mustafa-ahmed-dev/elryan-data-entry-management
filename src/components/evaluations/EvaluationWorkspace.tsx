import  { useState } from "react";
import {
  Card,
  Descriptions,
  Tag,
  Space,
  Button,
  Empty,
  Typography,
  Divider,
  message,
  Alert,
} from "antd";
import {
  CopyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { EvaluationForm } from "./EvaluationForm";

const { Title, Text, Paragraph } = Typography;

interface Entry {
  id: number;
  productName: string;
  productDescription: string;
  employeeName: string;
  employeeEmail: string;
  entryTypeName: string;
  entryTime: string;
  followsNamingConvention: boolean;
  followsSpecificationOrder: boolean;
  containsUnwantedKeywords: boolean;
  hasEvaluation: boolean;
}

interface EvaluationWorkspaceProps {
  selectedEntry: Entry | null;
  onEvaluationSubmitted: () => void;
  onClearSelection: () => void;
}

export const EvaluationWorkspace: React.FC<EvaluationWorkspaceProps> = ({
  selectedEntry,
  onEvaluationSubmitted,
  onClearSelection,
}) => {
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyEntryId = async () => {
    if (!selectedEntry) return;

    try {
      await navigator.clipboard.writeText(selectedEntry.id.toString());
      setCopySuccess(true);
      message.success("Entry ID copied to clipboard");
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      message.error("Failed to copy entry ID");
    }
  };

  const handleStartEvaluation = () => {
    setIsEvaluating(true);
    setShowSuccess(false);
  };

  const handleEvaluationSuccess = () => {
    setShowSuccess(true);
    setIsEvaluating(false);

    // Clear selection and refresh after a short delay to show success message
    setTimeout(() => {
      onClearSelection();
      onEvaluationSubmitted();
      setShowSuccess(false);
    }, 2000);
  };

  const handleCancelEvaluation = () => {
    setIsEvaluating(false);
  };

  const getQualityCheckStatus = (value: boolean, isNegative = false) => {
    const isGood = isNegative ? !value : value;
    return isGood ? (
      <Tag icon={<CheckCircleOutlined />} color="success">
        Pass
      </Tag>
    ) : (
      <Tag icon={<CloseCircleOutlined />} color="error">
        Fail
      </Tag>
    );
  };

  const getQualitySummary = (entry: Entry) => {
    const issues = [
      { label: "Naming Convention", status: !entry.followsNamingConvention },
      {
        label: "Specification Order",
        status: !entry.followsSpecificationOrder,
      },
      { label: "Unwanted Keywords", status: entry.containsUnwantedKeywords },
    ].filter((issue) => issue.status);

    if (issues.length === 0) {
      return (
        <Alert
          message="All quality checks passed"
          type="success"
          icon={<CheckCircleOutlined />}
          showIcon
        />
      );
    }

    return (
      <Alert
        message={`${issues.length} quality ${
          issues.length === 1 ? "issue" : "issues"
        } detected`}
        description={
          <ul style={{ margin: "8px 0 0 0", paddingLeft: "20px" }}>
            {issues.map((issue, index) => (
              <li key={index}>{issue.label}</li>
            ))}
          </ul>
        }
        type="warning"
        icon={<WarningOutlined />}
        showIcon
      />
    );
  };

  if (!selectedEntry) {
    return (
      <Card
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Empty
          description={
            <Space orientation="vertical" align="center">
              <Text type="secondary">No entry selected</Text>
              <Text type="secondary" style={{ fontSize: "14px" }}>
                Select an entry from the list to start evaluating
              </Text>
            </Space>
          }
        />
      </Card>
    );
  }

  return (
    <Card
      style={{ height: "100%", display: "flex", flexDirection: "column" }}
      styles={{ body: { flex: 1, overflow: "auto" } }}
    >
      {showSuccess && (
        <Alert
          message="Evaluation Submitted Successfully"
          description="The entry has been evaluated. Loading next entry..."
          type="success"
          icon={<CheckOutlined />}
          showIcon
          closable
          style={{ marginBottom: "16px" }}
        />
      )}

      <Space orientation="vertical" size="large" style={{ width: "100%" }}>
        {/* Header */}
        <div>
          <Space
            align="start"
            style={{ width: "100%", justifyContent: "space-between" }}
          >
            <Space orientation="vertical" size={0}>
              <Title level={4} style={{ margin: 0 }}>
                {selectedEntry.productName}
              </Title>
              <Space>
                <Text type="secondary">Entry ID:</Text>
                <Text strong>{selectedEntry.id}</Text>
                <Button
                  type="text"
                  size="small"
                  icon={copySuccess ? <CheckOutlined /> : <CopyOutlined />}
                  onClick={handleCopyEntryId}
                  style={{ color: copySuccess ? "#52c41a" : undefined }}
                />
              </Space>
            </Space>
            <Tag color="blue">{selectedEntry.entryTypeName}</Tag>
          </Space>
        </div>

        <Divider style={{ margin: 0 }} />

        {/* Entry Details */}
        <div>
          <Title level={5}>Entry Details</Title>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Product Name">
              {selectedEntry.productName}
            </Descriptions.Item>
            <Descriptions.Item label="Product Description">
              <Paragraph
                ellipsis={{ rows: 3, expandable: true, symbol: "more" }}
                style={{ margin: 0 }}
              >
                {selectedEntry.productDescription}
              </Paragraph>
            </Descriptions.Item>
            <Descriptions.Item label="Employee">
              <Space orientation="vertical" size={0}>
                <Text>{selectedEntry.employeeName}</Text>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  {selectedEntry.employeeEmail}
                </Text>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Entry Type">
              {selectedEntry.entryTypeName}
            </Descriptions.Item>
            <Descriptions.Item label="Entry Time">
              {dayjs(selectedEntry.entryTime).format("MMMM D, YYYY h:mm A")}
            </Descriptions.Item>
          </Descriptions>
        </div>

        <Divider style={{ margin: 0 }} />

        {/* Quality Checks */}
        <div>
          <Title level={5}>Quality Checks</Title>
          <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
            {getQualitySummary(selectedEntry)}

            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Naming Convention">
                {getQualityCheckStatus(selectedEntry.followsNamingConvention)}
              </Descriptions.Item>
              <Descriptions.Item label="Specification Order">
                {getQualityCheckStatus(selectedEntry.followsSpecificationOrder)}
              </Descriptions.Item>
              <Descriptions.Item label="Unwanted Keywords">
                {getQualityCheckStatus(
                  selectedEntry.containsUnwantedKeywords,
                  true
                )}
              </Descriptions.Item>
            </Descriptions>
          </Space>
        </div>

        <Divider style={{ margin: 0 }} />

        {/* Evaluation Section */}
        {!isEvaluating ? (
          <div>
            <Button
              type="primary"
              size="large"
              onClick={handleStartEvaluation}
              block
              disabled={showSuccess}
            >
              Start Evaluation
            </Button>
          </div>
        ) : (
          <div>
            <Title level={5}>Evaluation Form</Title>
            <EvaluationForm
              entryId={selectedEntry.id}
              onSubmit={handleEvaluationSuccess}
              onCancel={handleCancelEvaluation}
            />
          </div>
        )}
      </Space>
    </Card>
  );
};
