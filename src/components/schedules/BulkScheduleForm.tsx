"use client";

import { useState } from "react";
import {
  Form,
  Select,
  DatePicker,
  Card,
  Button,
  Space,
  Table,
  TimePicker,
  Switch,
  message,
} from "antd";
import dayjs from "dayjs";
import updateLocale from "dayjs/plugin/updateLocale";
import "dayjs/locale/en";

dayjs.extend(updateLocale);
dayjs.updateLocale("en", {
  weekStart: 6, // Saturday
});

interface BulkScheduleFormProps {
  onSubmit: (schedules: any[]) => Promise<void>;
  loading?: boolean;
  users?: Array<{
    id: number;
    fullName: string;
    email: string;
    teamId?: number;
  }>;
  teams?: Array<{ id: number; name: string }>;
}

interface ScheduleRow {
  userId: number;
  userName: string;
  saturday: { start: string; end: string; isWorking: boolean };
  sunday: { start: string; end: string; isWorking: boolean };
  monday: { start: string; end: string; isWorking: boolean };
  tuesday: { start: string; end: string; isWorking: boolean };
  wednesday: { start: string; end: string; isWorking: boolean };
  thursday: { start: string; end: string; isWorking: boolean };
  friday: { start: string; end: string; isWorking: boolean };
}

const DAYS = [
  "saturday",
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
] as const;

export function BulkScheduleForm({
  onSubmit,
  loading = false,
  users = [],
  teams = [],
}: BulkScheduleFormProps) {
  const [form] = Form.useForm();
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [weekStartDate, setWeekStartDate] = useState<dayjs.Dayjs | null>(null);
  const [scheduleData, setScheduleData] = useState<ScheduleRow[]>([]);

  const handleTeamChange = (teamId: number) => {
    setSelectedTeam(teamId);
    const teamMembers = users.filter((u) => u.teamId === teamId);

    // Initialize schedule data for team members
    const initialData: ScheduleRow[] = teamMembers.map((user) => ({
      userId: user.id,
      userName: user.fullName,
      saturday: { start: "09:00", end: "17:00", isWorking: true },
      sunday: { start: "09:00", end: "17:00", isWorking: true },
      monday: { start: "09:00", end: "17:00", isWorking: true },
      tuesday: { start: "09:00", end: "17:00", isWorking: true },
      wednesday: { start: "09:00", end: "17:00", isWorking: true },
      thursday: { start: "09:00", end: "17:00", isWorking: true },
      friday: { start: "00:00", end: "00:00", isWorking: false },
    }));

    setScheduleData(initialData);
  };

  const updateScheduleCell = (
    userId: number,
    day: (typeof DAYS)[number],
    field: "start" | "end" | "isWorking",
    value: any
  ) => {
    setScheduleData((prev) =>
      prev.map((row) => {
        if (row.userId === userId) {
          return {
            ...row,
            [day]: {
              ...row[day],
              [field]: value,
            },
          };
        }
        return row;
      })
    );
  };

  const handleSubmit = async () => {
    if (!weekStartDate) {
      message.error("Please select a week start date");
      return;
    }

    const weekStart = weekStartDate.format("YYYY-MM-DD");
    const weekEnd = weekStartDate.add(6, "days").format("YYYY-MM-DD");

    const schedules = scheduleData.map((row) => {
      const scheduleDataObj: any = {};
      DAYS.forEach((day) => {
        scheduleDataObj[day] = row[day];
      });

      return {
        userId: row.userId,
        weekStartDate: weekStart,
        weekEndDate: weekEnd,
        scheduleData: scheduleDataObj,
      };
    });

    await onSubmit(schedules);

    // Reset form
    setSelectedTeam(null);
    setWeekStartDate(null);
    setScheduleData([]);
    form.resetFields();
  };

  const disabledDate = (current: any) => {
    return current.day() !== 6; // Only Saturdays
  };

  const columns = [
    {
      title: "Team Member",
      dataIndex: "userName",
      key: "userName",
      fixed: "left" as const,
      width: 200,
    },
    ...DAYS.map((day, index) => ({
      title: weekStartDate ? (
        <div style={{ textAlign: "center" }}>
          <div>{day.charAt(0).toUpperCase() + day.slice(1)}</div>
          <div
            style={{ fontSize: "12px", fontWeight: "normal", color: "#888" }}
          >
            {weekStartDate.add(index, "days").format("MMM DD")}
          </div>
        </div>
      ) : (
        day.charAt(0).toUpperCase() + day.slice(1)
      ),
      key: day,
      width: 200,
      render: (_: any, record: ScheduleRow) => (
        <Space orientation="vertical" size="small" style={{ width: "100%" }}>
          <Switch
            size="small"
            checked={record[day].isWorking}
            onChange={(checked) =>
              updateScheduleCell(record.userId, day, "isWorking", checked)
            }
            checkedChildren="Work"
            unCheckedChildren="Off"
          />
          {record[day].isWorking && (
            <Space size="small">
              <TimePicker
                size="small"
                format="HH:mm"
                value={dayjs(record[day].start, "HH:mm")}
                onChange={(time) =>
                  updateScheduleCell(
                    record.userId,
                    day,
                    "start",
                    time?.format("HH:mm") || "09:00"
                  )
                }
                minuteStep={15}
              />
              <TimePicker
                size="small"
                format="HH:mm"
                value={dayjs(record[day].end, "HH:mm")}
                onChange={(time) =>
                  updateScheduleCell(
                    record.userId,
                    day,
                    "end",
                    time?.format("HH:mm") || "17:00"
                  )
                }
                minuteStep={15}
              />
            </Space>
          )}
        </Space>
      ),
    })),
  ];

  return (
    <Form form={form} layout="vertical">
      <Card title="Bulk Schedule Creation" style={{ marginBottom: 16 }}>
        <Space size="large" style={{ width: "100%" }} orientation="vertical">
          <Space size="large">
            <Form.Item
              label="Select Team"
              name="teamId"
              rules={[{ required: true, message: "Please select a team" }]}
              style={{ marginBottom: 0, minWidth: 250 }}
            >
              <Select
                placeholder="Select team"
                onChange={handleTeamChange}
                options={teams.map((team) => ({
                  label: team.name,
                  value: team.id,
                }))}
              />
            </Form.Item>

            <Form.Item
              label="Week Start (Saturday)"
              name="weekStartDate"
              rules={[
                { required: true, message: "Please select week start date" },
              ]}
              style={{ marginBottom: 0, minWidth: 200 }}
            >
              <DatePicker
                disabledDate={disabledDate}
                format="YYYY-MM-DD"
                onChange={setWeekStartDate}
              />
            </Form.Item>
          </Space>

          {scheduleData.length > 0 && (
            <>
              <Table
                columns={columns}
                dataSource={scheduleData}
                rowKey="userId"
                pagination={false}
                scroll={{ x: 1500 }}
                bordered
              />

              <Space>
                <Button
                  type="primary"
                  onClick={handleSubmit}
                  loading={loading}
                  disabled={!weekStartDate}
                >
                  Create {scheduleData.length} Schedule
                  {scheduleData.length > 1 ? "s" : ""}
                </Button>
                <Button
                  onClick={() => {
                    setSelectedTeam(null);
                    setWeekStartDate(null);
                    setScheduleData([]);
                    form.resetFields();
                  }}
                >
                  Reset
                </Button>
              </Space>
            </>
          )}
        </Space>
      </Card>
    </Form>
  );
}
