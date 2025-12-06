/**
 * Evaluation Detail Component
 *
 * Displays detailed evaluation information
 */

"use client";

import {
  Card,
  Descriptions,
  Tag,
  Progress,
  List,
  Typography,
  Space,
  Divider,
  Empty,
} from "antd";
import {
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text, Paragraph } = Typography;

interface Violation {
  ruleId: number;
  ruleName: string;
  deduction: number;
}

interface EvaluationDetailProps {
  evaluation: {
    id: number;
    entryId: number;
    employeeId: number;
    employeeName: string;
    evaluatorId: number;
    ruleSetId?: number;
    ruleSetName?: string;
    totalScore: number;
    violations: Violation[];
    comments: string | null;
    evaluatedAt: Date;
  };
}

export function EvaluationDetail({ evaluation }: EvaluationDetailProps) {
  const { totalScore, violations, comments } = evaluation;

  // Determine score status
  const getScoreStatus = (score: number) => {
    if (score >= 90)
      return { color: "success", icon: <TrophyOutlined />, text: "Excellent" };
    if (score >= 80)
      return { color: "success", icon: <CheckCircleOutlined />, text: "Good" };
    if (score >= 60)
      return {
        color: "warning",
        icon: <WarningOutlined />,
        text: "Needs Improvement",
      };
    return { color: "error", icon: <CloseCircleOutlined />, text: "Poor" };
  };

  const scoreStatus = getScoreStatus(totalScore);

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      {/* Score Overview */}
      <Card>
        <div style={{ textAlign: "center" }}>
          <Title level={4} style={{ marginBottom: "16px" }}>
            Evaluation Score
          </Title>
          <Progress
            type="circle"
            percent={totalScore}
            strokeColor={
              totalScore >= 80
                ? "#52c41a"
                : totalScore >= 60
                ? "#faad14"
                : "#ff4d4f"
            }
            format={(percent) => (
              <div>
                <div style={{ fontSize: "32px", fontWeight: "bold" }}>
                  {percent}
                </div>
                <div style={{ fontSize: "14px", color: "#666" }}>/ 100</div>
              </div>
            )}
          />
          <div style={{ marginTop: "16px" }}>
            <Tag
              color={scoreStatus.color}
              icon={scoreStatus.icon}
              style={{ fontSize: "16px", padding: "8px 16px" }}
            >
              {scoreStatus.text}
            </Tag>
          </div>
        </div>
      </Card>

      {/* Evaluation Details */}
      <Card title="Evaluation Details">
        <Descriptions column={2} bordered>
          <Descriptions.Item label="Evaluation ID">
            #{evaluation.id}
          </Descriptions.Item>
          <Descriptions.Item label="Entry ID">
            #{evaluation.entryId}
          </Descriptions.Item>
          <Descriptions.Item label="Employee">
            {evaluation.employeeName}
          </Descriptions.Item>
          <Descriptions.Item label="Evaluated At">
            {dayjs(evaluation.evaluatedAt).format("MMMM D, YYYY HH:mm")}
          </Descriptions.Item>
          {evaluation.ruleSetName && (
            <Descriptions.Item label="Rule Set" span={2}>
              {evaluation.ruleSetName}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* Violations */}
      <Card
        title={
          <Space>
            <span>Violations</span>
            <Tag color={violations.length === 0 ? "success" : "warning"}>
              {violations.length}{" "}
              {violations.length === 1 ? "violation" : "violations"}
            </Tag>
          </Space>
        }
      >
        {violations.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Space direction="vertical" size="small">
                <CheckCircleOutlined
                  style={{ fontSize: "48px", color: "#52c41a" }}
                />
                <Text strong>No violations found</Text>
                <Text type="secondary">
                  This entry meets all quality standards
                </Text>
              </Space>
            }
          />
        ) : (
          <List
            dataSource={violations}
            renderItem={(violation) => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        background: "#fff1f0",
                        border: "2px solid #ffccc7",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                        fontSize: "16px",
                        color: "#cf1322",
                      }}
                    >
                      -{violation.deduction}
                    </div>
                  }
                  title={
                    <Space>
                      <Text strong>{violation.ruleName}</Text>
                      <Tag color="error">Rule #{violation.ruleId}</Tag>
                    </Space>
                  }
                  description={
                    <Text type="secondary">
                      Deducted {violation.deduction} points from total score
                    </Text>
                  }
                />
              </List.Item>
            )}
          />
        )}

        {violations.length > 0 && (
          <>
            <Divider />
            <div
              style={{
                background: "#fff7e6",
                border: "1px solid #ffd591",
                borderRadius: "4px",
                padding: "12px",
              }}
            >
              <Text strong>Total Deductions: </Text>
              <Text type="danger" style={{ fontSize: "16px" }}>
                -{violations.reduce((sum, v) => sum + v.deduction, 0)} points
              </Text>
            </div>
          </>
        )}
      </Card>

      {/* Comments */}
      {comments && (
        <Card title="Evaluator Comments">
          <Paragraph
            style={{
              background: "#f5f5f5",
              padding: "16px",
              borderRadius: "4px",
              margin: 0,
            }}
          >
            {comments}
          </Paragraph>
        </Card>
      )}
    </Space>
  );
}
