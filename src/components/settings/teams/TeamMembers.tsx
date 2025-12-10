/**
 * Team Members Component
 *
 * Manage team members - view, add, remove
 */

"use client";

import { useState } from "react";
import {
  Modal,
  Table,
  Button,
  Space,
  Tag,
  Avatar,
  Select,
  message,
  Popconfirm,
  Divider,
} from "antd";
import {
  UserOutlined,
  PlusOutlined,
  DeleteOutlined,
  CrownOutlined,
} from "@ant-design/icons";
import useSWR from "swr";

interface TeamMembersProps {
  open: boolean;
  team: any;
  onClose: () => void;
  onMembersChange?: () => void;
}

export function TeamMembers({
  open,
  team,
  onClose,
  onMembersChange,
}: TeamMembersProps) {
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>();
  const [isAdding, setIsAdding] = useState(false);

  // Fetch team members
  const { data: membersData, mutate: refreshMembers } = useSWR(
    team ? `/api/teams/${team.id}/members` : null,
    (url) => fetch(url).then((res) => res.json())
  );
  const members = membersData?.data || [];

  // Fetch users not in this team
  const { data: availableUsersData } = useSWR(
    team ? `/api/users?withoutTeam=true` : null,
    (url) => fetch(url).then((res) => res.json())
  );
  const availableUsers = availableUsersData?.data || [];

  const handleAddMember = async () => {
    if (!selectedUserId) return;

    setIsAdding(true);
    try {
      const response = await fetch(`/api/teams/${team.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUserId }),
      });

      if (response.ok) {
        message.success("Member added successfully");
        setSelectedUserId(undefined);
        refreshMembers();
        onMembersChange?.();
      } else {
        const error = await response.json();
        message.error(error.error || "Failed to add member");
      }
    } catch (error) {
      message.error("Failed to add member");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    try {
      const response = await fetch(`/api/teams/${team.id}/members/${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        message.success("Member removed successfully");
        refreshMembers();
        onMembersChange?.();
      } else {
        const error = await response.json();
        message.error(error.error || "Failed to remove member");
      }
    } catch (error) {
      message.error("Failed to remove member");
    }
  };

  const columns = [
    {
      title: "Member",
      key: "member",
      render: (_: any, record: any) => (
        <Space>
          <Avatar
            icon={<UserOutlined />}
            style={{ backgroundColor: "#1890ff" }}
          >
            {record.fullName?.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <div>{record.fullName}</div>
            <div style={{ fontSize: "12px", color: "#999" }}>
              {record.email}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: "Role",
      dataIndex: "roleName",
      key: "roleName",
      render: (roleName: string, record: any) => {
        const isLeader = record.id === team.leaderId;
        let color = "default";
        if (roleName === "admin") color = "red";
        else if (roleName === "team_leader") color = "blue";
        else if (roleName === "employee") color = "green";

        return (
          <Space>
            {isLeader && <CrownOutlined style={{ color: "#faad14" }} />}
            <Tag color={color}>{roleName?.replace("_", " ").toUpperCase()}</Tag>
          </Space>
        );
      },
    },
    {
      title: "Action",
      key: "action",
      width: 100,
      render: (_: any, record: any) => {
        const isLeader = record.id === team.leaderId;
        return (
          <Popconfirm
            title="Remove Member"
            description={`Remove ${record.fullName} from this team?`}
            onConfirm={() => handleRemoveMember(record.id)}
            okText="Yes"
            cancelText="No"
            disabled={isLeader}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              size="small"
              disabled={isLeader}
            />
          </Popconfirm>
        );
      },
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <Avatar
            icon={<UserOutlined />}
            style={{ backgroundColor: "#1890ff" }}
          />
          {team?.name} Members
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
    >
      {/* Add Member Section */}
      <Space style={{ width: "100%", marginBottom: 16 }}>
        <Select
          placeholder="Select user to add"
          value={selectedUserId}
          onChange={setSelectedUserId}
          style={{ width: 300 }}
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
          }
        >
          {availableUsers.map((user: any) => (
            <Select.Option key={user.id} value={user.id} label={user.fullName}>
              <Space>
                <span>{user.fullName}</span>
                <span style={{ color: "#999", fontSize: "12px" }}>
                  ({user.email})
                </span>
              </Space>
            </Select.Option>
          ))}
        </Select>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddMember}
          loading={isAdding}
          disabled={!selectedUserId}
        >
          Add Member
        </Button>
      </Space>

      <Divider style={{ margin: "16px 0" }} />

      {/* Members Table */}
      <Table
        columns={columns}
        dataSource={members}
        rowKey="id"
        pagination={false}
        size="small"
      />
    </Modal>
  );
}
