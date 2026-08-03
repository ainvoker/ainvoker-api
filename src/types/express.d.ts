import type { OrganizationMember, Role } from "../../generated/prisma/client.js"

export type AuthContext = {
    userId: string
}

export type MembershipContext = OrganizationMember & {
    role: Role
}

declare global {
    namespace Express {
        interface Request {
            auth?: AuthContext
            membership?: MembershipContext
        }
    }
}

export {}
