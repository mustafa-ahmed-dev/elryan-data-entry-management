/**
 * Permissions Matrix Component
 * Card-based view for managing role-based permissions
 * More intuitive for non-technical users
 */

"use client";

import { useState, useMemo } from "react";
import {
  Card,
  Switch,
  Select,
  Tag,
  Space,
  Button,
  message,
  Tooltip,
  Row,
  Col,
  Divider,
  Typography,
} from "antd";
import {
  SaveOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import {
  usePermissionMatrix,
  useUpdatePermissions,
} from "@/lib/hooks/usePermissions";
import type { PermissionScope } from "@/lib/types/auth";

const { Title, Text } = Typography;

interface PermissionChange {
  resourceId: number;
  actionId: number;
  granted: boolean;
  scope: PermissionScope;
}

// Define which actions are relevant for each resource
const RESOURCE_ACTIONS: Record<string, string[]> = {
  users: ["create", "read", "update", "delete"],
  teams: ["create", "read", "update", "delete"],
  schedules: ["create", "read", "update", "delete", "approve", "reject"],
  entries: ["create", "read", "update", "delete"],
  evaluations: ["create", "read", "update", "delete"],
  reports: ["read"],
  settings: ["read", "update"],
};

// Resource icons and descriptions
const RESOURCE_INFO: Record<
  string,
  { icon: string; color: string; description: string }
> = {
  users: {
    icon: "👥",
    color: "#1890ff",
    description: "Manage user accounts and profiles",
  },
  teams: {
    icon: "🏢",
    color: "#52c41a",
    description: "Manage teams and departments",
  },
  schedules: {
    icon: "📅",
    color: "#722ed1",
    description: "Create and approve work schedules",
  },
  entries: {
    icon: "📝",
    color: "#fa8c16",
    description: "Data entry management",
  },
  evaluations: {
    icon: "⭐",
    color: "#eb2f96",
    description: "Quality evaluations and scoring",
  },
  reports: {
    icon: "📊",
    color: "#13c2c2",
    description: "View analytics and reports",
  },
  settings: {
    icon: "⚙️",
    color: "#8c8c8c",
    description: "System settings and configuration",
  },
};

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

  // Group permissions by resource
  const groupedPermissions = useMemo(() => {
    if (!matrix || !selectedRole) return [];

    return matrix.resources.map((resource) => {
      const relevantActions = RESOURCE_ACTIONS[resource.name] || [];
      const actions = matrix.actions
        .filter((action) => relevantActions.includes(action.name))
        .map((action) => {
          const permission = rolePermissions.find(
            (p) => p.resourceId === resource.id && p.actionId === action.id
          );

          const changeKey = `${resource.id}-${action.id}`;
          const change = changes.get(changeKey);

          return {
            action,
            granted: change?.granted ?? permission?.granted ?? false,
            scope: change?.scope ?? permission?.scope ?? "own",
            permissionId: permission?.permissionId,
          };
        });

      return {
        resource,
        actions,
        info: RESOURCE_INFO[resource.name] || {
          icon: "📦",
          color: "#666",
          description: resource.description || "",
        },
      };
    });
  }, [matrix, selectedRole, rolePermissions, changes]);

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
          marginBottom: 24,
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
        <Card size="small" style={{ marginBottom: 24, background: "#fafafa" }}>
          <Space wrap>
            <Text strong>Permission Scopes:</Text>
            <Tag color="blue">Own - User&apos;s own data only</Tag>
            <Tag color="green">Team - Team data only</Tag>
            <Tag color="purple">All - All data system-wide</Tag>
          </Space>
        </Card>
      )}

      {/* Permissions Cards */}
      {selectedRole ? (
        <Row gutter={[16, 16]}>
          {groupedPermissions.map(({ resource, actions, info }) => (
            <Col xs={24} lg={12} xl={8} key={resource.id}>
              <Card
                title={
                  <Space>
                    <span style={{ fontSize: 24 }}>{info.icon}</span>
                    <span>
                      <strong>{resource.displayName}</strong>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {info.description}
                      </Text>
                    </span>
                  </Space>
                }
                bordered
                style={{
                  borderLeft: `4px solid ${info.color}`,
                  height: "100%",
                }}
              >
                <Space
                  direction="vertical"
                  style={{ width: "100%" }}
                  size="middle"
                >
                  {actions.map(({ action, granted, scope }) => (
                    <div key={action.id}>
                      <Space
                        style={{
                          width: "100%",
                          justifyContent: "space-between",
                        }}
                      >
                        <Space>
                          {granted ? (
                            <CheckCircleOutlined
                              style={{ color: "#52c41a", fontSize: 16 }}
                            />
                          ) : (
                            <CloseCircleOutlined
                              style={{ color: "#d9d9d9", fontSize: 16 }}
                            />
                          )}
                          <Tooltip title={action.description}>
                            <Text strong={granted}>{action.displayName}</Text>
                          </Tooltip>
                        </Space>

                        <Switch
                          checked={granted}
                          onChange={(checked) =>
                            handlePermissionChange(
                              resource.id,
                              action.id,
                              checked,
                              scope
                            )
                          }
                          size="small"
                        />
                      </Space>

                      {granted && (
                        <div style={{ marginTop: 8, marginLeft: 24 }}>
                          <Select
                            value={scope}
                            onChange={(newScope) =>
                              handleScopeChange(
                                resource.id,
                                action.id,
                                newScope
                              )
                            }
                            size="small"
                            style={{ width: "100%" }}
                            options={[
                              {
                                value: "own",
                                label: (
                                  <Space>
                                    <Tag color="blue">Own</Tag>
                                    <Text type="secondary">
                                      User&apos;s own only
                                    </Text>
                                  </Space>
                                ),
                              },
                              {
                                value: "team",
                                label: (
                                  <Space>
                                    <Tag color="green">Team</Tag>
                                    <Text type="secondary">Team data only</Text>
                                  </Space>
                                ),
                              },
                              {
                                value: "all",
                                label: (
                                  <Space>
                                    <Tag color="purple">All</Tag>
                                    <Text type="secondary">System-wide</Text>
                                  </Space>
                                ),
                              },
                            ]}
                          />
                        </div>
                      )}

                      {action.id !== actions[actions.length - 1].action.id && (
                        <Divider style={{ margin: "8px 0" }} />
                      )}
                    </div>
                  ))}
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Card
          style={{
            textAlign: "center",
            padding: 60,
            background: "#fafafa",
          }}
        >
          <Space direction="vertical" size="large">
            <div style={{ fontSize: 48 }}>🔐</div>
            <div>
              <Title level={4}>Select a Role to Manage Permissions</Title>
              <Text type="secondary">
                Choose a role from the dropdown above to view and configure its
                permissions
              </Text>
            </div>
          </Space>
        </Card>
      )}
    </div>
  );
}
