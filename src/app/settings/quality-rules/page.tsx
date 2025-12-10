/**
 * Quality Rules Settings Page
 *
 * Admin interface for managing evaluation rule sets and rules
 */

"use client";

import { useState } from "react";
import {
  Card,
  Button,
  Space,
  message,
  Modal,
  Tabs,
  Alert,
  Statistic,
  Row,
  Col,
  Divider,
} from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  StarOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { ProtectedRoute } from "@/components/auth";
import { MainLayout } from "@/components/layout";
import {
  RuleSetTable,
  RuleSetForm,
  RulesList,
  RuleForm,
} from "@/components/settings";
import { useRuleSets, useRuleSet, useRules } from "@/lib/hooks";

export default function QualityRulesPage() {
  return (
    <ProtectedRoute
      requiredPermission={{ action: "update", resource: "evaluations" }}
    >
      <MainLayout>
        <QualityRulesContent />
      </MainLayout>
    </ProtectedRoute>
  );
}

function QualityRulesContent() {
  const [isRuleSetFormOpen, setIsRuleSetFormOpen] = useState(false);
  const [isRuleFormOpen, setIsRuleFormOpen] = useState(false);
  const [editingRuleSet, setEditingRuleSet] = useState<any>(null);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [viewingRuleSetId, setViewingRuleSetId] = useState<number | null>(null);

  // Rule sets hook
  const {
    ruleSets,
    isLoading: ruleSetsLoading,
    createRuleSet,
    updateRuleSet,
    deleteRuleSet,
    activateRuleSet,
    deactivateRuleSet,
    isCreating: isCreatingRuleSet,
    isUpdating: isUpdatingRuleSet,
    isDeleting: isDeletingRuleSet,
    isActivating,
    refresh: refreshRuleSets,
    isDeactivating,
  } = useRuleSets();

  // Rules hook (for viewing rule set details)
  const { ruleSet: viewingRuleSet, isLoading: ruleSetLoading } =
    useRuleSet(viewingRuleSetId);

  const {
    rules,
    isLoading: rulesLoading,
    createRule,
    updateRule,
    deleteRule,
    isCreating: isCreatingRule,
    isUpdating: isUpdatingRule,
    isDeleting: isDeletingRule,
  } = useRules(viewingRuleSetId || undefined);

  // Calculate statistics
  const activeRuleSet = ruleSets.find((rs: any) => rs.isActive);
  const totalRuleSets = ruleSets.length;
  const inactiveRuleSets = ruleSets.filter((rs: any) => !rs.isActive).length;

  // Handle create rule set
  const handleCreateRuleSet = () => {
    setEditingRuleSet(null);
    setIsRuleSetFormOpen(true);
  };

  // Handle edit rule set
  const handleEditRuleSet = (ruleSet: any) => {
    setEditingRuleSet(ruleSet);
    setIsRuleSetFormOpen(true);
  };

  // Handle view rule set
  const handleViewRuleSet = (ruleSet: any) => {
    setViewingRuleSetId(ruleSet.id);
  };

  // Handle delete rule set
  const handleDeleteRuleSet = async (ruleSetId: number) => {
    const result = await deleteRuleSet(ruleSetId);
    if (result.success) {
      message.success("Rule set deleted successfully");
    } else {
      message.error(result.error || "Failed to delete rule set");
    }
  };

  const handleDeactivateRuleSet = async (ruleSetId: number) => {
    const result = await deactivateRuleSet(ruleSetId);
    if (result.success) {
      message.success(result.message || "Rule set deactivated successfully");
    } else {
      message.error(result.error || "Failed to deactivate rule set");
    }
  };

  // Handle activate rule set
  const handleActivateRuleSet = async (ruleSetId: number) => {
    const result = await activateRuleSet(ruleSetId);
    if (result.success) {
      message.success(result.message || "Rule set activated successfully");
    } else {
      message.error(result.error || "Failed to activate rule set");
    }
  };

  // Handle rule set form submit
  const handleRuleSetFormSubmit = async (values: any) => {
    let result;

    if (editingRuleSet) {
      result = await updateRuleSet(editingRuleSet.id, values);
    } else {
      result = await createRuleSet(values);
    }

    if (result.success) {
      message.success(
        editingRuleSet
          ? "Rule set updated successfully"
          : "Rule set created successfully"
      );
      setIsRuleSetFormOpen(false);
      setEditingRuleSet(null);
    } else {
      message.error(result.error || "Failed to save rule set");
    }
  };

  // Handle add rule
  const handleAddRule = () => {
    if (!viewingRuleSetId) {
      message.error("Please select a rule set first");
      return;
    }
    setEditingRule(null);
    setIsRuleFormOpen(true);
  };

  // Handle edit rule
  const handleEditRule = (rule: any) => {
    setEditingRule(rule);
    setIsRuleFormOpen(true);
  };

  // Handle delete rule
  const handleDeleteRule = async (ruleId: number) => {
    const result = await deleteRule(ruleId);
    if (result.success) {
      message.success("Rule deleted successfully");
    } else {
      message.error(result.error || "Failed to delete rule");
    }
  };

  // Handle rule form submit
  const handleRuleFormSubmit = async (values: any) => {
    let result;

    if (editingRule) {
      result = await updateRule(editingRule.id, values);
    } else {
      result = await createRule(values);
    }

    if (result.success) {
      message.success(
        editingRule ? "Rule updated successfully" : "Rule added successfully"
      );
      setIsRuleFormOpen(false);
      setEditingRule(null);
    } else {
      message.error(result.error || "Failed to save rule");
    }
  };

  return (
    <div style={{ padding: "24px" }}>
      {/* Page Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 600, margin: 0 }}>
          Quality Rules Management
        </h1>
        <p style={{ color: "#666", margin: "8px 0 0 0" }}>
          Create and manage evaluation rule sets and quality standards
        </p>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Total Rule Sets"
              value={totalRuleSets}
              prefix={<FileTextOutlined />}
              styles={{ content: { color: "#1890ff" } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Active Rule Set"
              value={activeRuleSet ? "1" : "0"}
              prefix={<StarOutlined />}
              styles={{
                content: { color: activeRuleSet ? "#52c41a" : "#ff4d4f" },
              }}
              suffix={activeRuleSet && `(${activeRuleSet.name})`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Inactive Rule Sets"
              value={inactiveRuleSets}
              prefix={<CheckCircleOutlined />}
              styles={{ content: { color: "#666" } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Tabs
        defaultActiveKey="ruleSets"
        items={[
          {
            key: "ruleSets",
            label: "Rule Sets",
            children: (
              <Card>
                <Space
                  style={{
                    width: "100%",
                    justifyContent: "space-between",
                    marginBottom: "16px",
                  }}
                >
                  <Space>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleCreateRuleSet}
                    >
                      Create Rule Set
                    </Button>
                    <Button icon={<ReloadOutlined />} onClick={refreshRuleSets}>
                      Refresh
                    </Button>
                  </Space>
                </Space>

                {!activeRuleSet && totalRuleSets > 0 && (
                  <Alert
                    title="No Active Rule Set"
                    description="Please activate a rule set to use it for evaluations. Click the star icon next to a rule set to activate it."
                    type="warning"
                    showIcon
                    style={{ marginBottom: "16px" }}
                  />
                )}

                {totalRuleSets === 0 && !ruleSetsLoading && (
                  <Alert
                    title="Get Started"
                    description="Create your first rule set to define quality standards for evaluations."
                    type="info"
                    showIcon
                    style={{ marginBottom: "16px" }}
                  />
                )}

                <RuleSetTable
                  ruleSets={ruleSets}
                  loading={ruleSetsLoading || isDeletingRuleSet || isActivating}
                  onView={handleViewRuleSet}
                  onEdit={handleEditRuleSet}
                  onDelete={handleDeleteRuleSet}
                  onActivate={handleActivateRuleSet}
                  onDeactivate={handleDeactivateRuleSet}
                />
              </Card>
            ),
          },
        ]}
      />

      {/* Rule Set Form Modal */}
      <RuleSetForm
        open={isRuleSetFormOpen}
        ruleSet={editingRuleSet}
        onSubmit={handleRuleSetFormSubmit}
        onCancel={() => {
          setIsRuleSetFormOpen(false);
          setEditingRuleSet(null);
        }}
        loading={isCreatingRuleSet || isUpdatingRuleSet}
      />

      {/* Rule Set Details Modal */}
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            {viewingRuleSet?.name || "Rule Set Details"}
          </Space>
        }
        open={!!viewingRuleSetId}
        onCancel={() => setViewingRuleSetId(null)}
        footer={[
          <Button key="close" onClick={() => setViewingRuleSetId(null)}>
            Close
          </Button>,
        ]}
        width={1000}
        destroyOnHidden
      >
        {viewingRuleSet && (
          <div>
            {/* Rule Set Info */}
            <Card size="small" style={{ marginBottom: "16px" }}>
              <Row gutter={16}>
                <Col span={12}>
                  <p>
                    <strong>Status:</strong>{" "}
                    {viewingRuleSet.isActive ? (
                      <span style={{ color: "#52c41a" }}>Active</span>
                    ) : (
                      <span style={{ color: "#999" }}>Inactive</span>
                    )}
                  </p>
                </Col>
                <Col span={12}>
                  <p>
                    <strong>Description:</strong>
                  </p>
                  <p style={{ color: "#666" }}>
                    {viewingRuleSet.description || "No description"}
                  </p>
                </Col>
              </Row>
            </Card>

            <Divider />

            {/* Rules List */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h3 style={{ margin: 0 }}>Rules ({rules.length})</h3>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddRule}
              >
                Add Rule
              </Button>
            </div>

            <RulesList
              rules={rules}
              loading={rulesLoading || isDeletingRule}
              onEdit={handleEditRule}
              onDelete={handleDeleteRule}
            />
          </div>
        )}
      </Modal>

      {/* Rule Form Modal */}
      <RuleForm
        open={isRuleFormOpen}
        rule={editingRule}
        ruleSetId={viewingRuleSetId || 0}
        onSubmit={handleRuleFormSubmit}
        onCancel={() => {
          setIsRuleFormOpen(false);
          setEditingRule(null);
        }}
        loading={isCreatingRule || isUpdatingRule}
      />
    </div>
  );
}
