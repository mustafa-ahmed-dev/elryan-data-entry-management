import { useState } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Space,
  message,
  Card,
} from "antd";

const { TextArea } = Input;

interface EvaluationFormProps {
  visible?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  inline?: boolean;
  entryId?: number;
  onCancel?: () => void;
}

interface EvaluationFormValues {
  entryId: number;
  evaluatorName: string;
  score: number;
  status: "approved" | "rejected" | "needs_revision";
  comments?: string;
}

export const EvaluationForm: React.FC<EvaluationFormProps> = ({
  visible = false,
  onClose,
  onSuccess,
  inline = false,
  entryId,
  onCancel,
}) => {
  const [form] = Form.useForm<EvaluationFormValues>();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: EvaluationFormValues) => {
    setLoading(true);
    try {
      const response = await fetch("/api/evaluations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit evaluation");
      }

      message.success("Evaluation submitted successfully");
      form.resetFields();

      if (onSuccess) {
        onSuccess();
      }

      if (onClose && !inline) {
        onClose();
      }
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Failed to submit evaluation"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    if (inline && onCancel) {
      onCancel();
    } else if (onClose) {
      onClose();
    }
  };

  const formContent = (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        entryId: entryId || undefined,
        status: "approved",
      }}
    >
      <Form.Item
        name="entryId"
        label="Entry ID"
        rules={[{ required: true, message: "Please enter the entry ID" }]}
      >
        <InputNumber
          style={{ width: "100%" }}
          placeholder="Enter entry ID"
          min={1}
          disabled={!!entryId}
        />
      </Form.Item>

      <Form.Item
        name="evaluatorName"
        label="Evaluator Name"
        rules={[{ required: true, message: "Please enter your name" }]}
      >
        <Input placeholder="Enter your name" />
      </Form.Item>

      <Form.Item
        name="score"
        label="Score"
        rules={[
          { required: true, message: "Please enter a score" },
          {
            type: "number",
            min: 0,
            max: 100,
            message: "Score must be between 0 and 100",
          },
        ]}
      >
        <InputNumber
          style={{ width: "100%" }}
          placeholder="Enter score (0-100)"
          min={0}
          max={100}
        />
      </Form.Item>

      <Form.Item
        name="status"
        label="Status"
        rules={[{ required: true, message: "Please select a status" }]}
      >
        <Select placeholder="Select status">
          <Select.Option value="approved">Approved</Select.Option>
          <Select.Option value="rejected">Rejected</Select.Option>
          <Select.Option value="needs_revision">Needs Revision</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item name="comments" label="Comments">
        <TextArea
          rows={4}
          placeholder="Enter any additional comments or feedback"
        />
      </Form.Item>

      <Form.Item style={{ marginBottom: 0 }}>
        <Space style={{ width: "100%", justifyContent: "flex-end" }}>
          <Button onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            Submit Evaluation
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );

  // Inline mode - render form directly
  if (inline) {
    return <Card bordered={false}>{formContent}</Card>;
  }

  // Modal mode - render form in modal
  return (
    <Modal
      title="Create Evaluation"
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={600}
      destroyOnHidden
    >
      {formContent}
    </Modal>
  );
};
