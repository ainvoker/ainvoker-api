import { z } from "zod";
export declare const profileFieldsSchema: z.ZodObject<{
    firstName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    lastName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    profilePicture: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export type ProfileFields = z.infer<typeof profileFieldsSchema>;
export declare const updateProfileSchema: z.ZodObject<{
    firstName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    lastName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    profilePicture: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
/** Optional profile seed on first bootstrap (create User + Personal org). */
export declare const bootstrapProfileSchema: z.ZodObject<{
    firstName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    lastName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    profilePicture: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
//# sourceMappingURL=schemas.d.ts.map