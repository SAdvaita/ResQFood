import AuditLog from "../models/auditLog.model.js";

/**
 * Create an audit log entry (fire-and-forget, never throws to caller)
 * @param {{ actorId, actorRole, action, entityId, entityType, description, metadata, ipAddress }} data
 */
export const logAudit = async (data) => {
  try {
    await AuditLog.create({
      actorId:    data.actorId    || null,
      actorRole:  data.actorRole  || "system",
      action:     data.action,
      entityId:   data.entityId   || null,
      entityType: data.entityType || null,
      description: data.description || "",
      metadata:   data.metadata   || {},
      ipAddress:  data.ipAddress  || null,
    });
  } catch (err) {
    console.error("[AuditLog] Failed to write:", err.message);
  }
};
