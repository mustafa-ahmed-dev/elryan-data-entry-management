/**
 * Breadcrumbs Component
 *
 * Shows current page location in hierarchy
 */

"use client";

import { Breadcrumb } from "antd";
import { usePathname } from "next/navigation";
import { HomeOutlined } from "@ant-design/icons";
import Link from "next/link";

export function Breadcrumbs() {
  const pathname = usePathname();

  // Map paths to readable names
  const pathMap: Record<string, string> = {
    dashboard: "Dashboard",
    users: "Users",
    teams: "Teams",
    schedules: "Schedules",
    entries: "Data Entries",
    evaluations: "Evaluations",
    reports: "Reports",
  };

  // Skip breadcrumbs on dashboard
  if (pathname === "/dashboard") {
    return null;
  }

  // Generate breadcrumb items
  const pathSegments = pathname.split("/").filter(Boolean);

  const breadcrumbItems = [
    {
      title: (
        <Link href="/dashboard">
          <HomeOutlined /> Dashboard
        </Link>
      ),
    },
    ...pathSegments.map((segment, index) => {
      const path = `/${pathSegments.slice(0, index + 1).join("/")}`;
      const isLast = index === pathSegments.length - 1;
      const title =
        pathMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

      if (isLast) {
        return { title };
      }

      return {
        title: <Link href={path}>{title}</Link>,
      };
    }),
  ];

  return <Breadcrumb items={breadcrumbItems} />;
}
