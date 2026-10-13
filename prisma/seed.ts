import { ensureBillingCatalog } from "../src/modules/billing/catalog.js"
import { ensureAiCatalog } from "../src/modules/catalog/seed.js"
import organizationService from "../src/modules/organizations/service.js"
import prismaClient from "../src/platform/prisma.js"

async function main() {
    await organizationService.ensureRoles()
    await ensureBillingCatalog()
    await ensureAiCatalog()

    const [roles, plans, providers, models] = await Promise.all([
        prismaClient.role.count(),
        prismaClient.plan.count(),
        prismaClient.aIProvider.count(),
        prismaClient.aIModel.count(),
    ])

    console.log(
        `Seeded catalog: ${roles} roles, ${plans} plans, ${providers} providers, ${models} models`,
    )
}

main()
    .catch((err) => {
        console.error(err)
        process.exit(1)
    })
    .finally(async () => {
        await prismaClient.$disconnect()
    })
