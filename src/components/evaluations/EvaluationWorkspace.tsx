"use client";

import { useState, useEffect } from "react";
import {
  Layout,
  Card,
  Space,
  Typography,
  Descriptions,
  Tag,
  Divider,
  Button,
  message,
  theme,
  Input,
} from "antd";
import {
  CheckOutlined,
  CopyOutlined,
  BarcodeOutlined,
  UserOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Sider, Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;
const { useToken } = theme;

interface Entry {
  id: number;
  sku: string;
  employeeId: number;
  employeeName: string;
  employeeEmail: string;
  entryTypeId: number;
  entryTypeName: string;
  entryTime: string;
  hasEvaluation: boolean;
}

interface EvaluationRule {
  id: number;
  ruleName: string;
  deductionPoints: number;
  description: string | null;
}

interface EvaluationWorkspaceProps {
  selectedEntry: Entry | null;
  onEvaluationSubmitted: () => void;
  onClearSelection: () => void;
}

export const EvaluationWorkspace: React.FC<EvaluationWorkspaceProps> = ({
  selectedEntry,
  onEvaluationSubmitted,
}) => {
  const { token } = useToken();
  const [copySuccess, setCopySuccess] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [selectedViolations, setSelectedViolations] = useState<number[]>([]);
  const [comments, setComments] = useState("");
  const [evaluationRules, setEvaluationRules] = useState<EvaluationRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRules, setLoadingRules] = useState(false);

  // Fetch active rule set and its rules when starting evaluation
  useEffect(() => {
    if (isEvaluating) {
      fetchEvaluationRules();
    }
  }, [isEvaluating]);

  const fetchEvaluationRules = async () => {
    setLoadingRules(true);
    try {
      // First, get the active rule set
      const ruleSetsResponse = await fetch("/api/rule-sets");
      if (!ruleSetsResponse.ok) throw new Error("Failed to fetch rule sets");

      const ruleSetsData = await ruleSetsResponse.json();
      const activeRuleSet = ruleSetsData.data?.find((rs: any) => rs.isActive);

      if (!activeRuleSet) {
        message.error(
          "No active rule set found. Please activate a rule set first."
        );
        setEvaluationRules([]);
        return;
      }

      // Then, get the rules for the active rule set
      const rulesResponse = await fetch(
        `/api/rules?ruleSetId=${activeRuleSet.id}`
      );
      if (!rulesResponse.ok) throw new Error("Failed to fetch rules");

      const rulesData = await rulesResponse.json();
      setEvaluationRules(rulesData.data || []);

      if (!rulesData.data || rulesData.data.length === 0) {
        message.warning(
          "The active rule set has no rules. Please add rules first."
        );
      }
    } catch (error) {
      console.error("Failed to fetch evaluation rules:", error);
      message.error("Failed to load evaluation rules");
      setEvaluationRules([]);
    } finally {
      setLoadingRules(false);
    }
  };

  if (!selectedEntry) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "400px",
        }}
      >
        <Text type="secondary">Select an entry to begin evaluation</Text>
      </div>
    );
  }

  const handleCopyEntryId = () => {
    navigator.clipboard.writeText(selectedEntry.id.toString());
    setCopySuccess(true);
    message.success("Entry ID copied!");
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleStartEvaluation = () => {
    setIsEvaluating(true);
    setSelectedViolations([]);
    setComments("");
  };

  const handleCancelEvaluation = () => {
    setIsEvaluating(false);
    setSelectedViolations([]);
    setComments("");
  };

  const handleSubmitEvaluation = async () => {
    try {
      setLoading(true);

      // Get active rule set
      const ruleSetsResponse = await fetch("/api/rule-sets");
      const ruleSetsData = await ruleSetsResponse.json();
      const activeRuleSet = ruleSetsData.data?.find((rs: any) => rs.isActive);

      if (!activeRuleSet) {
        message.error("No active rule set found");
        return;
      }

      const violations = selectedViolations.map((ruleId) => {
        const rule = evaluationRules.find((r) => r.id === ruleId);
        return {
          ruleId,
          ruleName: rule?.ruleName || "",
          deduction: rule?.deductionPoints || 0,
        };
      });

      const totalDeduction = violations.reduce(
        (sum, v) => sum + v.deduction,
        0
      );
      const totalScore = Math.max(0, 100 - totalDeduction);

      const response = await fetch("/api/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryId: selectedEntry.id,
          ruleSetId: activeRuleSet.id,
          totalScore,
          violations,
          comments: comments.trim() || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit evaluation");
      }

      message.success("Evaluation submitted successfully!");
      handleCancelEvaluation();
      onEvaluationSubmitted();
    } catch (error: any) {
      message.error(error.message || "Failed to submit evaluation");
    } finally {
      setLoading(false);
    }
  };

  const toggleViolation = (ruleId: number) => {
    setSelectedViolations((prev) =>
      prev.includes(ruleId)
        ? prev.filter((id) => id !== ruleId)
        : [...prev, ruleId]
    );
  };

  const calculateScore = () => {
    const totalDeduction = selectedViolations.reduce((sum, ruleId) => {
      const rule = evaluationRules.find((r) => r.id === ruleId);
      return sum + (rule?.deductionPoints || 0);
    }, 0);
    return Math.max(0, 100 - totalDeduction);
  };

  return (
    <Layout style={{ background: "transparent" }}>
      <Sider
        width={400}
        style={{ padding: "16px", background: token.colorBgContainer }}
      >
        <div style={{ marginBottom: 16 }}>
          <Space orientation="vertical" size={0} style={{ width: "100%" }}>
            <Space style={{ width: "100%", justifyContent: "space-between" }}>
              <Space>
                <Text strong style={{ fontSize: 18 }}>
                  Entry #{selectedEntry.id}
                </Text>
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
            <Descriptions.Item label="SKU">
              <Space>
                <BarcodeOutlined />
                <Text strong>{selectedEntry.sku}</Text>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Employee">
              <Space orientation="vertical" size={0}>
                <Space>
                  <UserOutlined />
                  <Text>{selectedEntry.employeeName}</Text>
                </Space>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  {selectedEntry.employeeEmail}
                </Text>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Entry Type">
              {selectedEntry.entryTypeName}
            </Descriptions.Item>
            <Descriptions.Item label="Entry Time">
              <Space>
                <CalendarOutlined />
                <Text>
                  {dayjs(selectedEntry.entryTime).format("MMMM D, YYYY h:mm A")}
                </Text>
              </Space>
            </Descriptions.Item>
          </Descriptions>
        </div>

        <Divider style={{ margin: "16px 0" }} />

        {/* Evaluation Status */}
        <div>
          <Title level={5}>Evaluation Status</Title>
          {selectedEntry.hasEvaluation ? (
            <Tag color="success" style={{ fontSize: 14, padding: "4px 12px" }}>
              Already Evaluated
            </Tag>
          ) : (
            <Tag color="default" style={{ fontSize: 14, padding: "4px 12px" }}>
              Not Yet Evaluated
            </Tag>
          )}
        </div>
      </Sider>

      <Content style={{ padding: "16px", marginLeft: 16 }}>
        {!isEvaluating ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
            }}
          >
            <Title level={4}>Ready to Evaluate?</Title>
            <Text type="secondary" style={{ marginBottom: 16 }}>
              Click the button below to start evaluating this entry.
            </Text>
            <Button
              type="primary"
              size="large"
              onClick={handleStartEvaluation}
              disabled={selectedEntry.hasEvaluation}
            >
              Start Evaluation
            </Button>
          </div>
        ) : (
          <Card
            title="Evaluate Entry"
            style={{ height: "100%" }}
            loading={loadingRules}
          >
            <Space
              orientation="vertical"
              size="large"
              style={{ width: "100%" }}
            >
              <div>
                <Title level={5}>Select Violations</Title>
                <Space orientation="vertical" style={{ width: "100%" }}>
                  {Array.isArray(evaluationRules) &&
                  evaluationRules.length > 0 ? (
                    evaluationRules.map((rule) => (
                      <Card
                        key={rule.id}
                        size="small"
                        hoverable
                        onClick={() => toggleViolation(rule.id)}
                        style={{
                          cursor: "pointer",
                          borderColor: selectedViolations.includes(rule.id)
                            ? token.colorPrimary
                            : token.colorBorder,
                          backgroundColor: selectedViolations.includes(rule.id)
                            ? token.colorPrimaryBg
                            : token.colorBgContainer,
                        }}
                      >
                        <Space orientation="vertical" size={0}>
                          <Text strong>{rule.ruleName}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            -{rule.deductionPoints} points
                          </Text>
                          {rule.description && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {rule.description}
                            </Text>
                          )}
                        </Space>
                      </Card>
                    ))
                  ) : (
                    <Card size="small">
                      <Text type="secondary">
                        No evaluation rules available. Please create an active
                        rule set with rules in Settings.
                      </Text>
                    </Card>
                  )}
                </Space>
              </div>

              <div>
                <Title level={5}>Comments (Optional)</Title>
                <TextArea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Add any additional comments..."
                  rows={4}
                  style={{ resize: "vertical" }}
                />
              </div>

              <Card size="small">
                <Space orientation="vertical" size={0}>
                  <Text type="secondary">Calculated Score:</Text>
                  <Title
                    level={2}
                    style={{ margin: 0, color: token.colorPrimary }}
                  >
                    {calculateScore()} / 100
                  </Title>
                </Space>
              </Card>

              <Space>
                <Button
                  type="primary"
                  onClick={handleSubmitEvaluation}
                  loading={loading}
                  disabled={evaluationRules.length === 0}
                >
                  Submit Evaluation
                </Button>
                <Button onClick={handleCancelEvaluation}>Cancel</Button>
              </Space>
            </Space>
          </Card>
        )}
      </Content>
    </Layout>
  );
};
