/**
 * Security & Permissions Settings Page
 *
 * Admin interface for managing security policies and permissions
 */

"use client";

import { useState } from "react";
import { Tabs, Card, Alert } from "antd";
import {
  SafetyOutlined,
  AuditOutlined,
  SettingOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import { ProtectedRoute } from "@/components/auth";
import { MainLayout } from "@/components/layout";
import {
  PermissionsMatrix,
  SecurityPoliciesForm,
  PermissionAuditLog,
  SecurityMetrics,
} from "@/components/settings/security";

export default function SecuritySettingsPage() {
  return (
    <ProtectedRoute
      requiredPermission={{ action: "update", resource: "settings" }}
    >
      <MainLayout>
        <SecuritySettingsContent />
      </MainLayout>
    </ProtectedRoute>
  );
}

function SecuritySettingsContent() {
  const [activeTab, setActiveTab] = useState("permissions");

  const tabs = [
    {
      key: "permissions",
      label: (
        <span>
          <SafetyOutlined />
          Permissions Matrix
        </span>
      ),
      children: (
        <div>
          <Alert
            title="Manage Role-Based Permissions"
            description="Configure which actions each role can perform on system resources. Changes take effect immediately for all users with that role."
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
          <SecurityMetrics />
          <div style={{ marginTop: 24 }}>
            <PermissionsMatrix />
          </div>
        </div>
      ),
    },
    {
      key: "policies",
      label: (
        <span>
          <SettingOutlined />
          Security Policies
        </span>
      ),
      children: (
        <div>
          <Alert
            title="Configure Security Policies"
            description="Set password requirements, session timeouts, and login security settings. These policies apply to all users system-wide."
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
          <SecurityPoliciesForm />
        </div>
      ),
    },
    {
      key: "audit",
      label: (
        <span>
          <HistoryOutlined />
          Audit Log
        </span>
      ),
      children: (
        <div>
          <Alert
            title="Permission Change History"
            description="View a complete history of all permission changes, including who made the change, when, and what was modified."
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
          <PermissionAuditLog />
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>
          Security & Permissions
        </h1>
        <p style={{ color: "#666", marginTop: 8 }}>
          Manage role-based access control, security policies, and view audit
          logs
        </p>
      </div>

      {/* Tabs */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabs}
          size="large"
        />
      </Card>
    </div>
  );
}
