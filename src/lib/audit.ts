import { prisma } from "./prisma";

export type AuditAction = 
  | "CREATE_PERSON"
  | "UPDATE_PERSON"
  | "DELETE_PERSON"
  | "CREATE_RECORD"
  | "UPDATE_RECORD"
  | "DELETE_RECORD"
  | "UPLOAD_DOCUMENT"
  | "DELETE_DOCUMENT"
  | "RESTORE_DOCUMENT"
  | "APPROVE_REQUEST"
  | "REJECT_REQUEST"
  | "LOGIN"
  | "SET_PORTRAIT";

/**
 * Centered Audit Logging with JSON detail enforcement.
 * Ensures consistent data for intelligence and traceability reports.
 */
export async function recordAudit(
  userId: string,
  action: AuditAction,
  entity: string,
  entityId: string | null,
  message: string,
  extra?: any
) {
  try {
    return await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details: JSON.stringify({
          message,
          timestamp: new Date().toISOString(),
          ...extra
        })
      }
    });
  } catch (error) {
    console.error("Critical Audit Failure:", error);
    // Don't throw, we don't want audit failure to crash the main transaction
    // in a production-ready way, we'd queue this to a bus.
  }
}
