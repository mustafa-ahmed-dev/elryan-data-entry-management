/**
 * Rule Types Settings Page
 *
 * Admin interface for managing rule type lookup table
 */

"use client";

import { useState } from "react";
import { Card, Button, Space, Alert } from "antd";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { ProtectedRoute } from "@/components/auth";
import { MainLayout } from "@/components/layout";
import { RuleTypeTable } from "@/components/settings/rules/RuleTypeTable";
import { RuleTypeForm } from "@/components/settings/rules/RuleTypeForm";
import { useRuleTypes, type RuleType } from "@/lib/hooks/useRuleTypes";

export default function RuleTypesPage() {
  return (
    <ProtectedRoute
      requiredPermission={{ action: "update", resource: "evaluations" }}
    >
      <MainLayout>
        <RuleTypesContent />
      </MainLayout>
    </ProtectedRoute>
  );
}

function RuleTypesContent() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRuleType, setEditingRuleType] = useState<RuleType | null>(null);

  const {
    ruleTypes,
    isLoading,
    createRuleType,
    updateRuleType,
    deleteRuleType,
    isCreating,
    isUpdating,
    isDeleting,
    refresh,
  } = useRuleTypes(true);

  // Handle create
  const handleCreate = () => {
    setEditingRuleType(null);
    setIsFormOpen(true);
  };

  // Handle edit
  const handleEdit = (ruleType: RuleType) => {
    setEditingRuleType(ruleType);
    setIsFormOpen(true);
  };

  // Handle form submit
  const handleFormSubmit = async (values: any) => {
    if (editingRuleType) {
      const result = await updateRuleType(editingRuleType.id, values);
      if (result) {
        setIsFormOpen(false);
        setEditingRuleType(null);
      }
    } else {
      const result = await createRuleType(values);
      if (result) {
        setIsFormOpen(false);
      }
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    await deleteRuleType(id);
  };

  return (
    <div style={{ padding: "24px" }}>
      <Card
        title="Rule Types"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={refresh}>
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Add Rule Type
            </Button>
          </Space>
        }
      >
        <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
          <Alert
            title="Rule Type Management"
            description="Rule types are used to categorize quality evaluation rules. Create and manage the lookup table of available rule types that can be used when creating evaluation rules."
            type="info"
            showIcon
          />

          <RuleTypeTable
            ruleTypes={ruleTypes}
            loading={isLoading || isDeleting}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </Space>
      </Card>

      {/* Rule Type Form Modal */}
      <RuleTypeForm
        open={isFormOpen}
        ruleType={editingRuleType || undefined}
        onSubmit={handleFormSubmit}
        onCancel={() => {
          setIsFormOpen(false);
          setEditingRuleType(null);
        }}
        loading={isCreating || isUpdating}
      />
    </div>
  );
}
