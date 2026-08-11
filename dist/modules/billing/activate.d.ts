export declare function activateProSubscription(input: {
    organizationId: string;
    paymentReference: string;
    paymentTokenId?: string;
    amountPhp: number;
}): Promise<{
    alreadyProcessed: true;
    activated?: never;
} | {
    activated: true;
    alreadyProcessed?: never;
}>;
//# sourceMappingURL=activate.d.ts.map