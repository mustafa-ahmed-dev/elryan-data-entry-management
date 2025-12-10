/**
 * Teams Settings Page
 *
 * Admin interface for managing teams
 */

"use client";

import { useState } from "react";
import { Card, Button, Space, message, Row, Col, Statistic } from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { ProtectedRoute } from "@/components/auth";
import { MainLayout } from "@/components/layout";
import {
  TeamTable,
  TeamForm,
  TeamFilters,
  TeamMembers,
} from "@/components/settings/teams";
<<<<<<< HEAD
import { useTeams } from "@/lib/hooks/useTeams";
=======
import { useTeams } from "@/lib/hooks";
>>>>>>> local-backup

export default function TeamsSettingsPage() {
  return (
    <ProtectedRoute
      requiredPermission={{ action: "update", resource: "teams" }}
    >
      <MainLayout>
        <TeamsSettingsContent />
      </MainLayout>
    </ProtectedRoute>
  );
}

function TeamsSettingsContent() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState<any>({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<any>(null);
  const [viewingMembersTeam, setViewingMembersTeam] = useState<any>(null);

  const {
    teams,
    pagination,
    isLoading,
    createTeam,
    updateTeam,
    deleteTeam,
    isCreating,
    isUpdating,
    isDeleting,
    refresh,
  } = useTeams({
    ...filters,
    page,
    pageSize,
  });

  // Calculate statistics
  const totalTeams = pagination?.total || 0;
  const totalMembers = teams.reduce(
    (sum: number, t: any) => sum + (t.memberCount || 0),
    0
  );
  const averageTeamSize =
    totalTeams > 0 ? Math.round(totalMembers / totalTeams) : 0;

  // Handle table change
  const handleTableChange = (newPage: number, newPageSize: number) => {
    setPage(newPage);
    setPageSize(newPageSize);
  };

  // Handle filter change
  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page
  };

  // Handle create
  const handleCreate = () => {
    setEditingTeam(null);
    setIsFormOpen(true);
  };

  // Handle edit
  const handleEdit = (team: any) => {
    setEditingTeam(team);
    setIsFormOpen(true);
  };

  // Handle delete
  const handleDelete = async (teamId: number) => {
    const result = await deleteTeam(teamId);
    if (result.success) {
      message.success("Team deleted successfully");
    } else {
      message.error(result.error || "Failed to delete team");
    }
  };

  // Handle view members
  const handleViewMembers = (team: any) => {
    setViewingMembersTeam(team);
  };

  // Handle form submit
  const handleFormSubmit = async (values: any) => {
    let result;

    if (editingTeam) {
      result = await updateTeam(editingTeam.id, values);
    } else {
      result = await createTeam(values);
    }

    if (result.success) {
      message.success(
        editingTeam ? "Team updated successfully" : "Team created successfully"
      );
      setIsFormOpen(false);
      setEditingTeam(null);
    } else {
      message.error(result.error || "Failed to save team");
    }
  };

  return (
    <div style={{ padding: "24px" }}>
      {/* Page Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 600, margin: 0 }}>
          Team Management
        </h1>
        <p style={{ color: "#666", margin: "8px 0 0 0" }}>
          Manage teams, assign leaders, and organize members
        </p>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col xs={24} sm={8} md={8}>
          <Card>
            <Statistic
              title="Total Teams"
              value={totalTeams}
              prefix={<TeamOutlined />}
              styles={{ content: { color: "#1890ff" } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8} md={8}>
          <Card>
            <Statistic
              title="Total Members"
              value={totalMembers}
              prefix={<UserOutlined />}
              styles={{ content: { color: "#52c41a" } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8} md={8}>
          <Card>
            <Statistic
              title="Average Team Size"
              value={averageTeamSize}
              prefix={<TeamOutlined />}
              styles={{ content: { color: "#722ed1" } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters Card */}
      <Card style={{ marginBottom: "16px" }}>
        <TeamFilters onFilterChange={handleFilterChange} />
      </Card>

      {/* Main Content */}
      <Card>
        <Space
          style={{
            width: "100%",
            justifyContent: "space-between",
            marginBottom: "16px",
          }}
        >
          <div>
            <h3 style={{ margin: 0 }}>Teams List</h3>
            <p style={{ color: "#666", margin: "4px 0 0 0", fontSize: "14px" }}>
              Showing {teams.length} of {totalTeams} teams
            </p>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={refresh}>
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Create Team
            </Button>
          </Space>
        </Space>

        <TeamTable
          teams={teams}
          loading={isLoading || isDeleting}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: pagination?.total || 0,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} teams`,
          }}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onViewMembers={handleViewMembers}
          onChange={handleTableChange}
          canEdit={true}
          canDelete={true}
        />
      </Card>

      {/* Team Form Modal */}
      <TeamForm
        open={isFormOpen}
        team={editingTeam}
        onSubmit={handleFormSubmit}
        onCancel={() => {
          setIsFormOpen(false);
          setEditingTeam(null);
        }}
        loading={isCreating || isUpdating}
      />

      {/* Team Members Modal */}
      {viewingMembersTeam && (
        <TeamMembers
          open={!!viewingMembersTeam}
          team={viewingMembersTeam}
          onClose={() => setViewingMembersTeam(null)}
          onMembersChange={refresh}
        />
      )}
    </div>
  );
}
