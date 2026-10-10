import { z } from "zod"
import { AppError } from "../../platform/errors.js"
import prismaClient from "../../platform/prisma.js"
import { getActiveSubscriptionWithPlan } from "../billing/limits.js"
import projectsService from "../projects/service.js"
import {
    backfillProjectModelAllows,
    ensureRoutableCatalog,
    hasModelAdapter,
    isModelAllowedOnPlan,
    ROUTABLE_MODEL_TYPES,
} from "./allowlist.js"

const MODEL_MANAGER_ROLES = new Set(["owner", "admin"])

export const toggleProjectModelSchema = z.object({
    enabled: z.boolean(),
})

export const projectModelParamsSchema = z.object({
    projectId: z.string().min(1),
    modelId: z.coerce.number().int().positive(),
})

export type ProjectModelListItem = {
    id: number
    provider: string
    name: string
    slug: string
    type: (typeof ROUTABLE_MODEL_TYPES)[number]
    contextWindow: number
    freeEligible: boolean
    enabled: boolean
    locked: boolean
}

class ProjectModelsService {
    private async getMembershipRole(organizationId: string, userId: string) {
        const membership = await prismaClient.organizationMember.findUnique({
            where: {
                organizationId_userId: { organizationId, userId },
            },
            include: { role: true },
        })
        if (!membership) {
            throw new AppError(403, "FORBIDDEN", "You are not a member of this organization")
        }
        return membership.role.name
    }

    async list(projectId: string, userId: string): Promise<ProjectModelListItem[]> {
        const project = await projectsService.getProjectForMember(projectId, userId)
        await ensureRoutableCatalog()
        await backfillProjectModelAllows(project.id, project.organizationId)

        const subscription = await getActiveSubscriptionWithPlan(project.organizationId)
        const planName = subscription.plan.name

        const models = await prismaClient.aIModel.findMany({
            where: {
                type: { in: ROUTABLE_MODEL_TYPES },
                status: "ACTIVE",
                provider: { status: "ACTIVE" },
            },
            include: {
                provider: { select: { name: true } },
                projectAllows: {
                    where: { projectId: project.id },
                    select: { enabled: true },
                    take: 1,
                },
            },
            orderBy: [{ type: "asc" }, { provider: { name: "asc" } }, { name: "asc" }],
        })

        return models
            .filter((model) => hasModelAdapter(model.type, model.provider.name))
            .map((model) => {
                const locked = !isModelAllowedOnPlan(planName, model.freeEligible)
                const allow = model.projectAllows[0]
                const enabled = locked ? false : Boolean(allow?.enabled)
                return {
                    id: model.id,
                    provider: model.provider.name,
                    name: model.name,
                    slug: `${model.provider.name}/${model.name}`,
                    type: model.type as ProjectModelListItem["type"],
                    contextWindow: model.contextWindow,
                    freeEligible: model.freeEligible,
                    enabled,
                    locked,
                }
            })
    }

    async toggle(
        projectId: string,
        modelId: number,
        userId: string,
        input: z.infer<typeof toggleProjectModelSchema>,
    ): Promise<ProjectModelListItem> {
        const project = await projectsService.getProjectForMember(projectId, userId)
        const roleName = await this.getMembershipRole(project.organizationId, userId)
        if (!MODEL_MANAGER_ROLES.has(roleName)) {
            throw new AppError(
                403,
                "FORBIDDEN",
                "Only organization owners or admins can change project models",
            )
        }

        await ensureRoutableCatalog()

        const model = await prismaClient.aIModel.findUnique({
            where: { id: modelId },
            include: { provider: { select: { name: true, status: true } } },
        })
        if (
            !model ||
            model.status !== "ACTIVE" ||
            model.provider.status !== "ACTIVE" ||
            !hasModelAdapter(model.type, model.provider.name)
        ) {
            throw new AppError(404, "NOT_FOUND", "Model not found")
        }

        const subscription = await getActiveSubscriptionWithPlan(project.organizationId)
        if (!isModelAllowedOnPlan(subscription.plan.name, model.freeEligible)) {
            throw new AppError(
                403,
                "MODEL_NOT_ALLOWED_ON_PLAN",
                `Model "${model.name}" is not available on the Free plan`,
            )
        }

        await prismaClient.projectModelAllow.upsert({
            where: {
                projectId_modelId: {
                    projectId: project.id,
                    modelId: model.id,
                },
            },
            create: {
                projectId: project.id,
                modelId: model.id,
                enabled: input.enabled,
            },
            update: {
                enabled: input.enabled,
            },
        })

        return {
            id: model.id,
            provider: model.provider.name,
            name: model.name,
            slug: `${model.provider.name}/${model.name}`,
            type: model.type as ProjectModelListItem["type"],
            contextWindow: model.contextWindow,
            freeEligible: model.freeEligible,
            enabled: input.enabled,
            locked: false,
        }
    }
}

export default new ProjectModelsService()
