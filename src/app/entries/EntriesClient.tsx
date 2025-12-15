"use client";

import { useState, useEffect } from "react";
import { Card, Row, Col, Statistic, Tabs, Space, message } from "antd";
import {
  FileTextOutlined,
  CalendarOutlined,
  PlusOutlined,
  UnorderedListOutlined,
  CheckCircleOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { MainLayout } from "@/components/layout";
import { ProtectedRoute } from "@/components/auth";
import {
  EntryForm,
  EntryTable,
  EntryFilter,
  BulkEntryCSVForm,
} from "@/components/entries";
import type { FilterValues } from "@/components/entries";

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
  sku: string;
  entryTime: string;
  hasEvaluation: boolean;
}

interface Statistics {
  total: number;
  today: number;
  thisWeek: number;
  evaluatedRate: number;
}

export function EntriesClient({ user }: EntriesClientProps) {
  const [activeTab, setActiveTab] = useState("1");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    total: 0,
    today: 0,
    thisWeek: 0,
    evaluatedRate: 0,
  });
  const [filters, setFilters] = useState<FilterValues>({});
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [entryTypes, setEntryTypes] = useState<any[]>([]);

  useEffect(() => {
    fetchEntries();
    fetchStatistics();
  }, [filters, pagination.current, pagination.pageSize]);

  useEffect(() => {
    fetchEntryTypes();
    fetchUsers();
  }, []);

  const canBulkCreate = user.role === "admin" || user.role === "team_leader";

  const fetchEntryTypes = async () => {
    try {
      const response = await fetch("/api/entry-types");
      if (response.ok) {
        const result = await response.json();
        setEntryTypes(result.data || result || []);
      }
    } catch (error) {
      console.error("Failed to fetch entry types:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const result = await response.json();
        setUsers(result.data || result || []);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

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
      if (filters.evaluationStatus && filters.evaluationStatus !== "all") {
        params.append(
          "hasEvaluation",
          filters.evaluationStatus === "evaluated" ? "true" : "false"
        );
      }

      const response = await fetch(`/api/entries?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch entries");
      }

      const data = await response.json();
      setEntries(data.data || []);
      setPagination((prev) => ({
        ...prev,
        total: data.pagination?.total || 0,
      }));
    } catch (error: any) {
      message.error(error.message || "Failed to load entries");
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.employeeId)
        params.append("employeeId", filters.employeeId.toString());
      if (filters.teamId) params.append("teamId", filters.teamId.toString());

      const response = await fetch(`/api/entries/stats?${params}`);

      if (response.ok) {
        const data = await response.json();
        setStatistics({
          total: data.totalEntries || 0,
          today: data.todayEntries || 0,
          thisWeek: data.weekEntries || 0,
          evaluatedRate: data.evaluatedRate || 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch statistics:", error);
    }
  };

  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handlePageChange = (page: number, pageSize: number) => {
    setPagination((prev) => ({ ...prev, current: page, pageSize }));
  };

  const handleCreateEntry = async (values: any) => {
    try {
      const response = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create entry");
      }

      message.success("Entry created successfully!");
      fetchEntries();
      fetchStatistics();
    } catch (error: any) {
      throw error;
    }
  };

  const handleBulkCreateEntries = async (entries: any[]) => {
    try {
      const response = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entries), // Array of entries
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || "Failed to create entries",
        };
      }

      // Refresh data
      await fetchEntries();
      await fetchStatistics();

      return {
        success: true,
        message:
          result.message || `Successfully created ${entries.length} entries`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to create entries",
      };
    }
  };

  const handleDeleteEntry = async (id: number) => {
    try {
      const response = await fetch(`/api/entries/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete entry");
      }

      fetchEntries();
      fetchStatistics();
    } catch (error: any) {
      throw error;
    }
  };

  const tabItems = [
    {
      key: "1",
      label: (
        <span>
          <UnorderedListOutlined />
          All Entries
        </span>
      ),
      children: (
        <Space orientation="vertical" size="large" style={{ width: "100%" }}>
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
            onDelete={handleDeleteEntry}
            userRole={user.role}
          />
        </Space>
      ),
    },
    {
      key: "2",
      label: (
        <span>
          <PlusOutlined />
          Create Entry
        </span>
      ),
      children: (
        <EntryForm
          entryTypes={entryTypes}
          onSubmit={handleCreateEntry}
          employeeId={user.id}
        />
      ),
    },
  ];

  if (canBulkCreate) {
    tabItems.push({
      key: "3",
      label: (
        <span>
          <UploadOutlined />
          Bulk Upload CSV
        </span>
      ),
      children: (
        <BulkEntryCSVForm
          entryTypes={entryTypes}
          users={users}
          onSubmit={handleBulkCreateEntries}
        />
      ),
    });
  }

  return (
    <ProtectedRoute
      requiredPermission={{ action: "read", resource: "entries" }}
    >
      <MainLayout>
        <Space orientation="vertical" size="large" style={{ width: "100%" }}>
          {/* Statistics */}
          <Row gutter={16}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total Entries"
                  value={statistics.total}
                  prefix={<FileTextOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Today's Entries"
                  value={statistics.today}
                  prefix={<CalendarOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="This Week"
                  value={statistics.thisWeek}
                  prefix={<FileTextOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Evaluated Rate"
                  value={statistics.evaluatedRate}
                  suffix="%"
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
          </Row>

          {/* Tabs */}
          <Card>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={tabItems}
            />
          </Card>
        </Space>
      </MainLayout>
    </ProtectedRoute>
  );
}
