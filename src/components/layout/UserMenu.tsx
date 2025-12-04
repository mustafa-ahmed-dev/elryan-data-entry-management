/**
 * User Menu Component
 *
 * Dropdown menu with user info and logout
 */

"use client";

import { Dropdown, Avatar, Space, Typography, Tag } from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { signOut } from "next-auth/react";
import { useAuth } from "@/lib/hooks/useAuth";
import { ROLE_LABELS } from "@/lib/constants/roles";

const { Text } = Typography;

export function UserMenu() {
  const { user } = useAuth();

  if (!user) return null;

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  const menuItems: MenuProps["items"] = [
    {
      key: "user-info",
      label: (
        <div style={{ padding: "8px 0" }}>
          <Text strong>{user.fullName}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {user.email}
          </Text>
          <br />
          <Tag color="blue" style={{ marginTop: "8px" }}>
            {ROLE_LABELS[user.roleName]}
          </Tag>
        </div>
      ),
      disabled: true,
    },
    {
      type: "divider",
    },
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "My Profile",
      onClick: () => {
        // TODO: Navigate to profile page
        console.log("Navigate to profile");
      },
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "Settings",
      onClick: () => {
        // TODO: Navigate to settings page
        console.log("Navigate to settings");
      },
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Logout",
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <Dropdown
      menu={{ items: menuItems }}
      placement="bottomRight"
      trigger={["click"]}
    >
      <Space style={{ cursor: "pointer" }}>
        <Avatar style={{ backgroundColor: "#1890ff" }} icon={<UserOutlined />}>
          {user.fullName.charAt(0).toUpperCase()}
        </Avatar>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          <Text strong style={{ fontSize: "14px" }}>
            {user.fullName}
          </Text>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {ROLE_LABELS[user.roleName]}
          </Text>
        </div>
      </Space>
    </Dropdown>
  );
}
