"use client";

import React, { useState, useEffect } from "react";
import { Card, Row, Col, Statistic, Tabs, Button, Space, Drawer } from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import { ProtectedRoute } from "@/components/auth";
import { MainLayout } from "@/components/layout";
import { useEvaluations } from "@/lib/hooks";
import {
  EvaluationTable,
  EvaluationForm,
  EntriesBrowser,
  EvaluationWorkspace,
} from "@/components/evaluations";

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

export default function EvaluationsPage() {
  return (
    <ProtectedRoute
      requiredPermission={{ action: "read", resource: "evaluations" }}
    >
      <MainLayout>
        <EvaluationsContent />
      </MainLayout>
    </ProtectedRoute>
  );
}

function EvaluationsContent() {
  const { evaluations, isLoading, error, refresh } = useEvaluations();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [activeTab, setActiveTab] = useState("workspace");
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Ensure evaluations is always an array
  const evaluationsList = Array.isArray(evaluations) ? evaluations : [];

  // Calculate statistics
  const totalEvaluations = evaluationsList.length;
  const approvedCount = evaluationsList.filter(
    (e) => e.status === "approved"
  ).length;
  const rejectedCount = evaluationsList.filter(
    (e) => e.status === "rejected"
  ).length;
  const pendingCount = evaluationsList.filter(
    (e) => e.status === "needs_revision"
  ).length;

  const handleFormSuccess = () => {
    refresh();
    setIsFormVisible(false);
  };

  const handleSelectEntry = (entry: Entry) => {
    setSelectedEntry(entry);
    if (isMobile) {
      setDrawerVisible(false);
    }
  };

  const handleEvaluationSubmitted = () => {
    refresh();
    setSelectedEntry(null);
  };

  const handleClearSelection = () => {
    setSelectedEntry(null);
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    if (key !== "workspace") {
      setSelectedEntry(null);
    }
  };

  const entriesBrowserContent = (
    <EntriesBrowser
      selectedEntryId={selectedEntry?.id || null}
      onSelectEntry={handleSelectEntry}
    />
  );

  return (
    <Space orientation="vertical" size="large" style={{ width: "100%" }}>
      {/* Header */}
      <h1 style={{ margin: 0, fontSize: isMobile ? "24px" : "32px" }}>
        Evaluations
      </h1>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Evaluations"
              value={totalEvaluations}
              prefix={<CheckCircleOutlined />}
              styles={{ content: { color: "#1890ff" } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Approved"
              value={approvedCount}
              prefix={<CheckCircleOutlined />}
              styles={{ content: { color: "#52c41a" } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Rejected"
              value={rejectedCount}
              prefix={<CloseCircleOutlined />}
              styles={{ content: { color: "#ff4d4f" } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Needs Revision"
              value={pendingCount}
              prefix={<ClockCircleOutlined />}
              styles={{ content: { color: "#faad14" } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabs */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          tabBarExtraContent={
            activeTab === "evaluations" && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsFormVisible(true)}
              >
                {isMobile ? "New" : "New Evaluation"}
              </Button>
            )
          }
          items={[
            {
              key: "workspace",
              label: "Evaluate Entries",
              children: isMobile ? (
                // Mobile Layout - Stacked with drawer
                <div style={{ minHeight: "500px" }}>
                  <Button
                    icon={<MenuOutlined />}
                    onClick={() => setDrawerVisible(true)}
                    style={{ marginBottom: "16px" }}
                    block
                  >
                    Show Entries List
                  </Button>
                  <EvaluationWorkspace
                    selectedEntry={selectedEntry}
                    onEvaluationSubmitted={handleEvaluationSubmitted}
                    onClearSelection={handleClearSelection}
                  />
                  <Drawer
                    title="Entries to Evaluate"
                    placement="left"
                    onClose={() => setDrawerVisible(false)}
                    open={drawerVisible}
                    styles={{ body: { padding: 0, width: "80%" } }}
                  >
                    {entriesBrowserContent}
                  </Drawer>
                </div>
              ) : (
                // Desktop Layout - Two columns
                <Row gutter={16} style={{ minHeight: "600px" }}>
                  <Col span={8}>
                    <div style={{ height: "600px" }}>
                      {entriesBrowserContent}
                    </div>
                  </Col>
                  <Col span={16}>
                    <div style={{ height: "600px" }}>
                      <EvaluationWorkspace
                        selectedEntry={selectedEntry}
                        onEvaluationSubmitted={handleEvaluationSubmitted}
                        onClearSelection={handleClearSelection}
                      />
                    </div>
                  </Col>
                </Row>
              ),
            },
            {
              key: "evaluations",
              label: "View Evaluations",
              children: (
                <EvaluationTable
                  evaluations={evaluationsList}
                  loading={isLoading}
                />
              ),
            },
          ]}
        />
      </Card>

      {/* Evaluation Form Modal */}
      <EvaluationForm
        visible={isFormVisible}
        onClose={() => setIsFormVisible(false)}
        onSuccess={handleFormSuccess}
      />
    </Space>
  );
}
