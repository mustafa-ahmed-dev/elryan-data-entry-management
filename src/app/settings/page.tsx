/**
 * Settings Main Page
 *
 * Central hub for all system settings
 */

"use client";

import { Card, Row, Col } from "antd";
import {
  FileTextOutlined,
  UserOutlined,
  TeamOutlined,
  SettingOutlined,
  SafetyOutlined,
  BellOutlined,
} from "@ant-design/icons";
import { ProtectedRoute } from "@/components/auth";
import { MainLayout } from "@/components/layout";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  return (
    <ProtectedRoute
      requiredPermission={{ action: "update", resource: "evaluations" }}
    >
      <MainLayout>
        <SettingsContent />
      </MainLayout>
    </ProtectedRoute>
  );
}

function SettingsContent() {
  const router = useRouter();

  const settingsCards = [
    {
      title: "Quality Rules",
      description: "Manage evaluation rule sets and quality standards",
      icon: <FileTextOutlined style={{ fontSize: "48px", color: "#1890ff" }} />,
      path: "/settings/quality-rules",
      available: true,
    },
    {
      title: "Entry Types",
      description: "Configure data entry types and categories",
      icon: <SettingOutlined style={{ fontSize: "48px", color: "#52c41a" }} />,
      path: "/settings/entry-types",
      available: true,
    },
    {
      title: "User Management",
      description: "Manage users, roles, and permissions",
      icon: <UserOutlined style={{ fontSize: "48px", color: "#722ed1" }} />,
      path: "/settings/users",
      available: false,
      comingSoon: true,
    },
    {
      title: "Team Settings",
      description: "Configure teams and team structures",
      icon: <TeamOutlined style={{ fontSize: "48px", color: "#fa8c16" }} />,
      path: "/settings/teams",
      available: false,
      comingSoon: true,
    },
    {
      title: "Security & Permissions",
      description: "Configure security settings and access control",
      icon: <SafetyOutlined style={{ fontSize: "48px", color: "#eb2f96" }} />,
      path: "/settings/security",
      available: false,
      comingSoon: true,
    },
    {
      title: "Notifications",
      description: "Configure email and system notifications",
      icon: <BellOutlined style={{ fontSize: "48px", color: "#13c2c2" }} />,
      path: "/settings/notifications",
      available: false,
      comingSoon: true,
    },
  ];

  const handleCardClick = (path: string, available: boolean) => {
    if (available) {
      router.push(path);
    }
  };

  return (
    <div style={{ padding: "24px" }}>
      {/* Page Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 600, margin: 0 }}>
          Settings
        </h1>
        <p style={{ color: "#666", margin: "8px 0 0 0" }}>
          Configure and manage system settings
        </p>
      </div>

      {/* Settings Cards */}
      <Row gutter={[24, 24]}>
        {settingsCards.map((setting) => (
          <Col xs={24} sm={12} lg={8} key={setting.title}>
            <Card
              hoverable={setting.available}
              onClick={() => handleCardClick(setting.path, setting.available)}
              style={{
                height: "100%",
                cursor: setting.available ? "pointer" : "not-allowed",
                opacity: setting.available ? 1 : 0.6,
              }}
            >
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ marginBottom: "16px" }}>{setting.icon}</div>
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: 600,
                    margin: "0 0 8px 0",
                  }}
                >
                  {setting.title}
                  {setting.comingSoon && (
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#faad14",
                        marginLeft: "8px",
                        fontWeight: 400,
                      }}
                    >
                      (Coming Soon)
                    </span>
                  )}
                </h3>
                <p style={{ color: "#666", margin: 0 }}>
                  {setting.description}
                </p>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
