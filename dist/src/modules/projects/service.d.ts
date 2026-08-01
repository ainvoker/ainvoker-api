import type { z } from "zod";
import type { createProjectSchema, updateProjectSchema } from "./schemas.js";
declare function getProjectForMember(projectId: string, userId: string): Promise<{
    environment: import("../../../generated/prisma/enums.js").ProjectEnvironment;
    name: string;
    description: string | null;
    status: import("../../../generated/prisma/enums.js").ProjectStatus;
    id: string;
    organizationId: string;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function listProjects(organizationId: string, userId: string): Promise<{
    id: string;
    organizationId: string;
    name: string;
    description: string | null;
    environment: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}[]>;
export declare function createProject(organizationId: string, userId: string, input: z.infer<typeof createProjectSchema>): Promise<{
    id: string;
    organizationId: string;
    name: string;
    description: string | null;
    environment: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function getProject(projectId: string, userId: string): Promise<{
    id: string;
    organizationId: string;
    name: string;
    description: string | null;
    environment: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function updateProject(projectId: string, userId: string, input: z.infer<typeof updateProjectSchema>): Promise<{
    id: string;
    organizationId: string;
    name: string;
    description: string | null;
    environment: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function deleteProject(projectId: string, userId: string): Promise<void>;
export { getProjectForMember };
//# sourceMappingURL=service.d.ts.map