import { describe, expect, it } from "vitest"
import { AppError } from "../../src/platform/errors.js"
import {
    buildNestedCustomer,
    sessionCustomerFields,
} from "../../src/modules/billing/sessionCustomer.js"
import { isDuplicateCustomerReferenceError } from "../../src/modules/billing/xendit/client.js"

const nested = buildNestedCustomer("org_abc", {
    email: "a@example.com",
    firstName: "Ada",
    lastName: "Lovelace",
})

describe("sessionCustomerFields", () => {
    it("sends nested customer on first checkout", () => {
        const fields = sessionCustomerFields(
            { xenditCustomerId: null, xenditCustomerReference: "org_abc" },
            nested,
        )
        expect(fields).toEqual({ customer: nested })
        expect("customer_id" in fields).toBe(false)
    })

    it("reuses customer_id on later checkout", () => {
        const fields = sessionCustomerFields(
            {
                xenditCustomerId: "cust-b98d6f63-d240-44ec-9bd5-aa42954c4f48",
                xenditCustomerReference: "org_abc",
            },
            nested,
        )
        expect(fields).toEqual({
            customer_id: "cust-b98d6f63-d240-44ec-9bd5-aa42954c4f48",
        })
        expect("customer" in fields).toBe(false)
    })

    it("uses customer_id after stuck-org lookup (reference exists, id now known)", () => {
        const fields = sessionCustomerFields(
            {
                xenditCustomerId: "cust-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
                xenditCustomerReference: "org_abc",
            },
            nested,
        )
        expect("customer_id" in fields).toBe(true)
        expect("customer" in fields).toBe(false)
    })
})

describe("isDuplicateCustomerReferenceError", () => {
    it("detects Xendit reused customer reference_id", () => {
        const err = new AppError(
            502,
            "PAYMENT_PROVIDER_ERROR",
            "customer: The reference_id entered has been used before. Please enter a unique reference_id",
        )
        expect(isDuplicateCustomerReferenceError(err)).toBe(true)
    })

    it("ignores unrelated payment errors", () => {
        const err = new AppError(502, "PAYMENT_PROVIDER_ERROR", "amount must be number")
        expect(isDuplicateCustomerReferenceError(err)).toBe(false)
    })
})
