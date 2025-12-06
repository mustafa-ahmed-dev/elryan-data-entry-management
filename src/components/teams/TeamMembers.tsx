/**
 * Team Members Component
 *
 * Displays and manages team members
 */

"use client";

import { useState } from "react";
import { Table, Tag, Button, Modal, Select, message, Empty, Spin } from "antd";
import {
  UserOutlined,
  UserAddOutlined,
  UserDeleteOutlined,
  MailOutlined,
  CheckCircleOutlined,
  StopOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import useSWR, { mutate } from "swr";
import { ROLE_LABELS } from "@/lib/constants/roles";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface TeamMember {
  id: number;
  fullName: string;
  email: string;
  roleId: number;
  roleName: string;
  roleDisplayName: string;
  isActive: boolean;
  createdAt: Date;
}

interface TeamMembersProps {
  teamId: number;
  showTitle?: boolean;
  canManage?: boolean;
}

export function TeamMembers({
  teamId,
  showTitle = true,
  canManage = false,
}: TeamMembersProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);

  // Fetch team members
  const { data: membersData, isLoading: membersLoading } = useSWR(
    `/api/teams/${teamId}/members`,
    fetcher
  );

  // Fetch available users (not in this team)
  const { data: availableUsersData, isLoading: usersLoading } = useSWR(
    isAddModalOpen ? `/api/users?pageSize=100` : null,
    fetcher
  );

  const members = membersData?.data || [];
  const allUsers = availableUsersData?.data || [];

  // Filter users not already in this team
  const availableUsers = allUsers.filter(
    (user: any) => !members.find((m: TeamMember) => m.id === user.id)
  );

  // Handle assign users to team
  const handleAssignUsers = async () => {
    if (selectedUsers.length === 0) {
      message.warning("Please select at least one user");
      return;
    }

    try {
      setIsAssigning(true);
      const response = await fetch(`/api/teams/${teamId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: selectedUsers }),
      });

      const result = await response.json();

      if (response.ok) {
        message.success(`${selectedUsers.length} user(s) assigned to team`);
        setIsAddModalOpen(false);
        setSelectedUsers([]);
        // Refresh members list
        mutate(`/api/teams/${teamId}/members`);
      } else {
        message.error(result.error || "Failed to assign users");
      }
    } catch (error) {
      message.error("Failed to assign users");
    } finally {
      setIsAssigning(false);
    }
  };

  // Handle remove user from team
  const handleRemoveUser = async (userId: number) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/members/${userId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (response.ok) {
        message.success("User removed from team");
        mutate(`/api/teams/${teamId}/members`);
      } else {
        message.error(result.error || "Failed to remove user");
      }
    } catch (error) {
      message.error("Failed to remove user");
    }
  };

  const columns: ColumnsType<TeamMember> = [
    {
      title: "Member",
      dataIndex: "fullName",
      key: "fullName",
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>
            <UserOutlined style={{ marginRight: "8px", color: "#1890ff" }} />
            {text}
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            <MailOutlined style={{ marginRight: "4px" }} />
            {record.email}
          </div>
        </div>
      ),
    },
    {
      title: "Role",
      dataIndex: "roleDisplayName",
      key: "role",
      width: 150,
      render: (text, record) => {
        const colors: Record<string, string> = {
          admin: "red",
          team_leader: "blue",
          employee: "green",
        };
        return <Tag color={colors[record.roleName] || "default"}>{text}</Tag>;
      },
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "status",
      width: 100,
      render: (isActive) => (
        <Tag
          icon={isActive ? <CheckCircleOutlined /> : <StopOutlined />}
          color={isActive ? "success" : "error"}
        >
          {isActive ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    ...(canManage
      ? [
          {
            title: "Actions",
            key: "actions",
            width: 120,
            render: (_: any, record: TeamMember) => (
              <Button
                type="text"
                danger
                size="small"
                icon={<UserDeleteOutlined />}
                onClick={() => {
                  Modal.confirm({
                    title: "Remove member from team?",
                    content: `Are you sure you want to remove ${record.fullName} from this team?`,
                    onOk: () => handleRemoveUser(record.id),
                  });
                }}
              >
                Remove
              </Button>
            ),
          },
        ]
      : []),
  ];

  if (membersLoading) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      {showTitle && (
        <div
          style={{
            marginBottom: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3>Team Members ({members.length})</h3>
          {canManage && (
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={() => setIsAddModalOpen(true)}
            >
              Add Members
            </Button>
          )}
        </div>
      )}

      {members.length === 0 ? (
        <Empty
          description="No members in this team yet"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          {canManage && (
            <Button type="primary" onClick={() => setIsAddModalOpen(true)}>
              Add Members
            </Button>
          )}
        </Empty>
      ) : (
        <Table
          columns={columns}
          dataSource={members}
          rowKey="id"
          pagination={false}
          size="middle"
        />
      )}

      {/* Add Members Modal */}
      <Modal
        title="Add Members to Team"
        open={isAddModalOpen}
        onOk={handleAssignUsers}
        onCancel={() => {
          setIsAddModalOpen(false);
          setSelectedUsers([]);
        }}
        confirmLoading={isAssigning}
        width={600}
      >
        <div style={{ marginBottom: "16px" }}>
          <p>Select users to add to this team:</p>
          <Select
            mode="multiple"
            style={{ width: "100%" }}
            placeholder="Select users"
            value={selectedUsers}
            onChange={setSelectedUsers}
            loading={usersLoading}
            options={availableUsers.map((user: any) => ({
              label: `${user.fullName} (${user.email}) - ${
                ROLE_LABELS[user.roleName]
              }`,
              value: user.id,
            }))}
            showSearch={{
              filterOption: (input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase()),
            }}
          />
        </div>
        {availableUsers.length === 0 && !usersLoading && (
          <Empty description="All users are already in this team" />
        )}
      </Modal>
    </div>
  );
}
