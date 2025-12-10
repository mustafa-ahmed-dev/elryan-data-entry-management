<<<<<<< HEAD
/**
 * Evaluations Page
 *
 * Complete evaluation management interface
 */

"use client";

import { useState } from "react";
import {
  Card,
  Button,
  Space,
  message,
  Row,
  Col,
  Statistic,
  Modal,
  Input,
  Select,
  DatePicker,
} from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  StarOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { ProtectedRoute, PermissionGate } from "@/components/auth";
import { MainLayout } from "@/components/layout";
import {
  EvaluationTable,
  EvaluationForm,
  EvaluationDetail,
  BulkEvaluationForm,
} from "@/components/evaluations";
import { useEvaluations } from "@/lib/hooks/useEvaluations";
import { usePermissions } from "@/lib/hooks/usePermissions";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
=======
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
>>>>>>> local-backup

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
<<<<<<< HEAD
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState({
    employeeId: undefined as number | undefined,
    evaluatorId: undefined as number | undefined,
    minScore: undefined as number | undefined,
    maxScore: undefined as number | undefined,
    startDate: undefined as string | undefined,
    endDate: undefined as string | undefined,
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkFormOpen, setIsBulkFormOpen] = useState(false);
  const [editingEvaluation, setEditingEvaluation] = useState<any>(null);
  const [viewingEvaluation, setViewingEvaluation] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { can } = usePermissions();
  const {
    evaluations,
    pagination,
    isLoading,
    createEvaluation,
    createBulkEvaluations,
    updateEvaluation,
    deleteEvaluation,
    isCreating,
    isUpdating,
    isDeleting,
    refresh,
  } = useEvaluations({
    ...filters,
    page,
    pageSize,
    sortBy: "evaluatedAt",
    sortOrder: "desc",
  });

  const canCreate = can("create", "evaluations");
  const canUpdate = can("update", "evaluations");
  const canDelete = can("delete", "evaluations");

  // Calculate statistics
  const totalEvaluations = pagination?.total || 0;
  const averageScore =
    evaluations.length > 0
      ? evaluations.reduce((sum, e) => sum + e.totalScore, 0) /
        evaluations.length
      : 0;
  const excellentCount = evaluations.filter((e) => e.totalScore >= 90).length;
  const needsImprovementCount = evaluations.filter(
    (e) => e.totalScore < 60
  ).length;

  // Handle table change (pagination, sorting)
  const handleTableChange = (newPage: number, newPageSize: number) => {
    setPage(newPage);
    setPageSize(newPageSize);
  };

  // Handle create
  const handleCreate = () => {
    setEditingEvaluation(null);
    setIsFormOpen(true);
  };

  // Handle bulk create
  const handleBulkCreate = () => {
    setIsBulkFormOpen(true);
  };

  // Handle edit
  const handleEdit = (evaluation: any) => {
    if (!canUpdate) {
      message.error("You do not have permission to edit evaluations");
      return;
    }
    setEditingEvaluation(evaluation);
    setIsFormOpen(true);
  };

  // Handle view
  const handleView = (evaluation: any) => {
    setViewingEvaluation(evaluation);
  };

  // Handle delete
  const handleDelete = async (evaluationId: number) => {
    if (!canDelete) {
      message.error("You do not have permission to delete evaluations");
      return;
    }

    const result = await deleteEvaluation(evaluationId);
    if (result.success) {
      message.success("Evaluation deleted successfully");
    } else {
      message.error(result.error || "Failed to delete evaluation");
    }
  };

  // Handle form submit
  const handleFormSubmit = async (values: any) => {
    let result;

    if (editingEvaluation) {
      result = await updateEvaluation(editingEvaluation.id, values);
    } else {
      result = await createEvaluation(values);
    }

    if (result.success) {
      message.success(
        editingEvaluation
          ? "Evaluation updated successfully"
          : "Evaluation created successfully"
      );
      setIsFormOpen(false);
      setEditingEvaluation(null);
    } else {
      message.error(result.error || "Failed to save evaluation");
    }
  };

  // Handle bulk form submit
  const handleBulkFormSubmit = async (evaluations: any[]) => {
    const result = await createBulkEvaluations(evaluations);

    if (result.success) {
      message.success(result.message || "Evaluations created successfully");
      setIsBulkFormOpen(false);
    } else {
      message.error(result.error || "Failed to create evaluations");
    }
  };

  // Handle filter change
  const handleFilterChange = (field: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
    setPage(1); // Reset to first page when filters change
  };

  // Handle date range change
  const handleDateRangeChange = (dates: any) => {
    if (dates && dates.length === 2) {
      setFilters((prev) => ({
        ...prev,
        startDate: dates[0].format("YYYY-MM-DD"),
        endDate: dates[1].format("YYYY-MM-DD"),
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        startDate: undefined,
        endDate: undefined,
      }));
    }
    setPage(1);
  };

  // Clear filters
  const handleClearFilters = () => {
    setFilters({
      employeeId: undefined,
      evaluatorId: undefined,
      minScore: undefined,
      maxScore: undefined,
      startDate: undefined,
      endDate: undefined,
    });
    setPage(1);
  };

  return (
    <div style={{ padding: "24px" }}>
      {/* Page Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 600, margin: 0 }}>
          Quality Evaluations
        </h1>
        <p style={{ color: "#666", margin: "8px 0 0 0" }}>
          Manage and review quality evaluations for data entries
        </p>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col xs={24} sm={12} md={6}>
=======
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
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      {/* Header */}
      <h1 style={{ margin: 0, fontSize: isMobile ? "24px" : "32px" }}>
        Evaluations
      </h1>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
>>>>>>> local-backup
          <Card>
            <Statistic
              title="Total Evaluations"
              value={totalEvaluations}
<<<<<<< HEAD
              prefix={<StarOutlined />}
              styles={{ content: { color: "#1890ff" } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Average Score"
              value={averageScore.toFixed(1)}
              suffix="/ 100"
              prefix={<TrophyOutlined />}
              styles={{
                content: {
                  color: averageScore >= 80 ? "#3f8600" : "#faad14",
                },
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Excellent (≥90)"
              value={excellentCount}
              prefix={<CheckCircleOutlined />}
              styles={{ content: { color: "#3f8600" } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Needs Improvement (<60)"
              value={needsImprovementCount}
              prefix={<WarningOutlined />}
              styles={{ content: { color: "#cf1322" } }}
=======
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Approved"
              value={approvedCount}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Rejected"
              value={rejectedCount}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: "#ff4d4f" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Needs Revision"
              value={pendingCount}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#faad14" }}
>>>>>>> local-backup
            />
          </Card>
        </Col>
      </Row>

<<<<<<< HEAD
      {/* Actions Bar */}
      <Card style={{ marginBottom: "16px" }}>
        <Space wrap style={{ width: "100%", justifyContent: "space-between" }}>
          <Space wrap>
            <PermissionGate action="create" resource="evaluations">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
              >
                Create Evaluation
              </Button>
            </PermissionGate>
            <PermissionGate action="create" resource="evaluations">
              <Button icon={<PlusOutlined />} onClick={handleBulkCreate}>
                Bulk Evaluate
              </Button>
            </PermissionGate>
            <Button icon={<ReloadOutlined />} onClick={refresh}>
              Refresh
            </Button>
          </Space>

          <Button
            icon={<FilterOutlined />}
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
        </Space>

        {/* Filters */}
        {showFilters && (
          <div
            style={{
              marginTop: "16px",
              paddingTop: "16px",
              borderTop: "1px solid #f0f0f0",
            }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <label style={{ display: "block", marginBottom: "8px" }}>
                  Employee ID
                </label>
                <Input
                  placeholder="Filter by employee ID"
                  type="number"
                  value={filters.employeeId}
                  onChange={(e) =>
                    handleFilterChange(
                      "employeeId",
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <label style={{ display: "block", marginBottom: "8px" }}>
                  Score Range
                </label>
                <Space.Compact style={{ width: "100%" }}>
                  <Input
                    placeholder="Min"
                    type="number"
                    value={filters.minScore}
                    onChange={(e) =>
                      handleFilterChange(
                        "minScore",
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
                  />
                  <Input
                    placeholder="Max"
                    type="number"
                    value={filters.maxScore}
                    onChange={(e) =>
                      handleFilterChange(
                        "maxScore",
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
                  />
                </Space.Compact>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <label style={{ display: "block", marginBottom: "8px" }}>
                  Date Range
                </label>
                <RangePicker
                  style={{ width: "100%" }}
                  onChange={handleDateRangeChange}
                  value={
                    filters.startDate && filters.endDate
                      ? [dayjs(filters.startDate), dayjs(filters.endDate)]
                      : null
                  }
                />
              </Col>
              <Col xs={24} sm={12} md={4}>
                <label style={{ display: "block", marginBottom: "8px" }}>
                  &nbsp;
                </label>
                <Button block onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              </Col>
            </Row>
          </div>
        )}
      </Card>

      {/* Evaluations Table */}
      <Card>
        <EvaluationTable
          evaluations={evaluations}
          loading={isLoading || isDeleting}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: pagination?.total || 0,
          }}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onChange={handleTableChange}
          canEdit={canUpdate}
          canDelete={canDelete}
        />
      </Card>

      {/* Create/Edit Form Modal */}
      <EvaluationForm
        open={isFormOpen}
        evaluation={editingEvaluation}
        onSubmit={handleFormSubmit}
        onCancel={() => {
          setIsFormOpen(false);
          setEditingEvaluation(null);
        }}
        loading={isCreating || isUpdating}
      />

      {/* Bulk Evaluation Form Modal */}
      <BulkEvaluationForm
        open={isBulkFormOpen}
        entries={[]} // You'll need to fetch entries here
        onSubmit={handleBulkFormSubmit}
        onCancel={() => setIsBulkFormOpen(false)}
        loading={isCreating}
      />

      {/* Evaluation Detail Modal */}
      <Modal
        title="Evaluation Details"
        open={!!viewingEvaluation}
        onCancel={() => setViewingEvaluation(null)}
        footer={[
          <Button key="close" onClick={() => setViewingEvaluation(null)}>
            Close
          </Button>,
          canUpdate && (
            <Button
              key="edit"
              type="primary"
              onClick={() => {
                setEditingEvaluation(viewingEvaluation);
                setViewingEvaluation(null);
                setIsFormOpen(true);
              }}
            >
              Edit
            </Button>
          ),
        ]}
        width={800}
      >
        {viewingEvaluation && (
          <EvaluationDetail evaluation={viewingEvaluation} />
        )}
      </Modal>
    </div>
=======
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
                    width="80%"
                    bodyStyle={{ padding: 0 }}
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
>>>>>>> local-backup
  );
}
