/**
 * Users Settings Page
 *
 * Admin interface for managing users
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
  Input,
  Select,
} from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  UserOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { ProtectedRoute } from "@/components/auth";
import { MainLayout } from "@/components/layout";
import { UserTable, UserForm } from "@/components/settings";
import { useUsers } from "@/lib/hooks/useUsers";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

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
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<number | undefined>();
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  // Fetch roles for filter
  const { data: rolesData } = useSWR("/api/roles", fetcher);
  const roles = rolesData?.data || [];

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
    search,
    roleId: roleFilter,
    isActive: statusFilter,
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
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8} md={8}>
          <Card>
            <Statistic
              title="Active Users"
              value={activeUsers}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8} md={8}>
          <Card>
            <Statistic
              title="Inactive Users"
              value={inactiveUsers}
              prefix={<TeamOutlined />}
              valueStyle={{ color: "#999" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters and Actions */}
      <Card style={{ marginBottom: "16px" }}>
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          {/* Action Buttons */}
          <Space style={{ width: "100%", justifyContent: "space-between" }}>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
              >
                Create User
              </Button>
              <Button icon={<ReloadOutlined />} onClick={refresh}>
                Refresh
              </Button>
            </Space>
          </Space>

          {/* Filters */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Input
                placeholder="Search by name or email..."
                prefix={<SearchOutlined />}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Select
                placeholder="Filter by role"
                style={{ width: "100%" }}
                value={roleFilter}
                onChange={(value) => {
                  setRoleFilter(value);
                  setPage(1);
                }}
                allowClear
              >
                {roles.map((role: any) => (
                  <Select.Option key={role.id} value={role.id}>
                    {role.displayName}
                  </Select.Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Select
                placeholder="Filter by status"
                style={{ width: "100%" }}
                value={statusFilter}
                onChange={(value) => {
                  setStatusFilter(value);
                  setPage(1);
                }}
                allowClear
              >
                <Select.Option value={true}>Active</Select.Option>
                <Select.Option value={false}>Inactive</Select.Option>
              </Select>
            </Col>
          </Row>
        </Space>
      </Card>

      {/* Users Table */}
      <Card>
        <UserTable
          users={users}
          loading={isLoading || isDeleting}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: pagination?.total || 0,
          }}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onChange={handleTableChange}
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
