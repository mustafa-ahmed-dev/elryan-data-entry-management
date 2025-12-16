/**
 * Dashboard Page
 *
 * Main landing page after login
 * Shows different content based on user role
 */

"use client";

import { Card, Space, Typography, Tag } from "antd";
import { useAuth } from "@/lib/hooks";
import { ProtectedRoute } from "@/components/auth";
import { MainLayout } from "@/components/layout";
import {
  AdminDashboard,
  TeamLeaderDashboard,
  EmployeeDashboard,
} from "@/components/dashboard";
import { ROLE_LABELS } from "@/lib/constants/roles";

const { Title } = Typography;

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

  if (!user) return null;

  return (
    <div>
      {/* Welcome Header */}
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

      {/* Role-Specific Dashboard */}
      {isAdmin && <AdminDashboard />}
      {isTeamLeader && <TeamLeaderDashboard />}
      {isEmployee && <EmployeeDashboard />}
    </div>
  );
}
