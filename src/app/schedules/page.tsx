"use client";

import { useEffect, useState } from "react";
import {
  Card,
  Statistic,
  Row,
  Col,
  Space,
  Typography,
  Tabs,
  Alert,
} from "antd";
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useAuth, useSchedules } from "@/lib/hooks";
import {
  BulkScheduleForm,
  PendingApprovalsTable,
  ScheduleGridView,
} from "@/components/schedules";
import { ProtectedRoute } from "@/components/auth";
import { MainLayout } from "@/components/layout";

const { Title } = Typography;

function SchedulesContent() {
  const { user } = useAuth();
  const {
    schedules,
    stats,
    loading,
    createBulkSchedules,
    approveSchedule,
    rejectSchedule,
  } = useSchedules();
  const [users, setUsers] = useState<
    Array<{ id: number; fullName: string; email: string; teamId?: number }>
  >([]);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [teams, setTeams] = useState<Array<{ id: number; name: string }>>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      setUsersError(null);
      try {
        const response = await fetch("/api/users?pageSize=100");

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch users");
        }

        const result = await response.json();
        setUsers(result.data);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to fetch users";
        setUsersError(errorMessage);
        console.error("Failed to fetch users:", error);
      }
    };

    if (
      user &&
      (user.roleName === "admin" || user.roleName === "team_leader")
    ) {
      fetchUsers();
    } else {
    }
  }, [user]);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch("/api/teams");

        if (!response.ok) {
          throw new Error("Failed to fetch teams");
        }

        const result = await response.json();

        if (result.success && Array.isArray(result.data)) {
          setTeams(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch teams:", error);
      }
    };

    if (user && user.roleName === "admin") {
      fetchTeams();
    }
  }, [user]);

  const canCreateSchedule =
    user?.roleName === "admin" || user?.roleName === "team_leader";

  const tabItems = [
    {
      key: "all",
      label: "All Schedules",
      children: (
        <ScheduleGridView
          schedules={schedules}
          loading={loading}
          teams={teams}
          userRole={user?.roleName}
        />
      ),
    },
  ];

  if (user?.roleName === "admin") {
    tabItems.push({
      key: "pending",
      label: "Pending Approvals",
      children: (
        <PendingApprovalsTable
          schedules={schedules.filter((s) => s.status === "pending_approval")}
          loading={loading}
          onApprove={approveSchedule}
          onReject={rejectSchedule}
        />
      ),
    });
  }

  if (canCreateSchedule) {
    tabItems.push({
      key: "bulk-create",
      label: "Bulk Create",
      children: (
        <>
          {usersError && (
            <Alert
              message="Error Loading Users"
              description={usersError}
              type="error"
              showIcon
              closable
              style={{ marginBottom: 16 }}
            />
          )}
          <BulkScheduleForm
            onSubmit={createBulkSchedules}
            loading={loading}
            users={users}
            teams={teams}
          />
        </>
      ),
    });
  }

  return (
    <Space orientation="vertical" size="large" style={{ width: "100%" }}>
      <Title level={2}>Schedules Management</Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Schedules"
              value={stats.total}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pending Approval"
              value={stats.pending}
              prefix={<ClockCircleOutlined />}
              styles={{ content: { color: "#faad14" } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Approved"
              value={stats.approved}
              prefix={<CheckCircleOutlined />}
              styles={{ content: { color: "#52c41a" } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Rejected"
              value={stats.rejected}
              prefix={<CloseCircleOutlined />}
              styles={{ content: { color: "#ff4d4f" } }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs items={tabItems} />
      </Card>
    </Space>
  );
}

export default function SchedulesPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <SchedulesContent />
      </MainLayout>
    </ProtectedRoute>
  );
}
