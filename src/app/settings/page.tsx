/**
 * Settings Main Page
 *
 * Central hub for all system settings
 */

"use client";

import { Card, Row, Col, Badge } from "antd";
import {
  FileTextOutlined,
  UserOutlined,
  TeamOutlined,
  SettingOutlined,
  SafetyOutlined,
  TagsOutlined,
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
      available: true, // ✨ Changed to true
    },
    {
      title: "Team Management",
      description: "Manage teams, leaders, and team members",
      icon: <TeamOutlined style={{ fontSize: "48px", color: "#fa8c16" }} />,
      path: "/settings/teams",
      available: true, // ✨ Changed to true
    },
    {
      title: "Security & Permissions",
      description: "Configure security settings and access control",
      icon: <SafetyOutlined style={{ fontSize: "48px", color: "#eb2f96" }} />,
      path: "/settings/security",
      available: true,
    },
    {
      title: "Rule Types",
      description: "Manage quality rule type categories",
      icon: <TagsOutlined style={{ fontSize: "48px", color: "#722ed1" }} />,
      path: "/settings/rule-types",
      available: true,
      comingSoon: false,
    },
  ];

  const handleCardClick = (card: any) => {
    if (card.available) {
      router.push(card.path);
    }
  };

  return (
    <div style={{ padding: "24px" }}>
      {/* Page Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 600, margin: 0 }}>
          Settings
        </h1>
        <p style={{ color: "#666", margin: "8px 0 0 0", fontSize: "16px" }}>
          Manage your system configuration and preferences
        </p>
      </div>

      {/* Settings Cards Grid */}
      <Row gutter={[24, 24]}>
        {settingsCards.map((card, index) => (
          <Col xs={24} sm={12} md={8} key={index}>
            <Badge.Ribbon
              text="Coming Soon"
              color="blue"
              style={{ display: card.comingSoon ? "block" : "none" }}
            >
              <Card
                hoverable={card.available}
                onClick={() => handleCardClick(card)}
                style={{
                  height: "220px",
                  cursor: card.available ? "pointer" : "not-allowed",
                  opacity: card.available ? 1 : 0.6,
                  transition: "all 0.3s",
                }}
                styles={{
                  body: {
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    textAlign: "center",
                  },
                }}
              >
                <div style={{ marginBottom: "16px" }}>{card.icon}</div>
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: 600,
                    margin: "0 0 8px 0",
                  }}
                >
                  {card.title}
                </h3>
                <p style={{ color: "#666", margin: 0, fontSize: "14px" }}>
                  {card.description}
                </p>
              </Card>
            </Badge.Ribbon>
          </Col>
        ))}
      </Row>
    </div>
  );
}
