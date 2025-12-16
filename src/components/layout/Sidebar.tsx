/**
 * Sidebar Component
 *
 * Navigation sidebar with role-based menu items
 * Theme-aware for dark mode support
 */

"use client";

import { Layout } from "antd";
import { Navigation } from "./Navigation";
import { useTheme } from "@/contexts/ThemeContext";

const { Sider } = Layout;

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed, onCollapse }: SidebarProps) {
  const { isDarkMode } = useTheme();
  const siderTheme = isDarkMode ? "dark" : "light";

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      style={{
        overflow: "auto",
        height: "100vh",
        position: "sticky",
        top: 0,
        left: 0,
      }}
      theme={siderTheme}
    >
      {/* Logo */}
      <div
        style={{
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: isDarkMode ? "#fff" : "#000",
          fontSize: collapsed ? "20px" : "18px",
          fontWeight: "bold",
          padding: "0 16px",
          whiteSpace: "nowrap",
          overflow: "hidden",
        }}
      >
        {collapsed ? "QC" : "Quality Control"}
      </div>

      {/* Navigation Menu */}
      <Navigation mode="inline" theme={siderTheme} />
    </Sider>
  );
}
