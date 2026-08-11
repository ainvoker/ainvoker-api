import { z } from "zod";
export const themePreferenceSchema = z.enum(["LIGHT", "DARK", "DEVICE"]);
export const profileFieldsSchema = z.object({
    email: z.string().trim().email().max(320).nullable().optional(),
    firstName: z.string().trim().min(1).max(100).nullable().optional(),
    lastName: z.string().trim().min(1).max(100).nullable().optional(),
    profilePicture: z.string().trim().url().max(2000).nullable().optional(),
    themePreference: themePreferenceSchema.optional(),
});
export const updateProfileSchema = profileFieldsSchema.refine((body) => Object.keys(body).length > 0, {
    message: "At least one field is required",
});
/** Optional profile seed on first bootstrap (create User + Personal org). */
export const bootstrapProfileSchema = profileFieldsSchema;
//# sourceMappingURL=schemas.js.map