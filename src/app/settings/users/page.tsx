/**
 * Users Settings Page
 *
 * Admin interface for managing users
 */

"use client";

import { useState } from "react";
import { Card, Button, Space, message, Row, Col, Statistic } from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  UserOutlined,
  CheckCircleOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { ProtectedRoute } from "@/components/auth";
import { MainLayout } from "@/components/layout";
import { UserTable, UserForm, UserFilters } from "@/components/settings/users";
import { useUsers } from "@/lib/hooks";

export default function UsersSettingsPage() {
  return (
    <ProtectedRoute
      requiredPermission={{ action: "update", resource: "users" }}
    >
      <MainLayout>
        <UsersSettingsContent />
      </MainLayout>
    </ProtectedRoute>
  );
}

function UsersSettingsContent() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState<any>({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const {
    users,
    pagination,
    isLoading,
    createUser,
    updateUser,
    deleteUser,
    isCreating,
    isUpdating,
    isDeleting,
    refresh,
  } = useUsers({
    ...filters,
    page,
    pageSize,
  });

  // Calculate statistics
  const totalUsers = pagination?.total || 0;
  const activeUsers = users.filter((u: any) => u.isActive).length;
  const inactiveUsers = users.filter((u: any) => !u.isActive).length;

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
    setEditingUser(null);
    setIsFormOpen(true);
  };

  // Handle edit
  const handleEdit = (user: any) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  // Handle delete
  const handleDelete = async (userId: number) => {
    const result = await deleteUser(userId);
    if (result.success) {
      message.success("User deactivated successfully");
    } else {
      message.error(result.error || "Failed to deactivate user");
    }
  };

  // Handle form submit
  const handleFormSubmit = async (values: any) => {
    let result;

    if (editingUser) {
      result = await updateUser(editingUser.id, values);
    } else {
      result = await createUser(values);
    }

    if (result.success) {
      message.success(
        editingUser ? "User updated successfully" : "User created successfully"
      );
      setIsFormOpen(false);
      setEditingUser(null);
    } else {
      message.error(result.error || "Failed to save user");
    }
  };

  return (
    <div style={{ padding: "24px" }}>
      {/* Page Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 600, margin: 0 }}>
          User Management
        </h1>
        <p style={{ color: "#666", margin: "8px 0 0 0" }}>
          Manage system users, roles, and access
        </p>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col xs={24} sm={8} md={8}>
          <Card>
            <Statistic
              title="Total Users"
              value={totalUsers}
              prefix={<UserOutlined />}
              styles={{ content: { color: "#1890ff" } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8} md={8}>
          <Card>
            <Statistic
              title="Active Users"
              value={activeUsers}
              prefix={<CheckCircleOutlined />}
              styles={{ content: { color: "#52c41a" } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8} md={8}>
          <Card>
            <Statistic
              title="Inactive Users"
              value={inactiveUsers}
              prefix={<StopOutlined />}
              styles={{ content: { color: "#999" } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters Card */}
      <Card style={{ marginBottom: "16px" }}>
        <UserFilters onFilterChange={handleFilterChange} />
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
            <h3 style={{ margin: 0 }}>Users List</h3>
            <p style={{ color: "#666", margin: "4px 0 0 0", fontSize: "14px" }}>
              Showing {users.length} of {totalUsers} users
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
              Create User
            </Button>
          </Space>
        </Space>

        <UserTable
          users={users}
          loading={isLoading || isDeleting}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: pagination?.total || 0,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} users`,
          }}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onChange={handleTableChange}
          canEdit={true}
          canDelete={true}
        />
      </Card>

      {/* User Form Modal */}
      <UserForm
        open={isFormOpen}
        user={editingUser}
        onSubmit={handleFormSubmit}
        onCancel={() => {
          setIsFormOpen(false);
          setEditingUser(null);
        }}
        loading={isCreating || isUpdating}
      />
    </div>
  );
}
