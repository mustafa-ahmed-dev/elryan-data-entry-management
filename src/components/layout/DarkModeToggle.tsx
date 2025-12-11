"use client";

import { Button } from "antd";
import { BulbOutlined, BulbFilled } from "@ant-design/icons";
import { useState, useEffect } from "react";

export function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    setIsDark(savedTheme === "dark");
  }, []);

  const handleToggle = () => {
    if (typeof window !== "undefined" && (window as any).toggleDarkMode) {
      (window as any).toggleDarkMode();
      const newMode = localStorage.getItem("theme") === "dark";
      setIsDark(newMode);
    }
  };

  return (
    <Button
      type="text"
      icon={isDark ? <BulbFilled /> : <BulbOutlined />}
      onClick={handleToggle}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    />
  );
}
