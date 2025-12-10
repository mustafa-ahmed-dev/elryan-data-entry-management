/**
 * Rule Set Select Component
 *
 * Dynamic dropdown for selecting evaluation rule sets
 */

"use client";

import { Select, Tag } from "antd";
import { StarFilled } from "@ant-design/icons";
import { useRuleSets } from "@/lib/hooks/useRuleSets";

interface RuleSetSelectProps {
  value?: number;
  onChange?: (value: number) => void;
}

export function RuleSetSelect({ value, onChange }: RuleSetSelectProps) {
  const { ruleSets, isLoading } = useRuleSets();

  return (
    <Select
      value={value}
      onChange={onChange}
      placeholder="Select evaluation rule set"
      loading={isLoading}
      showSearch={{ optionFilterProp: "children" }}
    >
      {ruleSets.map((ruleSet: any) => (
        <Select.Option key={ruleSet.id} value={ruleSet.id}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>
              {ruleSet.name}
              {ruleSet.isActive && (
                <Tag
                  icon={<StarFilled />}
                  color="gold"
                  style={{ marginLeft: "8px" }}
                >
                  Active
                </Tag>
              )}
            </span>
          </div>
        </Select.Option>
      ))}
    </Select>
  );
}
