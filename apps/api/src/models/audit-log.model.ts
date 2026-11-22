import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";

const auditLogSchema = new Schema(
  {
    actorUserId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    action: { type: String, required: true, index: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: String, index: true },
    ipAddress: String,
    userAgent: String,
    metadata: Schema.Types.Mixed,
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });

export type AuditLogDocument = HydratedDocument<
  InferSchemaType<typeof auditLogSchema>
>;
export const AuditLogModel = model("AuditLog", auditLogSchema);
