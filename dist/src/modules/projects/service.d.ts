import type { z } from "zod";
import type { createProjectSchema, updateProjectSchema } from "./schemas.js";
declare class ProjectService {
    private assertOrgMember;
    getProjectForMember(projectId: string, userId: string): Promise<{
        status: import("../../../generated/prisma/enums.js").ProjectStatus;
        name: string;
        environment: import("../../../generated/prisma/enums.js").ProjectEnvironment;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
    }>;
    private serializeProject;
    listProjects(organizationId: string, userId: string): Promise<{
        id: string;
        organizationId: string;
        name: string;
        description: string | null;
        environment: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    createProject(organizationId: string, userId: string, input: z.infer<typeof createProjectSchema>): Promise<{
        id: string;
        organizationId: string;
        name: string;
        description: string | null;
        environment: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getProject(projectId: string, userId: string): Promise<{
        id: string;
        organizationId: string;
        name: string;
        description: string | null;
        environment: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateProject(projectId: string, userId: string, input: z.infer<typeof updateProjectSchema>): Promise<{
        id: string;
        organizationId: string;
        name: string;
        description: string | null;
        environment: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deleteProject(projectId: string, userId: string): Promise<void>;
}
declare const _default: ProjectService;
export default _default;
//# sourceMappingURL=service.d.ts.map