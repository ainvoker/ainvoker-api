import { Prisma } from "../../../generated/prisma/client.js";
import { AppError } from "../../platform/errors.js";
import { prisma } from "../../platform/prisma.js";
async function assertOrgMember(organizationId, userId) {
    const membership = await prisma.organizationMember.findUnique({
        where: {
            organizationId_userId: { organizationId, userId },
        },
    });
    if (!membership) {
        throw new AppError(403, "FORBIDDEN", "You are not a member of this organization");
    }
    return membership;
}
async function getProjectForMember(projectId, userId) {
    const project = await prisma.project.findUnique({
        where: { id: projectId },
    });
    if (!project) {
        throw new AppError(404, "NOT_FOUND", "Project not found");
    }
    await assertOrgMember(project.organizationId, userId);
    return project;
}
function serializeProject(project) {
    return {
        id: project.id,
        organizationId: project.organizationId,
        name: project.name,
        description: project.description,
        environment: project.environment,
        status: project.status,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
    };
}
export async function listProjects(organizationId, userId) {
    await assertOrgMember(organizationId, userId);
    const projects = await prisma.project.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
    });
    return projects.map(serializeProject);
}
export async function createProject(organizationId, userId, input) {
    await assertOrgMember(organizationId, userId);
    try {
        const project = await prisma.project.create({
            data: {
                organizationId,
                name: input.name,
                description: input.description ?? null,
                environment: input.environment,
            },
        });
        return serializeProject(project);
    }
    catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
            throw new AppError(409, "CONFLICT", "A project with this name already exists in the organization");
        }
        throw err;
    }
}
export async function getProject(projectId, userId) {
    const project = await getProjectForMember(projectId, userId);
    return serializeProject(project);
}
export async function updateProject(projectId, userId, input) {
    await getProjectForMember(projectId, userId);
    try {
        const project = await prisma.project.update({
            where: { id: projectId },
            data: {
                ...(input.name !== undefined ? { name: input.name } : {}),
                ...(input.description !== undefined ? { description: input.description } : {}),
                ...(input.environment !== undefined ? { environment: input.environment } : {}),
                ...(input.status !== undefined ? { status: input.status } : {}),
            },
        });
        return serializeProject(project);
    }
    catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
            throw new AppError(409, "CONFLICT", "A project with this name already exists in the organization");
        }
        throw err;
    }
}
export async function deleteProject(projectId, userId) {
    await getProjectForMember(projectId, userId);
    await prisma.project.delete({ where: { id: projectId } });
}
export { getProjectForMember };
//# sourceMappingURL=service.js.map