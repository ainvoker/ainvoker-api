export type OrgXenditCustomer = {
    xenditCustomerId: string | null
    xenditCustomerReference: string | null
}

export type NestedCustomerPayload = {
    reference_id: string
    type: "INDIVIDUAL"
    email?: string
    individual_detail: {
        given_names: string
        surname: string
    }
}

export function buildNestedCustomer(
    referenceId: string,
    user: { email: string | null; firstName: string | null; lastName: string | null },
): NestedCustomerPayload {
    return {
        reference_id: referenceId,
        type: "INDIVIDUAL",
        ...(user.email ? { email: user.email } : {}),
        individual_detail: {
            given_names: user.firstName ?? "AInvoker",
            surname: user.lastName ?? "User",
        },
    }
}

/** Session customer fields: reuse Xendit customer_id or create once. */
export function sessionCustomerFields(
    org: OrgXenditCustomer,
    nestedCustomer: NestedCustomerPayload,
): { customer_id: string } | { customer: NestedCustomerPayload } {
    if (org.xenditCustomerId) {
        return { customer_id: org.xenditCustomerId }
    }
    return { customer: nestedCustomer }
}
