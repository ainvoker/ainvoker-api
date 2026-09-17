import { z } from "zod"

export const memberIdParamsSchema = z.object({
    orgId: z.string().min(1),
    memberId: z.string().min(1),
})

export const inviteIdParamsSchema = z.object({
    orgId: z.string().min(1),
    inviteId: z.string().min(1),
})

const emailSchema = z
    .string()
    .trim()
    .email()
    .transform((value) => value.toLowerCase())

export const createInviteSchema = z.object({
    email: emailSchema,
    role: z.enum(["admin", "member"]),
})

export const updateMemberRoleSchema = z.object({
    role: z.enum(["owner", "admin", "member"]),
})

export const transferOwnershipSchema = z.object({
    memberId: z.string().min(1),
})

export const acceptInviteSchema = z.object({
    token: z.string().min(1),
})

export const previewInviteQuerySchema = z.object({
    token: z.string().min(1),
})
