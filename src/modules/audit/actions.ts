export const AUDIT_ACTIONS = {
    userCreated: "user.created",
    organizationCreated: "organization.created",
    organizationUpdated: "organization.updated",
    organizationDeleted: "organization.deleted",
    organizationSuspended: "organization.suspended",
    organizationReinstated: "organization.reinstated",
    projectCreated: "project.created",
    projectUpdated: "project.updated",
    projectDeleted: "project.deleted",
    projectDisabled: "project.disabled",
    projectReenabled: "project.reenabled",
    apiKeyRevoked: "api_key.revoked",
    subscriptionGrantPro: "subscription.grant_pro",

    subscriptionExtendPro: "subscription.extend_pro",
    subscriptionCancel: "subscription.cancel",
    businessSettingsUpdated: "business_settings.updated",
    modelUpdated: "model.updated",
} as const

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS]

export const AUDIT_ACTION_VALUES = Object.values(AUDIT_ACTIONS)
