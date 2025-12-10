/**
 * Navigation Component
 *
 * Main navigation menu with role-based items
 * Used inside Sidebar component
 */

"use client";

import { Menu } from "antd";
import { usePathname, useRouter } from "next/navigation";
import type { MenuProps } from "antd";
import {
  DashboardOutlined,
  CalendarOutlined,
  FileTextOutlined,
  StarOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import { usePermissions } from "@/lib/hooks";

interface NavigationProps {
  mode?: "inline" | "horizontal" | "vertical";
  theme?: "light" | "dark";
}

export function Navigation({
  mode = "inline",
  theme = "dark",
}: NavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { can } = usePermissions();

  // Define all navigation items with their permission requirements
  const navigationItems = [
    {
      key: "/dashboard",
      icon: <DashboardOutlined />,
      label: "Dashboard",
      permission: null, // Everyone can access dashboard
    },
    {
      key: "/schedules",
      icon: <CalendarOutlined />,
      label: "Schedules",
      permission: { action: "read" as const, resource: "schedules" as const },
    },
    {
      key: "/entries",
      icon: <FileTextOutlined />,
      label: "Data Entries",
      permission: { action: "read" as const, resource: "entries" as const },
    },
    {
      key: "/evaluations",
      icon: <StarOutlined />,
      label: "Evaluations",
      permission: { action: "read" as const, resource: "evaluations" as const },
    },
    {
      key: "/reports",
      icon: <BarChartOutlined />,
      label: "Reports",
      permission: { action: "read" as const, resource: "reports" as const },
    },
  ];

  // Filter menu items based on permissions
  const menuItems: MenuProps["items"] = navigationItems
    .filter((item) => {
      // Show dashboard to everyone
      if (!item.permission) return true;

      // Check permission
      return can(item.permission.action, item.permission.resource);
    })
    .map((item) => ({
      key: item.key,
      icon: item.icon,
      label: item.label,
    }));

  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    router.push(key);
  };

  return (
    <Menu
      theme={theme}
      mode={mode}
      selectedKeys={[pathname]}
      items={menuItems}
      onClick={handleMenuClick}
      style={{ border: "none" }}
    />
  );
}
