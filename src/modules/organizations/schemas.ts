import { z } from "zod";

export const orgIdParamsSchema = z.object({
    orgId: z.string().min(1),
});
