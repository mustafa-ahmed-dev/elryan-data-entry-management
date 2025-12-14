"use client";

import { Modal, Table, Tag, Space, Descriptions, Card, Spin } from "antd";
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { useState, useEffect } from "react";
import dayjs from "dayjs";

interface ScheduleDetailModalProps {
  open: boolean;
  onClose: () => void;
  schedule: any | null;
}

const DAYS = [
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
];

export function ScheduleDetailModal({
  open,
  onClose,
  schedule,
}: ScheduleDetailModalProps) {
  const [fullSchedule, setFullSchedule] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFullSchedule = async () => {
      if (!schedule?.id) return;

      setLoading(true);
      try {
        const response = await fetch(`/api/schedules/${schedule.id}`);
        if (response.ok) {
          const result = await response.json();
          setFullSchedule(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch full schedule:", error);
      } finally {
        setLoading(false);
      }
    };

    if (open && schedule) {
      fetchFullSchedule();
    }
  }, [open, schedule]);

  if (!schedule) return null;

  const displaySchedule = fullSchedule || schedule;

  const getStatusTag = (status: string) => {
    const config = {
      pending_approval: {
        color: "warning",
        icon: <ClockCircleOutlined />,
        text: "Pending",
      },
      approved: {
        color: "success",
        icon: <CheckCircleOutlined />,
        text: "Approved",
      },
      rejected: {
        color: "error",
        icon: <CloseCircleOutlined />,
        text: "Rejected",
      },
    };
    const { color, icon, text } = config[status as keyof typeof config] || {
      color: "default",
      icon: null,
      text: status,
    };
    return (
      <Tag color={color} icon={icon}>
        {text}
      </Tag>
    );
  };

  const scheduleData =
    displaySchedule.scheduleData || displaySchedule.schedule_data;

  const scheduleTableData = DAYS.map((day, index) => {
    const daySchedule = scheduleData?.[day.key];
    const date = dayjs(
      displaySchedule.weekStartDate || displaySchedule.week_start_date
    ).add(index, "days");

    return {
      key: day.key,
      day: day.label,
      date: date.format("MMM DD, YYYY"),
      isWorking: daySchedule?.isWorking || false,
      start: daySchedule?.start || "-",
      end: daySchedule?.end || "-",
      hours: daySchedule?.isWorking
        ? calculateHours(daySchedule.start, daySchedule.end)
        : 0,
    };
  });

  function calculateHours(start: string, end: string): number {
    const startTime = dayjs(start, "HH:mm");
    const endTime = dayjs(end, "HH:mm");
    return endTime.diff(startTime, "hour", true);
  }

  const totalHours = scheduleTableData.reduce((sum, day) => sum + day.hours, 0);

  const columns = [
    {
      title: "Day",
      dataIndex: "day",
      key: "day",
      width: 120,
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: 150,
    },
    {
      title: "Status",
      dataIndex: "isWorking",
      key: "isWorking",
      width: 100,
      render: (isWorking: boolean) => (
        <Tag color={isWorking ? "success" : "default"}>
          {isWorking ? "Working" : "Off"}
        </Tag>
      ),
    },
    {
      title: "Start Time",
      dataIndex: "start",
      key: "start",
      width: 100,
    },
    {
      title: "End Time",
      dataIndex: "end",
      key: "end",
      width: 100,
    },
    {
      title: "Hours",
      dataIndex: "hours",
      key: "hours",
      width: 80,
      render: (hours: number) => (hours > 0 ? `${hours.toFixed(1)}h` : "-"),
    },
  ];

  return (
    <Modal
      title="Schedule Details"
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
    >
      <Spin spinning={loading}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Card>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Employee">
                {displaySchedule.userName || displaySchedule.user_name}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                {getStatusTag(displaySchedule.status)}
              </Descriptions.Item>
              <Descriptions.Item label="Week Start">
                {dayjs(
                  displaySchedule.weekStartDate ||
                    displaySchedule.week_start_date
                ).format("MMM DD, YYYY")}
              </Descriptions.Item>
              <Descriptions.Item label="Week End">
                {dayjs(
                  displaySchedule.weekEndDate || displaySchedule.week_end_date
                ).format("MMM DD, YYYY")}
              </Descriptions.Item>
              <Descriptions.Item label="Total Hours">
                <strong>{totalHours.toFixed(1)} hours</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Created At">
                {dayjs(
                  displaySchedule.createdAt || displaySchedule.created_at
                ).format("MMM DD, YYYY HH:mm")}
              </Descriptions.Item>
              {(displaySchedule.rejectionReason ||
                displaySchedule.rejection_reason) && (
                <Descriptions.Item label="Rejection Reason" span={2}>
                  <Tag color="error">
                    {displaySchedule.rejectionReason ||
                      displaySchedule.rejection_reason}
                  </Tag>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          <Table
            columns={columns}
            dataSource={scheduleTableData}
            pagination={false}
            bordered
            size="small"
          />
        </Space>
      </Spin>
    </Modal>
  );
}
