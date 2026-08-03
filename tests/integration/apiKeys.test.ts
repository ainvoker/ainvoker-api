import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../src/app.js";
import prismaClient from "../../src/platform/prisma.js";
import { useTestAuthUser } from "../helpers/fixtures.js";

describe("api keys endpoints", () => {
    const authUser = useTestAuthUser();
    let projectId = "";

    beforeEach(async () => {
        const project = await prismaClient.project.create({
            data: {
                organizationId: authUser.auth.organizationId,
                name: `Keys Project ${authUser.auth.userId.slice(-8)}`,
                environment: "DEVELOPMENT",
            },
        });
        projectId = project.id;
    });

    it("returns 401 without Authorization", async () => {
        const res = await request(app.express).get(`/api/v1/projects/${projectId}/api-keys`);
        expect(res.status).toBe(401);
    });

    it("creates, lists, revokes, and deletes an api key", async () => {
        const createRes = await request(app.express)
            .post(`/api/v1/projects/${projectId}/api-keys`)
            .set(authUser.headers())
            .send({ keyName: "Test Key" });

        expect(createRes.status).toBe(201);
        expect(createRes.body.data).toMatchObject({
            projectId,
            keyName: "Test Key",
            status: "ACTIVE",
        });
        expect(createRes.body.data.apiKey).toMatch(/^ain_/);
        expect(createRes.body.data.keyPrefix).toBe(createRes.body.data.apiKey.slice(0, 12));

        const keyId = createRes.body.data.id as string;

        const listRes = await request(app.express)
            .get(`/api/v1/projects/${projectId}/api-keys`)
            .set(authUser.headers());
        expect(listRes.status).toBe(200);
        expect(listRes.body.data.some((k: { id: string }) => k.id === keyId)).toBe(true);
        expect(listRes.body.data[0].apiKey).toBeUndefined();

        const revokeRes = await request(app.express)
            .post(`/api/v1/projects/${projectId}/api-keys/${keyId}/revoke`)
            .set(authUser.headers());
        expect(revokeRes.status).toBe(200);
        expect(revokeRes.body.data.status).toBe("REVOKED");

        const deleteRes = await request(app.express)
            .delete(`/api/v1/projects/${projectId}/api-keys/${keyId}`)
            .set(authUser.headers());
        expect(deleteRes.status).toBe(200);
        expect(deleteRes.body.data).toEqual({ deleted: true });

        const listAfter = await request(app.express)
            .get(`/api/v1/projects/${projectId}/api-keys`)
            .set(authUser.headers());
        expect(listAfter.body.data.some((k: { id: string }) => k.id === keyId)).toBe(false);
    });
});
