/**
 * Permissions Matrix Component
 * Interactive grid for managing role-based permissions
 */

"use client";

import { useState, useMemo } from "react";
import {
  Table,
  Switch,
  Select,
  Tag,
  Space,
  Button,
  message,
  Tooltip,
} from "antd";
import {
  SaveOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import {
  usePermissionMatrix,
  useUpdatePermissions,
} from "@/lib/hooks/usePermissions";
import type { PermissionScope } from "@/lib/types/auth";

interface PermissionChange {
  resourceId: number;
  actionId: number;
  granted: boolean;
  scope: PermissionScope;
}

export function PermissionsMatrix() {
  const { matrix, isLoading, refresh } = usePermissionMatrix();
  const { updatePermissions, isUpdating } = useUpdatePermissions();

  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [changes, setChanges] = useState<Map<string, PermissionChange>>(
    new Map()
  );

  // Get role options for dropdown
  const roleOptions = useMemo(() => {
    if (!matrix) return [];
    return matrix.roles.map((role) => ({
      value: role.id,
      label: `${role.displayName} (Level ${role.hierarchy})`,
    }));
  }, [matrix]);

  // Get permissions for selected role
  const rolePermissions = useMemo(() => {
    if (!matrix || !selectedRole) return [];

    return matrix.permissions.filter((p) => p.roleId === selectedRole);
  }, [matrix, selectedRole]);

  // Build table data
  const tableData = useMemo(() => {
    if (!matrix || !selectedRole) return [];

    const data: any[] = [];

    matrix.resources.forEach((resource) => {
      const row: any = {
        key: resource.id,
        resourceId: resource.id,
        resource: resource.displayName,
        resourceName: resource.name,
      };

      matrix.actions.forEach((action) => {
        const permission = rolePermissions.find(
          (p) => p.resourceId === resource.id && p.actionId === action.id
        );

        const changeKey = `${resource.id}-${action.id}`;
        const change = changes.get(changeKey);

        row[`action_${action.id}`] = {
          actionId: action.id,
          granted: change?.granted ?? permission?.granted ?? false,
          scope: change?.scope ?? permission?.scope ?? "own",
          permissionId: permission?.permissionId,
        };
      });

      data.push(row);
    });

    return data;
  }, [matrix, selectedRole, rolePermissions, changes]);

  // Build columns
  const columns = useMemo(() => {
    if (!matrix) return [];

    const cols: any[] = [
      {
        title: "Resource",
        dataIndex: "resource",
        key: "resource",
        fixed: "left",
        width: 150,
        render: (text: string, record: any) => (
          <Tooltip title={record.resourceName}>
            <strong>{text}</strong>
          </Tooltip>
        ),
      },
    ];

    matrix.actions.forEach((action) => {
      cols.push({
        title: (
          <Tooltip title={action.description || action.displayName}>
            {action.displayName}
          </Tooltip>
        ),
        dataIndex: `action_${action.id}`,
        key: `action_${action.id}`,
        width: 180,
        align: "center" as const,
        render: (value: any, record: any) => {
          const changeKey = `${record.resourceId}-${action.id}`;

          return (
            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              <Switch
                checked={value.granted}
                onChange={(checked) =>
                  handlePermissionChange(
                    record.resourceId,
                    action.id,
                    checked,
                    value.scope
                  )
                }
                checkedChildren="✓"
                unCheckedChildren="✗"
              />
              {value.granted && (
                <Select
                  value={value.scope}
                  onChange={(scope) =>
                    handleScopeChange(record.resourceId, action.id, scope)
                  }
                  size="small"
                  style={{ width: "100%" }}
                  options={[
                    { value: "own", label: "Own" },
                    { value: "team", label: "Team" },
                    { value: "all", label: "All" },
                  ]}
                />
              )}
            </Space>
          );
        },
      });
    });

    return cols;
  }, [matrix]);

  // Handle permission toggle
  const handlePermissionChange = (
    resourceId: number,
    actionId: number,
    granted: boolean,
    currentScope: PermissionScope
  ) => {
    const changeKey = `${resourceId}-${actionId}`;
    const newChanges = new Map(changes);

    newChanges.set(changeKey, {
      resourceId,
      actionId,
      granted,
      scope: granted ? currentScope : "own",
    });

    setChanges(newChanges);
  };

  // Handle scope change
  const handleScopeChange = (
    resourceId: number,
    actionId: number,
    scope: PermissionScope
  ) => {
    const changeKey = `${resourceId}-${actionId}`;
    const newChanges = new Map(changes);
    const existing = changes.get(changeKey);

    newChanges.set(changeKey, {
      resourceId,
      actionId,
      granted: existing?.granted ?? true,
      scope,
    });

    setChanges(newChanges);
  };

  // Save changes
  const handleSave = async () => {
    if (!selectedRole || changes.size === 0) {
      message.warning("No changes to save");
      return;
    }

    const updates = Array.from(changes.values());

    const result = await updatePermissions({
      roleId: selectedRole,
      updates,
    });

    if (result.success) {
      message.success(`Successfully updated ${result.updated} permission(s)`);
      setChanges(new Map());
      refresh();
    } else {
      message.error(result.error || "Failed to update permissions");
    }
  };

  // Cancel changes
  const handleCancel = () => {
    setChanges(new Map());
    message.info("Changes discarded");
  };

  if (isLoading) {
    return <div>Loading permission matrix...</div>;
  }

  if (!matrix) {
    return <div>Failed to load permission matrix</div>;
  }

  return (
    <div>
      {/* Header Controls */}
      <Space
        style={{
          marginBottom: 16,
          width: "100%",
          justifyContent: "space-between",
        }}
      >
        <Space>
          <Select
            placeholder="Select a role to manage"
            value={selectedRole}
            onChange={setSelectedRole}
            options={roleOptions}
            style={{ width: 300 }}
            size="large"
          />
          <Tooltip title="Each role has different permission levels. Select a role to view and edit its permissions.">
            <InfoCircleOutlined style={{ color: "#999" }} />
          </Tooltip>
        </Space>

        {selectedRole && (
          <Space>
            {changes.size > 0 && (
              <Tag color="orange">{changes.size} unsaved change(s)</Tag>
            )}
            <Button onClick={handleCancel} disabled={changes.size === 0}>
              Cancel
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={isUpdating}
              disabled={changes.size === 0}
            >
              Save Changes
            </Button>
            <Button icon={<ReloadOutlined />} onClick={refresh}>
              Refresh
            </Button>
          </Space>
        )}
      </Space>

      {/* Permission Scope Legend */}
      {selectedRole && (
        <div style={{ marginBottom: 16 }}>
          <Space>
            <span>Permission Scopes:</span>
            <Tag color="blue">Own - User&apos;s own resources only</Tag>
            <Tag color="green">Team - Team resources only</Tag>
            <Tag color="purple">All - All resources system-wide</Tag>
          </Space>
        </div>
      )}

      {/* Permissions Table */}
      {selectedRole ? (
        <Table
          columns={columns}
          dataSource={tableData}
          pagination={false}
          scroll={{ x: 1200, y: 600 }}
          bordered
          size="small"
        />
      ) : (
        <div
          style={{
            textAlign: "center",
            padding: 60,
            background: "#fafafa",
            borderRadius: 8,
          }}
        >
          <p style={{ fontSize: 16, color: "#999" }}>
            Select a role from the dropdown above to manage its permissions
          </p>
        </div>
      )}
    </div>
  );
}
