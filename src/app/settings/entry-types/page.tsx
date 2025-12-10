/**
 * Entry Types Settings Page
 *
 * Admin interface for managing entry types
 */

"use client";

import { useState } from "react";
import { Card, Button, Space, message, Alert, Statistic, Row, Col } from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { ProtectedRoute } from "@/components/auth";
import { MainLayout } from "@/components/layout";
import { EntryTypeTable, EntryTypeForm } from "@/components/settings";
<<<<<<< HEAD
import { useEntryTypes } from "@/lib/hooks/useEntryTypes";
=======
import { useEntryTypes } from "@/lib/hooks";
>>>>>>> local-backup

export default function EntryTypesPage() {
  return (
    <ProtectedRoute
      requiredPermission={{ action: "update", resource: "entries" }}
    >
      <MainLayout>
        <EntryTypesContent />
      </MainLayout>
    </ProtectedRoute>
  );
}

function EntryTypesContent() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntryType, setEditingEntryType] = useState<any>(null);

  const {
    entryTypes,
    isLoading,
    createEntryType,
    updateEntryType,
    deleteEntryType,
    isCreating,
    isUpdating,
    isDeleting,
    refresh,
  } = useEntryTypes();

  // Handle create
  const handleCreate = () => {
    setEditingEntryType(null);
    setIsFormOpen(true);
  };

  // Handle edit
  const handleEdit = (entryType: any) => {
    setEditingEntryType(entryType);
    setIsFormOpen(true);
  };

  // Handle delete
  const handleDelete = async (entryTypeId: number) => {
    const result = await deleteEntryType(entryTypeId);
    if (result.success) {
      message.success("Entry type deleted successfully");
    } else {
      message.error(result.error || "Failed to delete entry type");
    }
  };

  // Handle form submit
  const handleFormSubmit = async (values: any) => {
    let result;

    if (editingEntryType) {
      result = await updateEntryType(editingEntryType.id, values);
    } else {
      result = await createEntryType(values);
    }

    if (result.success) {
      message.success(
        editingEntryType
          ? "Entry type updated successfully"
          : "Entry type created successfully"
      );
      setIsFormOpen(false);
      setEditingEntryType(null);
    } else {
      message.error(result.error || "Failed to save entry type");
    }
  };

  return (
    <div style={{ padding: "24px" }}>
      {/* Page Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 600, margin: 0 }}>
          Entry Types Management
        </h1>
        <p style={{ color: "#666", margin: "8px 0 0 0" }}>
          Configure data entry types and categories
        </p>
      </div>

      {/* Statistics Card */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Total Entry Types"
              value={entryTypes.length}
              prefix={<FileTextOutlined />}
              styles={{ content: { color: "#1890ff" } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
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
              onClick={handleCreate}
            >
              Create Entry Type
            </Button>
            <Button icon={<ReloadOutlined />} onClick={refresh}>
              Refresh
            </Button>
          </Space>
        </Space>

        {entryTypes.length === 0 && !isLoading && (
          <Alert
            title="Get Started"
            description="Create your first entry type to categorize different kinds of data entries in your system."
            type="info"
            showIcon
            style={{ marginBottom: "16px" }}
          />
        )}

        <EntryTypeTable
          entryTypes={entryTypes}
          loading={isLoading || isDeleting}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </Card>

      {/* Entry Type Form Modal */}
      <EntryTypeForm
        open={isFormOpen}
        entryType={editingEntryType}
        onSubmit={handleFormSubmit}
        onCancel={() => {
          setIsFormOpen(false);
          setEditingEntryType(null);
        }}
        loading={isCreating || isUpdating}
      />
    </div>
  );
}
