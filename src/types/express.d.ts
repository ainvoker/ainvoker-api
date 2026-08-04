import type { OrganizationMember, Role } from "../../generated/prisma/client.js"

export type AuthContext = {
    userId: string
}

export type MembershipContext = OrganizationMember & {
    role: Role
}

export type ApiKeyContext = {
    apiKeyId: string
    projectId: string
    organizationId: string
}

declare global {
    namespace Express {
        interface Request {
            auth?: AuthContext
            membership?: MembershipContext
            apiKeyContext?: ApiKeyContext
        }
    }
}

export {}
