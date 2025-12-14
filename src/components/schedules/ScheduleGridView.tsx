"use client";

import { useState, useEffect } from "react";
import { Table, Select, Space, DatePicker, Card, theme } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import updateLocale from "dayjs/plugin/updateLocale";
import "dayjs/locale/en";
import { ScheduleDetailModal } from "./ScheduleDetailModal";

dayjs.extend(updateLocale);
dayjs.updateLocale("en", {
  weekStart: 6, // Saturday
});

const { useToken } = theme;

interface ScheduleGridViewProps {
  schedules: any[];
  loading?: boolean;
  teams?: Array<{ id: number; name: string }>;
  userRole?: string;
}

const DAYS = [
  "saturday",
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
];
const DAY_LABELS = [
  "Saturday",
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];

export function ScheduleGridView({
  schedules,
  loading = false,
  teams = [],
  userRole,
}: ScheduleGridViewProps) {
  const { token } = useToken();
  const [selectedTeam, setSelectedTeam] = useState<number | undefined>(
    undefined
  );
  const [selectedWeek, setSelectedWeek] = useState<Dayjs>(dayjs().day(6)); // Default to current week's Saturday
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any | null>(null);
  const [fullSchedules, setFullSchedules] = useState<Record<number, any>>({});
  const [loadingDetails, setLoadingDetails] = useState(false);

  const isAdmin = userRole === "admin";

  // Filter schedules by selected team and week
  const filteredSchedules = schedules.filter((schedule) => {
    const scheduleStart = dayjs(
      schedule.weekStartDate || schedule.week_start_date
    );
    const weekMatch = scheduleStart.isSame(selectedWeek, "day");

    let teamMatch = true;
    if (selectedTeam) {
      teamMatch = (schedule.teamId || schedule.team_id) === selectedTeam;
    }

    return weekMatch && teamMatch;
  });

  // Fetch full schedule details for filtered schedules
  useEffect(() => {
    const fetchFullSchedules = async () => {
      if (filteredSchedules.length === 0) return;

      setLoadingDetails(true);
      try {
        const promises = filteredSchedules.map((schedule) =>
          fetch(`/api/schedules/${schedule.id}`).then((res) => res.json())
        );

        const results = await Promise.all(promises);
        const schedulesMap: Record<number, any> = {};

        results.forEach((result) => {
          if (result.success && result.data) {
            schedulesMap[result.data.id] = result.data;
          }
        });

        setFullSchedules(schedulesMap);
      } catch (error) {
        console.error("Failed to fetch full schedules:", error);
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchFullSchedules();
  }, [filteredSchedules.length, selectedWeek, selectedTeam]);

  // Group schedules by employee
  const employeeSchedules = filteredSchedules.reduce((acc, schedule) => {
    const userId = schedule.userId || schedule.user_id;
    const fullSchedule = fullSchedules[schedule.id];

    if (!acc[userId]) {
      acc[userId] = {
        userId,
        userName: schedule.userName || schedule.user_name,
        userEmail: schedule.userEmail || schedule.user_email,
        schedule: fullSchedule || schedule,
      };
    }
    return acc;
  }, {} as Record<number, any>);

  const dataSource = Object.values(employeeSchedules);

  const handleCellClick = (record: any) => {
    setSelectedSchedule(record.schedule);
    setDetailModalOpen(true);
  };

  // Generate columns
  const columns = [
    {
      title: "Employee Name",
      dataIndex: "userName",
      key: "userName",
      fixed: "left" as const,
      width: 200,
      render: (text: string) => <strong>{text}</strong>,
    },
    ...DAYS.map((day, index) => {
      const date = selectedWeek.add(index, "days");
      return {
        title: (
          <div style={{ textAlign: "center" }}>
            <div>{DAY_LABELS[index]}</div>
            <div
              style={{ fontSize: "12px", fontWeight: "normal", color: "#888" }}
            >
              {date.format("MM-DD")}
            </div>
          </div>
        ),
        key: day,
        width: 130,
        align: "center" as const,
        render: (_: any, record: any) => {
          const scheduleData =
            record.schedule?.scheduleData || record.schedule?.schedule_data;
          const daySchedule = scheduleData?.[day];
          const isWorking = daySchedule?.isWorking || false;

          return (
            <div
              onClick={() => handleCellClick(record)}
              style={{
                cursor: "pointer",
                padding: "8px",
                borderRadius: "4px",
                backgroundColor: isWorking ? "transparent" : token.colorErrorBg,
                color: isWorking ? token.colorText : token.colorError,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isWorking
                  ? token.colorPrimaryBg
                  : token.colorErrorBgHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isWorking
                  ? "transparent"
                  : token.colorErrorBg;
              }}
            >
              {isWorking ? `${daySchedule.start} - ${daySchedule.end}` : "Off"}
            </div>
          );
        },
      };
    }),
  ];

  const disabledDate = (current: Dayjs) => {
    return current.day() !== 6; // Only allow Saturdays
  };

  return (
    <>
      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <DatePicker
            value={selectedWeek}
            onChange={(date) => date && setSelectedWeek(date)}
            disabledDate={disabledDate}
            format="YYYY-MM-DD"
            placeholder="Select week (Saturday)"
            style={{ width: 200 }}
          />

          {isAdmin && teams.length > 0 && (
            <Select
              placeholder="Filter by team"
              style={{ width: 200 }}
              allowClear
              value={selectedTeam}
              onChange={setSelectedTeam}
              options={teams.map((team) => ({
                label: team.name,
                value: team.id,
              }))}
            />
          )}
        </Space>

        <Table
          columns={columns}
          dataSource={dataSource}
          rowKey="userId"
          loading={loading || loadingDetails}
          pagination={false}
          scroll={{ x: 1200 }}
          bordered
          size="small"
        />
      </Card>

      <ScheduleDetailModal
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedSchedule(null);
        }}
        schedule={selectedSchedule}
      />
    </>
  );
}
