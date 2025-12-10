"use client";

import { useState, useEffect } from "react";
import { Card, Row, Col, Statistic, Tabs, Space, message } from "antd";
import {
  FileTextOutlined,
  CalendarOutlined,
  TrophyOutlined,
  PlusOutlined,
  UnorderedListOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { EntryForm, EntryTable, EntryFilter } from "@/components/entries";
import type { FilterValues } from "@/components/entries/EntryFilter";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface EntriesClientProps {
  user: User;
}

interface Entry {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeEmail: string;
  entryTypeId: number;
  entryTypeName: string;
  productName: string;
  productDescription: string;
  followsNamingConvention: boolean;
  followsSpecificationOrder: boolean;
  containsUnwantedKeywords: boolean;
  entryTime: string;
  hasEvaluation: boolean;
}

interface Statistics {
  total: number;
  today: number;
  thisWeek: number;
  qualityPassRate: number;
}

export default function EntriesClient({ user }: EntriesClientProps) {
  const [activeTab, setActiveTab] = useState("1");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState<Statistics>({
    total: 0,
    today: 0,
    thisWeek: 0,
    qualityPassRate: 0,
  });
  const [filters, setFilters] = useState<FilterValues>({});
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  useEffect(() => {
    fetchEntries();
    fetchStatistics();
  }, [filters, pagination.current, pagination.pageSize]);

  const fetchEntries = async () => {
    try {
      setLoading(true);

      // Build query params
      const params = new URLSearchParams({
        page: pagination.current.toString(),
        limit: pagination.pageSize.toString(),
      });

      // Add filters
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.entryTypeId)
        params.append("entryTypeId", filters.entryTypeId.toString());
      if (filters.employeeId)
        params.append("employeeId", filters.employeeId.toString());
      if (filters.teamId) params.append("teamId", filters.teamId.toString());
      if (filters.qualityStatus && filters.qualityStatus !== "all") {
        params.append("qualityStatus", filters.qualityStatus);
      }
      if (filters.evaluationStatus && filters.evaluationStatus !== "all") {
        params.append(
          "hasEvaluation",
          filters.evaluationStatus === "evaluated" ? "true" : "false"
        );
      }

      const response = await fetch(`/api/entries?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch entries");
      }

      const data = await response.json();

      setEntries(data.entries || []);
      setPagination((prev) => ({
        ...prev,
        total: data.total || 0,
      }));
    } catch (error: any) {
      message.error(error.message || "Failed to load entries");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch("/api/entries/statistics");

      if (!response.ok) {
        throw new Error("Failed to fetch statistics");
      }

      const data = await response.json();

      setStatistics({
        total: data.total || 0,
        today: data.today || 0,
        thisWeek: data.thisWeek || 0,
        qualityPassRate: data.qualityPassRate || 0,
      });
    } catch (error) {
      console.error("Failed to load statistics:", error);
      // Don't show error message for statistics as it's not critical
    }
  };

  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, current: 1 })); // Reset to first page
  };

  const handlePageChange = (page: number, pageSize: number) => {
    setPagination({ current: page, pageSize, total: pagination.total });
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/entries/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete entry");
      }

      // Refresh data
      await fetchEntries();
      await fetchStatistics();
    } catch (error: any) {
      throw error;
    }
  };

  const handleCreateSuccess = () => {
    // Switch to view tab
    setActiveTab("2");
    // Refresh data
    fetchEntries();
    fetchStatistics();
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        <Space orientation="vertical" size="large" style={{ width: "100%" }}>
          {/* Statistics Cards */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total Entries"
                  value={statistics.total}
                  prefix={<FileTextOutlined />}
                  styles={{content:  {color: "#1890ff" }}}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Today's Entries"
                  value={statistics.today}
                  prefix={<CalendarOutlined />}
                  styles={{content: { color: "#52c41a" }}}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="This Week"
                  value={statistics.thisWeek}
                  prefix={<CheckCircleOutlined />}
                  styles={{content: { color: "#faad14" }}}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Quality Pass Rate"
                  value={statistics.qualityPassRate}
                  suffix="%"
                  precision={1}
                  prefix={<TrophyOutlined />}
                  styles={{
                    content: {
                      color:
                        statistics.qualityPassRate >= 80
                          ? "#52c41a"
                          : statistics.qualityPassRate >= 60
                          ? "#faad14"
                          : "#ff4d4f",
                    },
                  }}
                />
              </Card>
            </Col>
          </Row>

          {/* Tabs */}
          <Card>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={[
                {
                  key: "1",
                  label: (
                    <span>
                      <PlusOutlined />
                      Create Entry
                    </span>
                  ),
                  children: (
                    <EntryForm
                      employeeId={user.id}
                      onSuccess={handleCreateSuccess}
                    />
                  ),
                },
                {
                  key: "2",
                  label: (
                    <span>
                      <UnorderedListOutlined />
                      View Entries
                    </span>
                  ),
                  children: (
                    <Space
                      orientation="vertical"
                      size="middle"
                      style={{ width: "100%" }}
                    >
                      <EntryFilter
                        onFilterChange={handleFilterChange}
                        userRole={user.role}
                        currentFilters={filters}
                      />
                      <EntryTable
                        entries={entries}
                        loading={loading}
                        pagination={pagination}
                        onPageChange={handlePageChange}
                        onDelete={
                          user.role === "admin" ? handleDelete : undefined
                        }
                        userRole={user.role}
                      />
                    </Space>
                  ),
                },
              ]}
            />
          </Card>
        </Space>
      </MainLayout>
    </ProtectedRoute>
  );
}
