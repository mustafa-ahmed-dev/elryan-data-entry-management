"use client";

import { Button } from "antd";
import { BulbOutlined, BulbFilled } from "@ant-design/icons";
import { useTheme } from "@/contexts/ThemeContext";

export function DarkModeToggle() {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <Button
      type="text"
      icon={isDarkMode ? <BulbFilled /> : <BulbOutlined />}
      onClick={toggleDarkMode}
      title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
    />
  );
}
