import { z } from "zod";
export const orgIdParamsSchema = z.object({
    orgId: z.string().min(1),
});
//# sourceMappingURL=schemas.js.map