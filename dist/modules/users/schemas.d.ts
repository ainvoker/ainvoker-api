import { z } from "zod";
export declare const themePreferenceSchema: z.ZodEnum<{
    LIGHT: "LIGHT";
    DARK: "DARK";
    DEVICE: "DEVICE";
}>;
export type ThemePreference = z.infer<typeof themePreferenceSchema>;
export declare const profileFieldsSchema: z.ZodObject<{
    email: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    firstName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    lastName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    profilePicture: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    themePreference: z.ZodOptional<z.ZodEnum<{
        LIGHT: "LIGHT";
        DARK: "DARK";
        DEVICE: "DEVICE";
    }>>;
}, z.core.$strip>;
export type ProfileFields = z.infer<typeof profileFieldsSchema>;
export declare const updateProfileSchema: z.ZodObject<{
    email: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    firstName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    lastName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    profilePicture: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    themePreference: z.ZodOptional<z.ZodEnum<{
        LIGHT: "LIGHT";
        DARK: "DARK";
        DEVICE: "DEVICE";
    }>>;
}, z.core.$strip>;
/** Optional profile seed on first bootstrap (create User + Personal org). */
export declare const bootstrapProfileSchema: z.ZodObject<{
    email: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    firstName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    lastName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    profilePicture: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    themePreference: z.ZodOptional<z.ZodEnum<{
        LIGHT: "LIGHT";
        DARK: "DARK";
        DEVICE: "DEVICE";
    }>>;
}, z.core.$strip>;
//# sourceMappingURL=schemas.d.ts.map