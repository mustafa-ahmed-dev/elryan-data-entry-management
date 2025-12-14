"use client";

import { useState } from "react";
import { Table, Button, Space, Tag, Modal, Input, Empty } from "antd";
import { CheckOutlined, CloseOutlined, EyeOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { ScheduleDetailModal } from "./ScheduleDetailModal";

interface PendingApprovalsTableProps {
  schedules: any[];
  loading?: boolean;
  onApprove: (id: number) => Promise<void>;
  onReject: (id: number, reason?: string) => Promise<void>;
}

export function PendingApprovalsTable({
  schedules,
  loading = false,
  onApprove,
  onReject,
}: PendingApprovalsTableProps) {
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(
    null
  );
  const [rejectionReason, setRejectionReason] = useState("");
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any | null>(null);

  const handleApprove = async (id: number) => {
    setActionLoading(true);
    try {
      await onApprove(id);
    } catch (error) {
      console.error("Error approving schedule:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectClick = (id: number) => {
    setSelectedScheduleId(id);
    setRejectModalOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedScheduleId) return;

    setActionLoading(true);
    try {
      await onReject(selectedScheduleId, rejectionReason);
      setRejectModalOpen(false);
      setSelectedScheduleId(null);
      setRejectionReason("");
    } catch (error) {
      console.error("Error rejecting schedule:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDetails = (record: any) => {
    setSelectedSchedule(record);
    setDetailModalOpen(true);
  };

  const columns = [
    {
      title: "Employee",
      dataIndex: "userName",
      key: "userName",
      render: (text: string, record: any) => (
        <div>
          <div>
            <strong>{text || record.user_name}</strong>
          </div>
          <div style={{ fontSize: "12px", color: "#888" }}>
            {record.userEmail || record.user_email}
          </div>
        </div>
      ),
    },
    {
      title: "Week Period",
      key: "period",
      render: (_: any, record: any) => {
        const start = dayjs(record.weekStartDate || record.week_start_date);
        const end = dayjs(record.weekEndDate || record.week_end_date);
        return (
          <div>
            <div>{start.format("MMM DD, YYYY")}</div>
            <div style={{ fontSize: "12px", color: "#888" }}>
              to {end.format("MMM DD, YYYY")}
            </div>
          </div>
        );
      },
    },
    {
      title: "Created By",
      dataIndex: "createdByName",
      key: "createdByName",
      render: (text: string, record: any) =>
        text || record.created_by_name || "-",
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string, record: any) =>
        dayjs(date || record.created_at).format("MMM DD, YYYY HH:mm"),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: () => <Tag color="warning">Pending Approval</Tag>,
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            View
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<CheckOutlined />}
            onClick={() => handleApprove(record.id)}
            loading={actionLoading}
          >
            Approve
          </Button>
          <Button
            danger
            size="small"
            icon={<CloseOutlined />}
            onClick={() => handleRejectClick(record.id)}
            loading={actionLoading}
          >
            Reject
          </Button>
        </Space>
      ),
    },
  ];

  if (schedules.length === 0) {
    return (
      <Empty
        description="No pending schedules for approval"
        style={{ padding: "40px" }}
      />
    );
  }

  return (
    <>
      <Table
        columns={columns}
        dataSource={schedules}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} pending schedules`,
        }}
      />

      <Modal
        title="Reject Schedule"
        open={rejectModalOpen}
        onOk={handleRejectConfirm}
        onCancel={() => {
          setRejectModalOpen(false);
          setSelectedScheduleId(null);
          setRejectionReason("");
        }}
        okText="Reject"
        okButtonProps={{ danger: true }}
        confirmLoading={actionLoading}
      >
        <Input.TextArea
          placeholder="Reason for rejection (optional)"
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          rows={4}
          style={{ marginTop: 16 }}
        />
      </Modal>

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
