/**
 * User Actions Component
 *
 * Quick action buttons for user operations
 */

"use client";

import { Space, Button, Tooltip, Popconfirm } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
  MailOutlined,
} from "@ant-design/icons";

interface UserActionsProps {
  user: any;
  onEdit?: (user: any) => void;
  onDelete?: (userId: number) => void;
  onResetPassword?: (userId: number) => void;
  onSendInvite?: (userId: number) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  size?: "small" | "middle" | "large";
}

export function UserActions({
  user,
  onEdit,
  onDelete,
  onResetPassword,
  onSendInvite,
  canEdit = false,
  canDelete = false,
  size = "small",
}: UserActionsProps) {
  return (
    <Space size="small">
      {/* Edit Button */}
      {canEdit && onEdit && (
        <Tooltip title="Edit user">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => onEdit(user)}
            size={size}
          />
        </Tooltip>
      )}

      {/* Reset Password */}
      {canEdit && onResetPassword && (
        <Popconfirm
          title="Reset Password"
          description={`Send password reset link to ${user.email}?`}
          onConfirm={() => onResetPassword(user.id)}
          okText="Yes"
          cancelText="No"
        >
          <Tooltip title="Reset password">
            <Button type="text" icon={<LockOutlined />} size={size} />
          </Tooltip>
        </Popconfirm>
      )}

      {/* Send Invite */}
      {canEdit && onSendInvite && !user.isActive && (
        <Tooltip title="Resend invite">
          <Button
            type="text"
            icon={<MailOutlined />}
            onClick={() => onSendInvite(user.id)}
            size={size}
          />
        </Tooltip>
      )}

      {/* Delete Button */}
      {canDelete && onDelete && (
        <Popconfirm
          title="Deactivate User"
          description={`Are you sure you want to deactivate ${user.fullName}?`}
          onConfirm={() => onDelete(user.id)}
          okText="Yes"
          cancelText="No"
          okButtonProps={{ danger: true }}
        >
          <Tooltip title="Deactivate user">
            <Button type="text" danger icon={<DeleteOutlined />} size={size} />
          </Tooltip>
        </Popconfirm>
      )}
    </Space>
  );
}
