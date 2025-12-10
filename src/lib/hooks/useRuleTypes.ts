/**
 * useRuleTypes Hook
 *
 * React hook for managing rule types
 */

import { useState, useEffect } from "react";
import { message } from "antd";

export interface RuleType {
  id: number;
  name: string;
  displayName: string;
  icon?: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export function useRuleTypes(includeInactive = false) {
  const [ruleTypes, setRuleTypes] = useState<RuleType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch rule types
  const fetchRuleTypes = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (includeInactive) {
        params.append("includeInactive", "true");
      }

      const response = await fetch(`/api/rule-types?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setRuleTypes(data.data);
      } else {
        message.error("Failed to load rule types");
      }
    } catch (error) {
      console.error("Error fetching rule types:", error);
      message.error("Failed to load rule types");
    } finally {
      setIsLoading(false);
    }
  };

  // Create rule type
  const createRuleType = async (values: {
    name: string;
    displayName: string;
    icon?: string;
    description?: string;
    sortOrder?: number;
  }) => {
    try {
      setIsCreating(true);
      const response = await fetch("/api/rule-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (data.success) {
        message.success("Rule type created successfully");
        await fetchRuleTypes();
        return data.data;
      } else {
        message.error(data.error || "Failed to create rule type");
        return null;
      }
    } catch (error) {
      console.error("Error creating rule type:", error);
      message.error("Failed to create rule type");
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  // Update rule type
  const updateRuleType = async (
    id: number,
    values: {
      name?: string;
      displayName?: string;
      icon?: string;
      description?: string;
      isActive?: boolean;
      sortOrder?: number;
    }
  ) => {
    try {
      setIsUpdating(true);
      const response = await fetch(`/api/rule-types/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (data.success) {
        message.success("Rule type updated successfully");
        await fetchRuleTypes();
        return data.data;
      } else {
        message.error(data.error || "Failed to update rule type");
        return null;
      }
    } catch (error) {
      console.error("Error updating rule type:", error);
      message.error("Failed to update rule type");
      return null;
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete rule type
  const deleteRuleType = async (id: number) => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/rule-types/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        message.success("Rule type deactivated successfully");
        await fetchRuleTypes();
        return true;
      } else {
        message.error(data.error || "Failed to deactivate rule type");
        return false;
      }
    } catch (error) {
      console.error("Error deleting rule type:", error);
      message.error("Failed to deactivate rule type");
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  // Refresh
  const refresh = () => {
    fetchRuleTypes();
  };

  // Load on mount
  useEffect(() => {
    fetchRuleTypes();
  }, [includeInactive]);

  return {
    ruleTypes,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    createRuleType,
    updateRuleType,
    deleteRuleType,
    refresh,
  };
}
