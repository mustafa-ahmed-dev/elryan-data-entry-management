/**
 * Teams Page
 *
 * Complete team management interface with details view
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
  Tabs,
} from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  TeamOutlined,
  UserOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { ProtectedRoute, PermissionGate } from "@/components/auth";
import { MainLayout } from "@/components/layout";
import {
  TeamTable,
  TeamForm,
  TeamStats,
  TeamMembers,
} from "@/components/teams";
import { useTeams } from "@/lib/hooks/useTeams";
import { usePermissions } from "@/lib/hooks/usePermissions";

export default function TeamsPage() {
  return (
    <ProtectedRoute requiredPermission={{ action: "read", resource: "teams" }}>
      <MainLayout>
        <TeamsContent />
      </MainLayout>
    </ProtectedRoute>
  );
}

function TeamsContent() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<any>(null);
  const [viewingTeam, setViewingTeam] = useState<any>(null);

  const { can } = usePermissions();
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
  } = useTeams({ search, page, pageSize, includeStats: true });

  const canCreate = can("create", "teams");
  const canUpdate = can("update", "teams");
  const canDelete = can("delete", "teams");

  // Calculate stats
  const totalTeams = teams.length;
  const totalMembers = teams.reduce(
    (sum, team) => sum + (team.memberCount || 0),
    0
  );
  const avgMembersPerTeam =
    totalTeams > 0 ? Math.round(totalMembers / totalTeams) : 0;

  // Handle create
  const handleCreate = () => {
    setEditingTeam(null);
    setIsFormOpen(true);
  };

  // Handle edit
  const handleEdit = (team: any) => {
    if (!canUpdate) {
      message.error("You do not have permission to edit teams");
      return;
    }
    setEditingTeam(team);
    setIsFormOpen(true);
  };

  // Handle view details
  const handleViewDetails = (team: any) => {
    setViewingTeam(team);
  };

  // Handle delete
  const handleDelete = async (teamId: number) => {
    if (!canDelete) {
      message.error("You do not have permission to delete teams");
      return;
    }

    const result = await deleteTeam(teamId);
    if (result.success) {
      message.success("Team deleted successfully");
    } else {
      message.error(result.error || "Failed to delete team");
    }
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
      message.error(result.error || "Operation failed");
    }
  };

  // Handle pagination change
  const handleTableChange = (newPage: number, newPageSize: number) => {
    setPage(newPage);
    setPageSize(newPageSize);
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: "24px" }}>
        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ margin: 0 }}>Teams Management</h1>
            <p style={{ margin: "8px 0 0 0", color: "#666" }}>
              Manage teams and their members
            </p>
          </div>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => refresh()}
              loading={isLoading}
            >
              Refresh
            </Button>
            <PermissionGate
              permission={{ action: "create", resource: "teams" }}
            >
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
              >
                Add Team
              </Button>
            </PermissionGate>
          </Space>
        </Space>
      </div>

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: "24px" }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Teams"
              value={totalTeams}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Members"
              value={totalMembers}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Avg Members/Team"
              value={avgMembersPerTeam}
              suffix="members"
            />
          </Card>
        </Col>
      </Row>

      {/* Teams Table */}
      <Card>
        <TeamTable
          teams={teams}
          loading={isLoading || isDeleting}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: pagination?.total || teams.length,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} teams`,
          }}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onViewDetails={handleViewDetails}
          onChange={handleTableChange}
          canEdit={canUpdate}
          canDelete={canDelete}
        />
      </Card>

      {/* Create/Edit Form Modal */}
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

      {/* Team Details Modal */}
      <Modal
        title={
          <Space>
            <TeamOutlined />
            {viewingTeam?.name}
          </Space>
        }
        open={!!viewingTeam}
        onCancel={() => setViewingTeam(null)}
        footer={null}
        width={900}
        destroyOnClose
      >
        {viewingTeam && (
          <Tabs
            defaultActiveKey="stats"
            items={[
              {
                key: "stats",
                label: "Statistics",
                children: (
                  <TeamStats teamId={viewingTeam.id} showTitle={false} />
                ),
              },
              {
                key: "members",
                label: `Members (${viewingTeam.memberCount || 0})`,
                children: (
                  <TeamMembers
                    teamId={viewingTeam.id}
                    showTitle={false}
                    canManage={canUpdate}
                  />
                ),
              },
            ]}
          />
        )}
      </Modal>
    </div>
  );
}
