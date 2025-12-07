/**
 * Entry Type Table Component
 *
 * Displays entry types in a table with actions
 */

"use client";

import { Table, Space, Button, Tooltip, Popconfirm } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

interface EntryType {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
}

interface EntryTypeTableProps {
  entryTypes: EntryType[];
  loading: boolean;
  onEdit: (entryType: EntryType) => void;
  onDelete: (entryTypeId: number) => void;
}

export function EntryTypeTable({
  entryTypes,
  loading,
  onEdit,
  onDelete,
}: EntryTypeTableProps) {
  const columns: ColumnsType<EntryType> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: "14px" }}>
            <FileTextOutlined
              style={{ marginRight: "8px", color: "#1890ff" }}
            />
            {text}
          </div>
          {record.description && (
            <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
              {record.description}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (date) => dayjs(date).format("MMM D, YYYY"),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit entry type">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete entry type"
            description="Are you sure you want to delete this entry type?"
            onConfirm={() => onDelete(record.id)}
            okText="Delete"
            okType="danger"
          >
            <Tooltip title="Delete entry type">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={entryTypes}
      loading={loading}
      rowKey="id"
      pagination={false}
    />
  );
}
