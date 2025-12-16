/**
 * Main Layout Component
 *
 * Provides the main application layout with sidebar, header, and content area
 * Theme-aware for dark mode support
 */

"use client";

import { useState, ReactNode } from "react";
import { Layout, theme } from "antd";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Breadcrumbs } from "./Breadcrumbs";
import { useTheme } from "@/contexts/ThemeContext";

const { Content } = Layout;
const { useToken } = theme;

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { token } = useToken();
  const { isDarkMode } = useTheme();

  return (
    <Layout
      style={{
        minHeight: "100vh",
        backgroundColor: isDarkMode ? "#141414" : "#f0f2f5",
      }}
    >
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} onCollapse={setCollapsed} />

      {/* Main Content Area */}
      <Layout>
        {/* Header */}
        <Header
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
        />

        {/* Content */}
        <Content
          style={{
            margin: "24px 16px",
            padding: 24,
            background: token.colorBgContainer,
            borderRadius: "8px",
            minHeight: "calc(100vh - 200px)",
          }}
        >
          <Breadcrumbs />
          <div style={{ marginTop: "16px" }}>{children}</div>
        </Content>

        {/* Footer */}
        <Layout.Footer
          style={{
            textAlign: "center",
            backgroundColor: isDarkMode ? "#141414" : "#f0f2f5",
            color: isDarkMode ? "#a0a0a0" : "#666666",
          }}
        >
          Data Entry Quality Control System ©{new Date().getFullYear()}
        </Layout.Footer>
      </Layout>
    </Layout>
  );
}
