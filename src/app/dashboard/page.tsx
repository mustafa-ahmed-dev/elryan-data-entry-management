/**
 * Dashboard Page
 *
 * Main landing page after login
 * Shows different content based on user role
 */

"use client";

import { Card, Row, Col, Typography, Button, Space, Tag, Divider } from "antd";
import {
  UserOutlined,
  TeamOutlined,
  CalendarOutlined,
  FileTextOutlined,
  StarOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import { useAuth, usePermissions } from "@/lib/hooks";
import {
  ProtectedRoute,
  PermissionGate,
  AdminOnly,
  TeamLeaderOnly,
} from "@/components/auth";
import { MainLayout } from "@/components/layout";
import { ROLE_LABELS } from "@/lib/constants/roles";

const { Title, Text, Paragraph } = Typography;

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <DashboardContent />
      </MainLayout>
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { user, isAdmin, isTeamLeader, isEmployee } = useAuth();
  const { permissions, isLoading, can } = usePermissions();

  if (!user) return null;

  return (
    <div style={{ background: "#f0f2f5" }}>
      {/* Welcome Card */}
      <Card
        style={{
          marginBottom: "24px",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <Space orientation="vertical" size={0}>
          <Title level={2} style={{ color: "white", margin: 0 }}>
            Welcome back, {user.fullName}!
          </Title>
          <Space>
            <Tag color="white" style={{ color: "#667eea" }}>
              {ROLE_LABELS[user.roleName]}
            </Tag>
            {user.teamId && <Tag color="cyan">Team ID: {user.teamId}</Tag>}
          </Space>
        </Space>
      </Card>

      {/* User Info Card */}
      <Card title="Your Account Information" style={{ marginBottom: "24px" }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Text strong>Email:</Text>
            <br />
            <Text>{user.email}</Text>
          </Col>
          <Col xs={24} md={12}>
            <Text strong>Role:</Text>
            <br />
            <Text>{ROLE_LABELS[user.roleName]}</Text>
          </Col>
          <Col xs={24} md={12}>
            <Text strong>User ID:</Text>
            <br />
            <Text>{user.id}</Text>
          </Col>
          <Col xs={24} md={12}>
            <Text strong>Team ID:</Text>
            <br />
            <Text>{user.teamId || "No team assigned"}</Text>
          </Col>
        </Row>
      </Card>

      {/* Permissions Card */}
      <Card
        title="Your Permissions"
        loading={isLoading}
        style={{ marginBottom: "24px" }}
      >
        {!isLoading && permissions.length > 0 ? (
          <>
            <Paragraph>
              You have <strong>{permissions.length} permissions</strong> in the
              system:
            </Paragraph>
            <div style={{ maxHeight: "300px", overflow: "auto" }}>
              <Row gutter={[8, 8]}>
                {permissions.map((perm, index) => (
                  <Col key={index}>
                    <Tag color="blue">
                      {perm.action} {perm.resource} ({perm.scope})
                    </Tag>
                  </Col>
                ))}
              </Row>
            </div>
          </>
        ) : (
          <Text type="secondary">No permissions loaded</Text>
        )}
      </Card>

      {/* Role-Specific Content */}
      <Row gutter={[16, 16]}>
        {/* Admin Only Section */}
        <AdminOnly>
          <Col xs={24}>
            <Card
              title="🔐 Admin Controls"
              style={{ background: "#fff1f0", borderColor: "#ffccc7" }}
            >
              <Paragraph>
                <Text strong>You have administrator access!</Text>
              </Paragraph>
              <Paragraph>
                As an admin, you can manage all users, teams, schedules, and
                data in the system.
              </Paragraph>
              <Space>
                <Button type="primary" icon={<UserOutlined />}>
                  Manage Users
                </Button>
                <Button icon={<TeamOutlined />}>Manage Teams</Button>
                <Button icon={<BarChartOutlined />}>View All Reports</Button>
              </Space>
            </Card>
          </Col>
        </AdminOnly>

        {/* Team Leader Only Section */}
        <TeamLeaderOnly>
          <Col xs={24}>
            <Card
              title="👥 Team Leader Controls"
              style={{ background: "#e6f7ff", borderColor: "#91d5ff" }}
            >
              <Paragraph>
                <Text strong>You are a team leader!</Text>
              </Paragraph>
              <Paragraph>
                You can create schedules for your team and evaluate their data
                entry quality.
              </Paragraph>
              <Space>
                <Button type="primary" icon={<CalendarOutlined />}>
                  Create Schedule
                </Button>
                <Button icon={<StarOutlined />}>Evaluate Team</Button>
                <Button icon={<BarChartOutlined />}>Team Reports</Button>
              </Space>
            </Card>
          </Col>
        </TeamLeaderOnly>

        {/* Employee Section */}
        <PermissionGate permission={{ action: "create", resource: "entries" }}>
          <Col xs={24} lg={12}>
            <Card
              title="📝 Data Entry"
              extra={
                <FileTextOutlined
                  style={{ fontSize: "24px", color: "#1890ff" }}
                />
              }
            >
              <Paragraph>Create and manage your daily data entries.</Paragraph>
              <Button type="primary" block>
                Create New Entry
              </Button>
            </Card>
          </Col>
        </PermissionGate>

        <PermissionGate
          permission={{ action: "read", resource: "schedules", scope: "own" }}
        >
          <Col xs={24} lg={12}>
            <Card
              title="📅 My Schedule"
              extra={
                <CalendarOutlined
                  style={{ fontSize: "24px", color: "#52c41a" }}
                />
              }
            >
              <Paragraph>View your assigned work schedule.</Paragraph>
              <Button type="primary" block>
                View Schedule
              </Button>
            </Card>
          </Col>
        </PermissionGate>

        <PermissionGate
          permission={{ action: "read", resource: "evaluations", scope: "own" }}
        >
          <Col xs={24} lg={12}>
            <Card
              title="⭐ My Evaluations"
              extra={
                <StarOutlined style={{ fontSize: "24px", color: "#faad14" }} />
              }
            >
              <Paragraph>View quality evaluations of your work.</Paragraph>
              <Button type="primary" block>
                View Evaluations
              </Button>
            </Card>
          </Col>
        </PermissionGate>

        <PermissionGate
          permission={{ action: "read", resource: "reports", scope: "own" }}
        >
          <Col xs={24} lg={12}>
            <Card
              title="📊 My Performance"
              extra={
                <BarChartOutlined
                  style={{ fontSize: "24px", color: "#722ed1" }}
                />
              }
            >
              <Paragraph>
                View your performance reports and statistics.
              </Paragraph>
              <Button type="primary" block>
                View Reports
              </Button>
            </Card>
          </Col>
        </PermissionGate>
      </Row>

      <Divider />

      {/* Test Section - Show permission checks */}
      <Card title="🧪 Permission Test Results">
        <Space orientation="vertical" style={{ width: "100%" }}>
          <Text>
            <strong>Role Checks:</strong>
          </Text>
          <Text>• Is Admin? {isAdmin() ? "✅ Yes" : "❌ No"}</Text>
          <Text>• Is Team Leader? {isTeamLeader() ? "✅ Yes" : "❌ No"}</Text>
          <Text>• Is Employee? {isEmployee() ? "✅ Yes" : "❌ No"}</Text>

          <Divider style={{ margin: "12px 0" }} />

          <Text>
            <strong>Permission Checks:</strong>
          </Text>
          <PermissionGate permission={{ action: "create", resource: "users" }}>
            <Text>• ✅ Can create users</Text>
          </PermissionGate>
          {!can("create", "users") && (
            <Text type="secondary">• ❌ Cannot create users</Text>
          )}

          <PermissionGate permission={{ action: "delete", resource: "users" }}>
            <Text>• ✅ Can delete users</Text>
          </PermissionGate>
          {!can("delete", "users") && (
            <Text type="secondary">• ❌ Cannot delete users</Text>
          )}

          <PermissionGate
            permission={{ action: "approve", resource: "schedules" }}
          >
            <Text>• ✅ Can approve schedules</Text>
          </PermissionGate>
          {!can("approve", "schedules") && (
            <Text type="secondary">• ❌ Cannot approve schedules</Text>
          )}

          <PermissionGate
            permission={{ action: "create", resource: "entries" }}
          >
            <Text>• ✅ Can create entries</Text>
          </PermissionGate>
          {!can("create", "entries") && (
            <Text type="secondary">• ❌ Cannot create entries</Text>
          )}
        </Space>
      </Card>
    </div>
  );
}
