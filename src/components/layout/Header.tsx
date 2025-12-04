/**
 * Header Component
 *
 * Top header with menu toggle and user menu
 */

"use client";

import { Layout, Button, Space } from "antd";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { UserMenu } from "./UserMenu";

const { Header: AntHeader } = Layout;

interface HeaderProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Header({ collapsed, onToggle }: HeaderProps) {
  return (
    <AntHeader
      style={{
        padding: "0 24px",
        background: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        position: "sticky",
        top: 0,
        zIndex: 1,
      }}
    >
      {/* Left side - Toggle button */}
      <Button
        type="text"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={onToggle}
        style={{
          fontSize: "16px",
          width: 64,
          height: 64,
        }}
      />

      {/* Right side - User menu */}
      <Space>
        <UserMenu />
      </Space>
    </AntHeader>
  );
}
