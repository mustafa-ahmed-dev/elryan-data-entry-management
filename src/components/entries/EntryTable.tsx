"use client";

import { useState } from "react";
import { Table, Tag, Button, Space, Popconfirm, message } from "antd";
import {
  DeleteOutlined,
  EyeOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import dayjs from "dayjs";
import { EntryDetail } from "./EntryDetail";

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

interface EntryTableProps {
  entries: Entry[];
  loading: boolean;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
  onPageChange: (page: number, pageSize: number) => void;
  onDelete?: (id: number) => Promise<void>;
  userRole?: string;
}

export function EntryTable({
  entries,
  loading,
  pagination,
  onPageChange,
  onDelete,
  userRole,
}: EntryTableProps) {
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const isAdmin = userRole === "admin";

  const handleDelete = async (id: number) => {
    if (!onDelete) return;

    try {
      setDeleting(id);
      await onDelete(id);
      message.success("Entry deleted successfully");
    } catch (error: any) {
      message.error(error.message || "Failed to delete entry");
    } finally {
      setDeleting(null);
    }
  };

  const handleRowClick = (entry: Entry) => {
    setSelectedEntry(entry);
    setDetailVisible(true);
  };

  const columns: ColumnsType<Entry> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: "SKU",
      dataIndex: "sku",
      key: "sku",
      ellipsis: true,
      sorter: (a, b) => a.sku.localeCompare(b.sku),
      render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: "Employee",
      dataIndex: "employeeName",
      key: "employeeName",
      ellipsis: true,
      render: (text, record) => (
        <div>
          <div>{text}</div>
          <div style={{ fontSize: "12px", color: "#999" }}>
            {record.employeeEmail}
          </div>
        </div>
      ),
    },
    {
      title: "Entry Type",
      dataIndex: "entryTypeName",
      key: "entryTypeName",
      ellipsis: true,
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "Entry Time",
      dataIndex: "entryTime",
      key: "entryTime",
      width: 180,
      sorter: (a, b) => dayjs(a.entryTime).unix() - dayjs(b.entryTime).unix(),
      render: (text) => dayjs(text).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "Evaluated",
      dataIndex: "hasEvaluation",
      key: "hasEvaluation",
      width: 110,
      render: (hasEvaluation) =>
        hasEvaluation ? (
          <Tag icon={<CheckCircleOutlined />} color="success">
            Yes
          </Tag>
        ) : (
          <Tag color="default">No</Tag>
        ),
      filters: [
        { text: "Evaluated", value: true },
        { text: "Not Evaluated", value: false },
      ],
      onFilter: (value, record) => record.hasEvaluation === value,
    },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleRowClick(record)}
          >
            View
          </Button>
          {isAdmin && onDelete && (
            <Popconfirm
              title="Delete Entry"
              description="Are you sure you want to delete this entry?"
              onConfirm={() => handleDelete(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                loading={deleting === record.id}
              >
                Delete
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const handleTableChange = (paginationConfig: TablePaginationConfig) => {
    const page = paginationConfig.current || 1;
    const pageSize = paginationConfig.pageSize || 10;
    onPageChange(page, pageSize);
  };

  return (
    <>
      <Table
        columns={columns}
        dataSource={entries}
        loading={loading}
        rowKey="id"
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: ["10", "25", "50", "100"],
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} entries`,
        }}
        onChange={handleTableChange}
        scroll={{ x: 1000 }}
        onRow={(record) => ({
          style: { cursor: "pointer" },
          onClick: () => handleRowClick(record),
        })}
      />

      {selectedEntry && (
        <EntryDetail
          entry={selectedEntry}
          visible={detailVisible}
          onClose={() => {
            setDetailVisible(false);
            setSelectedEntry(null);
          }}
        />
      )}
    </>
  );
}
