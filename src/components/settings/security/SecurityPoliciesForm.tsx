/**
 * Security Policies Form Component
 * Form for configuring password and session policies
 */

"use client";

import { useState, useEffect } from "react";
import {
  Form,
  InputNumber,
  Switch,
  Button,
  Card,
  Space,
  message,
  Alert,
} from "antd";
import { SaveOutlined, ReloadOutlined } from "@ant-design/icons";
import { useSecuritySettings, useUpdateSecuritySettings } from "@/lib/hooks";

export function SecurityPoliciesForm() {
  const { settings, isLoading, refresh } = useSecuritySettings();
  const { updateSettings, isUpdating } = useUpdateSecuritySettings();
  const [form] = Form.useForm();
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings into form
  useEffect(() => {
    if (settings) {
      form.setFieldsValue({
        // Password Policy
        minLength: settings.passwordPolicy.minLength,
        requireUppercase: settings.passwordPolicy.requireUppercase,
        requireLowercase: settings.passwordPolicy.requireLowercase,
        requireNumbers: settings.passwordPolicy.requireNumbers,
        requireSpecialChars: settings.passwordPolicy.requireSpecialChars,
        expirationDays: settings.passwordPolicy.expirationDays,
        preventReuse: settings.passwordPolicy.preventReuse,

        // Session Settings
        timeoutMinutes: settings.sessionSettings.timeoutMinutes,
        maxConcurrentSessions: settings.sessionSettings.maxConcurrentSessions,
        requireReauthForSensitive:
          settings.sessionSettings.requireReauthForSensitive,

        // Security
        twoFactorEnabled: settings.twoFactorEnabled,
        maxLoginAttempts: settings.maxLoginAttempts,
        lockoutDurationMinutes: settings.lockoutDurationMinutes,
      });
    }
  }, [settings, form]);

  // Track form changes
  const handleValuesChange = () => {
    setHasChanges(true);
  };

  // Save settings
  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      const result = await updateSettings({
        passwordPolicy: {
          minLength: values.minLength,
          requireUppercase: values.requireUppercase,
          requireLowercase: values.requireLowercase,
          requireNumbers: values.requireNumbers,
          requireSpecialChars: values.requireSpecialChars,
          expirationDays: values.expirationDays,
          preventReuse: values.preventReuse,
        },
        sessionSettings: {
          timeoutMinutes: values.timeoutMinutes,
          maxConcurrentSessions: values.maxConcurrentSessions,
          requireReauthForSensitive: values.requireReauthForSensitive,
        },
        twoFactorEnabled: values.twoFactorEnabled,
        maxLoginAttempts: values.maxLoginAttempts,
        lockoutDurationMinutes: values.lockoutDurationMinutes,
      });

      if (result.success) {
        message.success("Security settings updated successfully");
        setHasChanges(false);
        refresh();
      } else {
        message.error(result.error || "Failed to update settings");
      }
    } catch (error) {
      console.error("Form validation failed:", error);
    }
  };

  // Reset form
  const handleReset = () => {
    form.resetFields();
    setHasChanges(false);
    message.info("Changes discarded");
  };

  if (isLoading) {
    return <div>Loading security settings...</div>;
  }

  return (
    <Form form={form} layout="vertical" onValuesChange={handleValuesChange}>
      {/* Password Policy */}
      <Card title="Password Policy" style={{ marginBottom: 16 }}>
        <Alert
          title="Password requirements for all users"
          description="These settings will apply to new passwords and password changes."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form.Item
          name="minLength"
          label="Minimum Password Length"
          rules={[{ required: true }]}
        >
          <InputNumber min={6} max={128} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          name="requireUppercase"
          label="Require Uppercase Letters"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name="requireLowercase"
          label="Require Lowercase Letters"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name="requireNumbers"
          label="Require Numbers"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name="requireSpecialChars"
          label="Require Special Characters"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name="expirationDays"
          label="Password Expiration (days)"
          help="Set to 0 to disable password expiration"
          rules={[{ required: true }]}
        >
          <InputNumber min={0} max={365} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          name="preventReuse"
          label="Prevent Password Reuse (last N passwords)"
          help="Set to 0 to disable this check"
          rules={[{ required: true }]}
        >
          <InputNumber min={0} max={24} style={{ width: "100%" }} />
        </Form.Item>
      </Card>

      {/* Session Settings */}
      <Card title="Session Settings" style={{ marginBottom: 16 }}>
        <Alert
          title="Control user session behavior"
          description="These settings affect how long users stay logged in and session limits."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form.Item
          name="timeoutMinutes"
          label="Session Timeout (minutes)"
          help="Time of inactivity before user is logged out"
          rules={[{ required: true }]}
        >
          <InputNumber min={5} max={1440} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          name="maxConcurrentSessions"
          label="Maximum Concurrent Sessions"
          help="Maximum number of active sessions per user"
          rules={[{ required: true }]}
        >
          <InputNumber min={1} max={10} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          name="requireReauthForSensitive"
          label="Require Re-authentication for Sensitive Actions"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      </Card>

      {/* Login Security */}
      <Card title="Login Security" style={{ marginBottom: 16 }}>
        <Alert
          title="Protect against brute force attacks"
          description="Configure how the system handles failed login attempts."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form.Item
          name="maxLoginAttempts"
          label="Maximum Failed Login Attempts"
          help="Account will be locked after this many failed attempts"
          rules={[{ required: true }]}
        >
          <InputNumber min={1} max={20} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          name="lockoutDurationMinutes"
          label="Account Lockout Duration (minutes)"
          help="How long an account remains locked after too many failed attempts"
          rules={[{ required: true }]}
        >
          <InputNumber min={1} max={1440} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          name="twoFactorEnabled"
          label="Enable Two-Factor Authentication"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      </Card>

      {/* Action Buttons */}
      <Space style={{ width: "100%", justifyContent: "flex-end" }}>
        <Button onClick={handleReset} disabled={!hasChanges}>
          Cancel
        </Button>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSave}
          loading={isUpdating}
          disabled={!hasChanges}
        >
          Save Settings
        </Button>
        <Button icon={<ReloadOutlined />} onClick={refresh}>
          Refresh
        </Button>
      </Space>
    </Form>
  );
}
