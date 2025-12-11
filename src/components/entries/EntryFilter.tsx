"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  DatePicker,
  Select,
  Button,
  Space,
  Collapse,
  message,
} from "antd";
import { FilterOutlined, ClearOutlined } from "@ant-design/icons";
import { Dayjs } from "dayjs";

const { RangePicker } = DatePicker;

interface EntryType {
  id: number;
  name: string;
}

interface Employee {
  id: number;
  name: string;
  email: string;
}

interface Team {
  id: number;
  name: string;
}

export interface FilterValues {
  startDate?: string;
  endDate?: string;
  entryTypeId?: number;
  employeeId?: number;
  teamId?: number;
  evaluationStatus?: "all" | "evaluated" | "not_evaluated";
}

interface EntryFilterProps {
  onFilterChange: (filters: FilterValues) => void;
  userRole?: string;
  currentFilters?: FilterValues;
}

export function EntryFilter({
  onFilterChange,
  userRole,
  currentFilters = {},
}: EntryFilterProps) {
  const [dateRange, setDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);
  const [entryTypeId, setEntryTypeId] = useState<number | undefined>(
    currentFilters.entryTypeId
  );
  const [employeeId, setEmployeeId] = useState<number | undefined>(
    currentFilters.employeeId
  );
  const [teamId, setTeamId] = useState<number | undefined>(
    currentFilters.teamId
  );
  const [evaluationStatus, setEvaluationStatus] = useState<string | undefined>(
    currentFilters.evaluationStatus || "all"
  );

  const [entryTypes, setEntryTypes] = useState<EntryType[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  const isTeamLeaderOrAdmin =
    userRole === "team_leader" || userRole === "admin";
  const isAdmin = userRole === "admin";

  // Fetch entry types on mount
  useEffect(() => {
    const fetchEntryTypes = async () => {
      try {
        const response = await fetch("/api/entry-types");
        if (response.ok) {
          const result = await response.json();
          setEntryTypes(result.data || result || []);
        }
      } catch (error) {
        console.error("Failed to fetch entry types:", error);
        setEntryTypes([]);
      }
    };

    fetchEntryTypes();
  }, []);

  // Fetch employees when role allows (now all roles can see employees)
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch("/api/users");
        if (response.ok) {
          const data = await response.json();
          // Handle different response formats
          let usersList = [];
          if (Array.isArray(data)) {
            usersList = data;
          } else if (data && Array.isArray(data.data)) {
            usersList = data.data;
          } else if (data && Array.isArray(data.users)) {
            usersList = data.users;
          }

          // Map to employee format with proper name field
          const mappedEmployees = usersList.map((u: any) => ({
            id: u.id,
            name: u.name || u.fullName,
            email: u.email,
          }));

          setEmployees(mappedEmployees);
        }
      } catch (error) {
        console.error("Failed to fetch employees:", error);
      }
    };

    fetchEmployees();
  }, []);

  // Fetch teams when role allows
  useEffect(() => {
    if (!isAdmin) return;

    const fetchTeams = async () => {
      try {
        const response = await fetch("/api/teams");
        if (response.ok) {
          const result = await response.json();
          setTeams(result.data || result.teams || []);
        }
      } catch (error) {
        console.error("Failed to fetch teams:", error);
        setTeams([]);
      }
    };

    fetchTeams();
  }, [isAdmin]);

  const handleApplyFilters = () => {
    const filters: FilterValues = {
      startDate: dateRange?.[0]?.toISOString(),
      endDate: dateRange?.[1]?.toISOString(),
      entryTypeId,
      employeeId,
      teamId,
      evaluationStatus: evaluationStatus as any,
    };

    // Remove undefined values and "all" values
    Object.keys(filters).forEach((key) => {
      if (
        filters[key as keyof FilterValues] === undefined ||
        filters[key as keyof FilterValues] === "all"
      ) {
        delete filters[key as keyof FilterValues];
      }
    });

    onFilterChange(filters);
    message.success("Filters applied");
  };

  const handleClearFilters = () => {
    setDateRange(null);
    setEntryTypeId(undefined);
    setEmployeeId(undefined);
    setTeamId(undefined);
    setEvaluationStatus("all");
    onFilterChange({});
    message.info("Filters cleared");
  };

  return (
    <Card style={{ marginBottom: 16 }}>
      <Collapse
        defaultActiveKey={["1"]}
        expandIconPosition="end"
        items={[
          {
            key: "1",
            label: (
              <Space>
                <FilterOutlined />
                <strong>Filters</strong>
              </Space>
            ),
            children: (
              <>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} lg={8}>
                    <div style={{ marginBottom: 8 }}>
                      <strong>Date Range</strong>
                    </div>
                    <RangePicker
                      value={dateRange}
                      onChange={(dates) => setDateRange(dates as any)}
                      style={{ width: "100%" }}
                      format="YYYY-MM-DD"
                      placeholder={["Start Date", "End Date"]}
                    />
                  </Col>

                  <Col xs={24} sm={12} lg={8}>
                    <div style={{ marginBottom: 8 }}>
                      <strong>Entry Type</strong>
                    </div>
                    <Select
                      value={entryTypeId}
                      onChange={setEntryTypeId}
                      placeholder="All Entry Types"
                      style={{ width: "100%" }}
                      allowClear
                      options={
                        Array.isArray(entryTypes)
                          ? entryTypes.map((type) => ({
                              label: type.name,
                              value: type.id,
                            }))
                          : []
                      }
                    />
                  </Col>

                  {isTeamLeaderOrAdmin && (
                    <Col xs={24} sm={12} lg={8}>
                      <div style={{ marginBottom: 8 }}>
                        <strong>Employee</strong>
                      </div>
                      <Select
                        value={employeeId}
                        onChange={setEmployeeId}
                        placeholder="All Employees"
                        style={{ width: "100%" }}
                        allowClear
                        showSearch
                        optionFilterProp="label"
                        options={employees.map((emp) => ({
                          label: `${emp.name} (${emp.email})`,
                          value: emp.id,
                        }))}
                      />
                    </Col>
                  )}

                  {!isTeamLeaderOrAdmin && (
                    <Col xs={24} sm={12} lg={8}>
                      <div style={{ marginBottom: 8 }}>
                        <strong>Employee</strong>
                      </div>
                      <Select
                        value={employeeId}
                        onChange={setEmployeeId}
                        placeholder="All Employees"
                        style={{ width: "100%" }}
                        allowClear
                        showSearch
                        optionFilterProp="label"
                        options={employees.map((emp) => ({
                          label: `${emp.name} (${emp.email})`,
                          value: emp.id,
                        }))}
                      />
                    </Col>
                  )}

                  {isAdmin && (
                    <Col xs={24} sm={12} lg={8}>
                      <div style={{ marginBottom: 8 }}>
                        <strong>Team</strong>
                      </div>
                      <Select
                        value={teamId}
                        onChange={setTeamId}
                        placeholder="All Teams"
                        style={{ width: "100%" }}
                        allowClear
                        options={
                          Array.isArray(teams)
                            ? teams.map((team) => ({
                                label: team.name,
                                value: team.id,
                              }))
                            : []
                        }
                      />
                    </Col>
                  )}

                  <Col xs={24} sm={12} lg={8}>
                    <div style={{ marginBottom: 8 }}>
                      <strong>Evaluation Status</strong>
                    </div>
                    <Select
                      value={evaluationStatus}
                      onChange={setEvaluationStatus}
                      style={{ width: "100%" }}
                      options={[
                        { label: "All Entries", value: "all" },
                        { label: "Evaluated", value: "evaluated" },
                        { label: "Not Evaluated", value: "not_evaluated" },
                      ]}
                    />
                  </Col>
                </Row>

                <Row style={{ marginTop: 16 }}>
                  <Col span={24}>
                    <Space>
                      <Button
                        type="primary"
                        icon={<FilterOutlined />}
                        onClick={handleApplyFilters}
                      >
                        Apply Filters
                      </Button>
                      <Button
                        icon={<ClearOutlined />}
                        onClick={handleClearFilters}
                      >
                        Clear Filters
                      </Button>
                    </Space>
                  </Col>
                </Row>
              </>
            ),
          },
        ]}
      />
    </Card>
  );
}
