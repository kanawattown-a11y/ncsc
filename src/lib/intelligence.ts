import { Person, SecurityRecord } from "@prisma/client";

export type SecurityStatus = "BANNED" | "CLEARED" | "SUSPICIOUS";
export type RiskLevel = "HIGH" | "MEDIUM" | "LOW" | "NONE";

export interface IntelligenceReport {
  status: SecurityStatus;
  riskLevel: RiskLevel;
  activeCount: number;
  totalCount: number;
  priority: "NORMAL" | "URGENT";
  reasonSummary: string | null;
  mainBranch: string | null;
}

/**
 * Centralized logic for calculating a person's security standing.
 * This is the SOURCE OF TRUTH for all 'BANNED/CLEARED' decisions.
 */
export function analyzeSecurity(person: any): IntelligenceReport {
  const records = (person.records || []) as SecurityRecord[];
  const activeRecords = records.filter(r => r.active && !r.deletedAt);
  
  const activeCount = activeRecords.length;
  const totalCount = records.filter(r => !r.deletedAt).length;

  if (activeCount === 0) {
    return {
      status: "CLEARED",
      riskLevel: "NONE",
      activeCount: 0,
      totalCount,
      priority: "NORMAL",
      reasonSummary: null,
      mainBranch: null,
    };
  }

  // Determine highest severity
  const hasHigh = activeRecords.some(r => r.severity === "HIGH" || r.severity === "عالية");
  const hasMedium = activeRecords.some(r => r.severity === "MEDIUM" || r.severity === "متوسطة");
  
  const riskLevel: RiskLevel = hasHigh ? "HIGH" : (hasMedium ? "MEDIUM" : "LOW");
  const priority = hasHigh ? "URGENT" : "NORMAL";
  
  // Get main reason (last active record)
  const lastActive = activeRecords[0];

  return {
    status: "BANNED",
    riskLevel,
    activeCount,
    totalCount,
    priority,
    reasonSummary: lastActive.reason,
    mainBranch: lastActive.branch,
  };
}
