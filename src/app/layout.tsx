"use client";

import { Inter } from "next/font/google";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider, theme } from "antd";
import { SessionProvider } from "@/components/auth";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

function AppContent({ children }: { children: React.ReactNode }) {
  const { isDarkMode, mounted } = useTheme();

  // Prevent flash of wrong theme
  if (!mounted) {
    return (
      <ConfigProvider
        theme={{
          algorithm: theme.defaultAlgorithm,
          token: {
            colorPrimary: "#1890ff",
            borderRadius: 6,
          },
        }}
      >
        {children}
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: "#1890ff",
          borderRadius: 6,
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider>
          <SessionProvider>
            <AntdRegistry>
              <AppContent>{children}</AppContent>
            </AntdRegistry>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
