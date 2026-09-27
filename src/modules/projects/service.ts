import { Prisma } from "../../generated/prisma/client.js"
import { AppError } from "../../platform/errors.js"
import prismaClient from "../../platform/prisma.js"
import { assertOrgCanMutateResources } from "../billing/limits.js"
import { listPlanAllowedRoutableModelIds } from "../text/allowlist.js"
import type { z } from "zod"
import type { createProjectSchema, updateProjectSchema } from "./schemas.js"

class ProjectService {
    private async assertOrgMember(organizationId: string, userId: string) {
        const membership = await prismaClient.organizationMember.findUnique({
            where: {
                organizationId_userId: { organizationId, userId },
            },
        })

        if (!membership) {
            throw new AppError(403, "FORBIDDEN", "You are not a member of this organization")
        }

        return membership
    }

    async getProjectForMember(projectId: string, userId: string) {
        const project = await prismaClient.project.findUnique({
            where: { id: projectId },
        })

        if (!project) {
            throw new AppError(404, "NOT_FOUND", "Project not found")
        }

        await this.assertOrgMember(project.organizationId, userId)
        return project
    }

    private serializeProject(project: {
        id: string
        organizationId: string
        name: string
        description: string | null
        environment: string
        status: string
        createdAt: Date
        updatedAt: Date
    }) {
        return {
            id: project.id,
            organizationId: project.organizationId,
            name: project.name,
            description: project.description,
            environment: project.environment,
            status: project.status,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
        }
    }

    async listProjects(organizationId: string, userId: string) {
        await this.assertOrgMember(organizationId, userId)

        const projects = await prismaClient.project.findMany({
            where: { organizationId },
            orderBy: { createdAt: "desc" },
        })

        return projects.map((project) => this.serializeProject(project))
    }

    async createProject(
        organizationId: string,
        userId: string,
        input: z.infer<typeof createProjectSchema>,
    ) {
        await this.assertOrgMember(organizationId, userId)
        await assertOrgCanMutateResources(organizationId)

        try {
            // Resolve catalog + plan outside the write transaction (remote DB latency).
            const modelIds = await listPlanAllowedRoutableModelIds(organizationId)

            const project = await prismaClient.$transaction(async (tx) => {
                const created = await tx.project.create({
                    data: {
                        organizationId,
                        name: input.name,
                        description: input.description ?? null,
                        environment: input.environment,
                    },
                })
                if (modelIds.length > 0) {
                    await tx.projectModelAllow.createMany({
                        data: modelIds.map((modelId) => ({
                            projectId: created.id,
                            modelId,
                            enabled: true,
                        })),
                        skipDuplicates: true,
                    })
                }
                return created
            })
            return this.serializeProject(project)
        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                throw new AppError(
                    409,
                    "CONFLICT",
                    "A project with this name already exists in the organization",
                )
            }
            throw err
        }
    }

    async getProject(projectId: string, userId: string) {
        const project = await this.getProjectForMember(projectId, userId)
        return this.serializeProject(project)
    }

    async updateProject(
        projectId: string,
        userId: string,
        input: z.infer<typeof updateProjectSchema>,
    ) {
        await this.getProjectForMember(projectId, userId)

        try {
            const project = await prismaClient.project.update({
                where: { id: projectId },
                data: {
                    ...(input.name !== undefined ? { name: input.name } : {}),
                    ...(input.description !== undefined ? { description: input.description } : {}),
                    ...(input.environment !== undefined ? { environment: input.environment } : {}),
                    ...(input.status !== undefined ? { status: input.status } : {}),
                },
            })
            return this.serializeProject(project)
        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                throw new AppError(
                    409,
                    "CONFLICT",
                    "A project with this name already exists in the organization",
                )
            }
            throw err
        }
    }

    async deleteProject(projectId: string, userId: string) {
        await this.getProjectForMember(projectId, userId)

        try {
            await prismaClient.$transaction(async (tx) => {
                const actions = await tx.action.findMany({
                    where: { projectId },
                    select: { id: true },
                })
                const actionIds = actions.map((action) => action.id)

                if (actionIds.length > 0) {
                    await tx.actionInvocation.deleteMany({
                        where: { actionId: { in: actionIds } },
                    })
                }

                const requests = await tx.aIRequest.findMany({
                    where: { projectId },
                    select: { id: true },
                })
                const requestIds = requests.map((row) => row.id)

                if (requestIds.length > 0) {
                    await tx.actionInvocation.deleteMany({
                        where: { requestId: { in: requestIds } },
                    })
                    await tx.aIRequest.deleteMany({ where: { projectId } })
                }

                await tx.apiKey.deleteMany({ where: { projectId } })
                await tx.action.deleteMany({ where: { projectId } })
                await tx.usageAnalytics.deleteMany({ where: { projectId } })
                await tx.webhook.deleteMany({ where: { projectId } })
                await tx.projectAllowedOrigin.deleteMany({ where: { projectId } })
                await tx.projectModelAllow.deleteMany({ where: { projectId } })
                await tx.project.delete({ where: { id: projectId } })
            })
        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
                throw new AppError(
                    409,
                    "CONFLICT",
                    "Project cannot be deleted because related records still reference it",
                )
            }
            throw err
        }
    }
}

export default new ProjectService()
