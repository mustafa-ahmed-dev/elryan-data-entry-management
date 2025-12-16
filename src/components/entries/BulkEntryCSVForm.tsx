/**
 * Bulk Entry CSV Form Component
 *
 * Upload CSV file to create multiple entries for the current user
 * Simple format: entry_type, sku
 */

"use client";

import { useState } from "react";
import {
  Card,
  Upload,
  Button,
  Space,
  Alert,
  Table,
  message,
  Typography,
  Steps,
} from "antd";
import {
  UploadOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import type { UploadProps } from "antd";

const { Title, Text, Paragraph } = Typography;

interface BulkEntryCSVFormProps {
  entryTypes: Array<{ id: number; name: string }>;
  employeeId: number;
  employeeName: string;
  onSubmit: (
    entries: any[]
  ) => Promise<{ success: boolean; message?: string; error?: string }>;
}

interface ParsedEntry {
  entryTypeName: string;
  entryTypeId?: number;
  sku: string;
  error?: string;
}

export function BulkEntryCSVForm({
  entryTypes,
  employeeId,
  employeeName,
  onSubmit,
}: BulkEntryCSVFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [csvData, setCsvData] = useState<ParsedEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Parse CSV file
  const parseCSV = (text: string): ParsedEntry[] => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) {
      message.error("CSV file must contain headers and at least one data row");
      return [];
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const data: ParsedEntry[] = [];

    // Validate required headers
    const requiredHeaders = ["entry_type", "sku"];
    const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));

    if (missingHeaders.length > 0) {
      message.error(`Missing required headers: ${missingHeaders.join(", ")}`);
      return [];
    }

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines

      const values = line.split(",").map((v) => v.trim());
      if (values.length !== headers.length) continue;

      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });

      data.push({
        entryTypeName: row.entry_type || "",
        sku: row.sku || "",
      });
    }

    return data;
  };

  // Validate and map data
  const validateAndMapData = (data: ParsedEntry[]): ParsedEntry[] => {
    const errors: string[] = [];

    const validated = data.map((entry, index) => {
      const rowNum = index + 2; // +2 for header row and 0-based index
      let error = "";

      // Find entry type
      const entryType = entryTypes.find(
        (et) => et.name.toLowerCase() === entry.entryTypeName.toLowerCase()
      );
      if (!entryType) {
        error += `Entry type not found. `;
        errors.push(
          `Row ${rowNum}: Entry type "${entry.entryTypeName}" not found`
        );
      } else {
        entry.entryTypeId = entryType.id;
      }

      // Validate SKU
      if (!entry.sku || entry.sku.length < 2) {
        error += `Invalid SKU. `;
        errors.push(`Row ${rowNum}: SKU must be at least 2 characters`);
      }

      entry.error = error || undefined;
      return entry;
    });

    setValidationErrors(errors);
    return validated;
  };

  // Handle file upload
  const handleFileUpload: UploadProps["beforeUpload"] = (file) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);

      if (parsed.length > 0) {
        const validated = validateAndMapData(parsed);
        setCsvData(validated);
        setCurrentStep(1);
        message.success(`Parsed ${validated.length} entries from CSV`);
      }
    };

    reader.readAsText(file);
    return false; // Prevent auto upload
  };

  // Download sample CSV
  const downloadSampleCSV = () => {
    const sampleData = [
      ["entry_type", "sku"],
      ["Product Entry", "SKU12345"],
      ["Brand Entry", "SKU67890"],
      ["Product Entry", "PROD-ABC-123"],
      ["SKU Update", "ITEM-XYZ-001"],
    ];

    const csv = sampleData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk_entry_sample.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Submit bulk entries
  const handleSubmit = async () => {
    const validEntries = csvData.filter((e) => !e.error);

    if (validEntries.length === 0) {
      message.error("No valid entries to create");
      return;
    }

    setLoading(true);

    const entries = validEntries.map((entry) => ({
      employeeId: employeeId,
      entryTypeId: entry.entryTypeId!,
      sku: entry.sku,
    }));

    const result = await onSubmit(entries);

    setLoading(false);

    if (result.success) {
      message.success(
        result.message || `Successfully created ${entries.length} entries`
      );
      setCurrentStep(2);

      // Reset after 2 seconds
      setTimeout(() => {
        setCsvData([]);
        setValidationErrors([]);
        setCurrentStep(0);
      }, 2000);
    } else {
      message.error(result.error || "Failed to create entries");
    }
  };

  // Table columns
  const columns = [
    {
      title: "Row",
      key: "row",
      width: 80,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: "Entry Type",
      dataIndex: "entryTypeName",
      key: "entryTypeName",
      width: 200,
    },
    {
      title: "SKU",
      dataIndex: "sku",
      key: "sku",
      width: 200,
    },
    {
      title: "Status",
      key: "status",
      width: 250,
      render: (_: any, record: ParsedEntry) =>
        record.error ? (
          <Text type="danger">{record.error}</Text>
        ) : (
          <Text type="success">✓ Valid</Text>
        ),
    },
  ];

  const steps = [
    {
      title: "Upload CSV",
      icon: currentStep === 0 ? <UploadOutlined /> : <CheckCircleOutlined />,
    },
    {
      title: "Validate Data",
      icon:
        currentStep === 1 ? (
          <LoadingOutlined />
        ) : currentStep > 1 ? (
          <CheckCircleOutlined />
        ) : (
          <UploadOutlined />
        ),
    },
    {
      title: "Complete",
      icon: currentStep === 2 ? <CheckCircleOutlined /> : <UploadOutlined />,
    },
  ];

  const validCount = csvData.filter((e) => !e.error).length;
  const errorCount = csvData.filter((e) => e.error).length;

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div>
          <Title level={4}>Bulk Entry Creation via CSV</Title>
          <Paragraph type="secondary">
            Upload a CSV file to create multiple entries at once for{" "}
            <strong>{employeeName}</strong>. All entries will be timestamped
            with the current time.
          </Paragraph>
        </div>

        <Alert
          message={`All entries will be created for: ${employeeName}`}
          description="Entry timestamps will be set to the current time automatically"
          type="info"
          showIcon
        />

        <Steps current={currentStep} items={steps} />

        {currentStep === 0 && (
          <>
            <Alert
              message="CSV Format Requirements"
              description={
                <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                  <li>
                    <strong>Required columns:</strong> entry_type, sku
                  </li>
                  <li>
                    Entry type must match existing entry type name
                    (case-insensitive)
                  </li>
                  <li>SKU must be at least 2 characters</li>
                  <li>
                    All entries will be created under your account with current
                    timestamp
                  </li>
                </ul>
              }
              type="info"
              showIcon
            />

            <Space>
              <Upload
                beforeUpload={handleFileUpload}
                accept=".csv"
                showUploadList={false}
                maxCount={1}
              >
                <Button icon={<UploadOutlined />} size="large" type="primary">
                  Upload CSV File
                </Button>
              </Upload>

              <Button
                icon={<DownloadOutlined />}
                onClick={downloadSampleCSV}
                size="large"
              >
                Download Sample CSV
              </Button>
            </Space>
          </>
        )}

        {currentStep === 1 && csvData.length > 0 && (
          <>
            <Space direction="vertical" style={{ width: "100%" }}>
              {validationErrors.length > 0 && (
                <Alert
                  message="Validation Errors"
                  description={
                    <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                      {validationErrors.slice(0, 10).map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                      {validationErrors.length > 10 && (
                        <li>
                          ...and {validationErrors.length - 10} more errors
                        </li>
                      )}
                    </ul>
                  }
                  type="warning"
                  showIcon
                />
              )}

              <Alert
                message={`Found ${csvData.length} entries: ${validCount} valid, ${errorCount} with errors`}
                type={errorCount === 0 ? "success" : "warning"}
                showIcon
              />

              <Table
                columns={columns}
                dataSource={csvData}
                rowKey={(_, idx) => idx || 0}
                pagination={{ pageSize: 10 }}
                scroll={{ x: 700 }}
                size="small"
                rowClassName={(record) =>
                  record.error ? "ant-table-row-error" : ""
                }
              />

              <Space>
                <Button
                  type="primary"
                  onClick={handleSubmit}
                  loading={loading}
                  disabled={validCount === 0}
                  size="large"
                >
                  Create {validCount} Valid Entries
                </Button>
                <Button
                  onClick={() => {
                    setCsvData([]);
                    setValidationErrors([]);
                    setCurrentStep(0);
                  }}
                  size="large"
                >
                  Cancel
                </Button>
              </Space>
            </Space>
          </>
        )}

        {currentStep === 2 && (
          <Alert
            message="Success!"
            description={`Successfully created ${validCount} entries for ${employeeName}.`}
            type="success"
            showIcon
          />
        )}
      </Space>

      <style jsx global>{`
        .ant-table-row-error {
          background-color: #fff2e8;
        }
      `}</style>
    </Card>
  );
}
