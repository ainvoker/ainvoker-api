import { Prisma } from "../../generated/prisma/client.js";
import { assertModelAllowedForPlan, assertWithinPlanLimits, getActiveSubscriptionWithPlan, } from "../billing/limits.js";
import { AppError } from "../../platform/errors.js";
import prismaClient from "../../platform/prisma.js";
import chatProviderRegistry from "../../providers/index.js";
import { ensureTextCatalog } from "./catalog.js";
import { parseModelSlug } from "./schemas.js";
class TextService {
    async chat(apiKeyContext, body) {
        await ensureTextCatalog();
        const { providerName, modelName } = parseModelSlug(body.model);
        const modelSlug = `${providerName}/${modelName}`;
        const provider = await prismaClient.aIProvider.findUnique({
            where: { name: providerName },
        });
        if (!provider || provider.status !== "ACTIVE") {
            throw new AppError(404, "NOT_FOUND", `Unknown or inactive provider "${providerName}"`);
        }
        const model = await prismaClient.aIModel.findUnique({
            where: {
                providerId_name: {
                    providerId: provider.id,
                    name: modelName,
                },
            },
        });
        if (!model || model.status !== "ACTIVE" || model.type !== "TEXT") {
            throw new AppError(404, "NOT_FOUND", `Unknown or inactive text model "${modelSlug}"`);
        }
        const subscription = await getActiveSubscriptionWithPlan(apiKeyContext.organizationId);
        assertModelAllowedForPlan(subscription.plan, model);
        const quota = await assertWithinPlanLimits(apiKeyContext.organizationId);
        const adapter = chatProviderRegistry.get(providerName);
        const requestPayload = {
            model: modelSlug,
            messages: body.messages,
            ...(body.temperature !== undefined ? { temperature: body.temperature } : {}),
            ...(body.maxTokens !== undefined ? { maxTokens: body.maxTokens } : {}),
        };
        const aiRequest = await prismaClient.aIRequest.create({
            data: {
                projectId: apiKeyContext.projectId,
                apiKeyId: apiKeyContext.apiKeyId,
                modelId: model.id,
                serviceType: "TEXT",
                requestPayload,
                requestStatus: "PENDING",
            },
        });
        const started = Date.now();
        try {
            const result = await adapter.complete({
                model: modelName,
                messages: body.messages,
                baseUrl: provider.baseUrl,
                ...(body.temperature !== undefined ? { temperature: body.temperature } : {}),
                ...(body.maxTokens !== undefined ? { maxTokens: body.maxTokens } : {}),
            });
            const latency = Date.now() - started;
            const usage = result.usage;
            const requestCost = usage != null
                ? new Prisma.Decimal(model.inputPrice)
                    .mul(usage.inputTokens)
                    .div(1_000_000)
                    .add(new Prisma.Decimal(model.outputPrice)
                    .mul(usage.outputTokens)
                    .div(1_000_000))
                : null;
            const responsePayload = {
                message: result.message,
                usage,
                raw: result.raw,
            };
            await prismaClient.aIRequest.update({
                where: { id: aiRequest.id },
                data: {
                    requestStatus: "SUCCESS",
                    responsePayload,
                    inputTokens: usage?.inputTokens ?? null,
                    outputTokens: usage?.outputTokens ?? null,
                    totalTokens: usage?.totalTokens ?? null,
                    latency,
                    requestCost,
                },
            });
            return {
                id: aiRequest.id,
                model: modelSlug,
                message: result.message,
                usage,
                quota,
            };
        }
        catch (err) {
            const latency = Date.now() - started;
            const message = err instanceof Error ? err.message : "Chat request failed";
            const code = err instanceof AppError ? err.code : "INTERNAL_ERROR";
            await prismaClient.aIRequest.update({
                where: { id: aiRequest.id },
                data: {
                    requestStatus: "FAILED",
                    responsePayload: { error: { code, message } },
                    latency,
                },
            });
            throw err;
        }
    }
}
export default new TextService();
//# sourceMappingURL=service.js.map