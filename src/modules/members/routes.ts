import { Router } from "express"
import type { Request, Response } from "express"
import requireOrgMember from "../../middleware/requireOrgMember.js"
import requireSession from "../../middleware/requireSession.js"
import { BaseRoutes } from "../../platform/BaseRoutes.js"
import http from "../../platform/http.js"
import { orgIdParamsSchema } from "../organizations/schemas.js"
import {
    acceptInviteSchema,
    createInviteSchema,
    inviteIdParamsSchema,
    memberIdParamsSchema,
    previewInviteQuerySchema,
    transferOwnershipSchema,
    updateMemberRoleSchema,
} from "./schemas.js"
import MembersService from "./service.js"

class MembersRoutes extends BaseRoutes {
    readonly router = Router()

    constructor() {
        super()

        this.router.get(
            "/organizations/:orgId/members",
            requireSession,
            requireOrgMember,
            this.bind(this.listMembers),
        )
        this.router.patch(
            "/organizations/:orgId/members/:memberId",
            requireSession,
            requireOrgMember,
            this.bind(this.updateMember),
        )
        this.router.delete(
            "/organizations/:orgId/members/:memberId",
            requireSession,
            requireOrgMember,
            this.bind(this.removeMember),
        )

        this.router.post(
            "/organizations/:orgId/invites",
            requireSession,
            requireOrgMember,
            this.bind(this.createInvite),
        )
        this.router.get(
            "/organizations/:orgId/invites",
            requireSession,
            requireOrgMember,
            this.bind(this.listInvites),
        )
        this.router.delete(
            "/organizations/:orgId/invites/:inviteId",
            requireSession,
            requireOrgMember,
            this.bind(this.revokeInvite),
        )
        this.router.post(
            "/organizations/:orgId/invites/:inviteId/resend",
            requireSession,
            requireOrgMember,
            this.bind(this.resendInvite),
        )

        this.router.post(
            "/organizations/:orgId/transfer-ownership",
            requireSession,
            requireOrgMember,
            this.bind(this.transferOwnership),
        )
        this.router.post(
            "/organizations/:orgId/leave",
            requireSession,
            requireOrgMember,
            this.bind(this.leave),
        )

        this.router.post("/invites/accept", requireSession, this.bind(this.acceptInvite))
        this.router.get("/invites/preview", this.bind(this.previewInvite))
    }

    private async listMembers(req: Request, res: Response) {
        const auth = this.requireAuth(req)
        const { orgId } = orgIdParamsSchema.parse(req.params)
        const data = await MembersService.listMembers(orgId, auth.userId)
        http.ok(res, data)
    }

    private async createInvite(req: Request, res: Response) {
        const auth = this.requireAuth(req)
        const { orgId } = orgIdParamsSchema.parse(req.params)
        const body = createInviteSchema.parse(req.body)
        const membership = req.membership!
        const data = await MembersService.createInvite(
            orgId,
            auth.userId,
            membership.role.name,
            body,
        )
        http.ok(res, data, 201)
    }

    private async listInvites(req: Request, res: Response) {
        const { orgId } = orgIdParamsSchema.parse(req.params)
        const membership = req.membership!
        const data = await MembersService.listInvites(orgId, membership.role.name)
        http.ok(res, data)
    }

    private async revokeInvite(req: Request, res: Response) {
        const { orgId, inviteId } = inviteIdParamsSchema.parse(req.params)
        const membership = req.membership!
        const data = await MembersService.revokeInvite(orgId, inviteId, membership.role.name)
        http.ok(res, data)
    }

    private async resendInvite(req: Request, res: Response) {
        const { orgId, inviteId } = inviteIdParamsSchema.parse(req.params)
        const membership = req.membership!
        const data = await MembersService.resendInvite(orgId, inviteId, membership.role.name)
        http.ok(res, data)
    }

    private async updateMember(req: Request, res: Response) {
        const auth = this.requireAuth(req)
        const { orgId, memberId } = memberIdParamsSchema.parse(req.params)
        const body = updateMemberRoleSchema.parse(req.body)
        const membership = req.membership!
        const data = await MembersService.updateMemberRole(
            orgId,
            memberId,
            auth.userId,
            membership.role.name,
            body,
        )
        http.ok(res, data)
    }

    private async removeMember(req: Request, res: Response) {
        const auth = this.requireAuth(req)
        const { orgId, memberId } = memberIdParamsSchema.parse(req.params)
        const membership = req.membership!
        const data = await MembersService.removeMember(
            orgId,
            memberId,
            auth.userId,
            membership.role.name,
        )
        http.ok(res, data)
    }

    private async transferOwnership(req: Request, res: Response) {
        const auth = this.requireAuth(req)
        const { orgId } = orgIdParamsSchema.parse(req.params)
        const body = transferOwnershipSchema.parse(req.body)
        const membership = req.membership!
        const data = await MembersService.transferOwnership(
            orgId,
            auth.userId,
            membership.role.name,
            body,
        )
        http.ok(res, data)
    }

    private async leave(req: Request, res: Response) {
        const auth = this.requireAuth(req)
        const { orgId } = orgIdParamsSchema.parse(req.params)
        const data = await MembersService.leave(orgId, auth.userId)
        http.ok(res, data)
    }

    private async acceptInvite(req: Request, res: Response) {
        const auth = this.requireAuth(req)
        const body = acceptInviteSchema.parse(req.body)
        const data = await MembersService.acceptInvite(auth.userId, body.token)
        http.ok(res, data)
    }

    private async previewInvite(req: Request, res: Response) {
        const query = previewInviteQuerySchema.parse(req.query)
        const data = await MembersService.previewInvite(query.token)
        http.ok(res, data)
    }
}

export default new MembersRoutes()
