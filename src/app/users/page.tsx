/**
 * Users Page
 *
 * Complete user management interface
 */

"use client";

import { useState } from "react";
import { Card, Button, Space, message } from "antd";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { ProtectedRoute, PermissionGate } from "@/components/auth";
import { MainLayout } from "@/components/layout";
import { UserTable, UserForm, UserFilters } from "@/components/users";
import { useUsers } from "@/lib/hooks/useUsers";
import { usePermissions } from "@/lib/hooks/usePermissions";

export default function UsersPage() {
  return (
    <ProtectedRoute requiredPermission={{ action: "read", resource: "users" }}>
      <MainLayout>
        <UsersContent />
      </MainLayout>
    </ProtectedRoute>
  );
}

function UsersContent() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<any>({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const { can } = usePermissions();
  const {
    users,
    pagination,
    stats,
    isLoading,
    createUser,
    updateUser,
    deleteUser,
    isCreating,
    isUpdating,
    isDeleting,
    refresh,
  } = useUsers({ ...filters, page, pageSize });

  const canCreate = can("create", "users");
  const canUpdate = can("update", "users");
  const canDelete = can("delete", "users");

  // Handle create
  const handleCreate = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  // Handle edit
  const handleEdit = (user: any) => {
    if (!canUpdate) {
      message.error("You do not have permission to edit users");
      return;
    }
    setEditingUser(user);
    setIsFormOpen(true);
  };

  // Handle delete
  const handleDelete = async (userId: number) => {
    if (!canDelete) {
      message.error("You do not have permission to delete users");
      return;
    }

    const result = await deleteUser(userId);
    if (result.success) {
      message.success("User deleted successfully");
    } else {
      message.error(result.error || "Failed to delete user");
    }
  };

  // Handle form submit
  const handleFormSubmit = async (values: any) => {
    let result;

    if (editingUser) {
      // Update existing user
      result = await updateUser(editingUser.id, values);
    } else {
      // Create new user
      result = await createUser(values);
    }

    if (result.success) {
      message.success(
        editingUser ? "User updated successfully" : "User created successfully"
      );
      setIsFormOpen(false);
      setEditingUser(null);
    } else {
      message.error(result.error || "Operation failed");
    }
  };

  // Handle pagination change
  const handleTableChange = (newPage: number, newPageSize: number) => {
    setPage(newPage);
    setPageSize(newPageSize);
  };

  // Handle filter change
  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: "24px" }}>
        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ margin: 0 }}>Users Management</h1>
            {stats && (
              <p style={{ margin: "8px 0 0 0", color: "#666" }}>
                {stats.total} total users ({stats.active} active,{" "}
                {stats.inactive} inactive)
              </p>
            )}
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
              permission={{ action: "create", resource: "users" }}
            >
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
              >
                Add User
              </Button>
            </PermissionGate>
          </Space>
        </Space>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: "16px" }}>
        <UserFilters onFilterChange={handleFilterChange} />
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
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} users`,
          }}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onChange={handleTableChange}
          canEdit={canUpdate}
          canDelete={canDelete}
        />
      </Card>

      {/* Create/Edit Form Modal */}
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
