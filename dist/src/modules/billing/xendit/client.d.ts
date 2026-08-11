export type XenditSessionResponse = {
    payment_session_id: string;
    components_sdk_key?: string;
    expires_at?: string;
    status?: string;
};
export declare function createXenditSession(body: Record<string, unknown>): Promise<XenditSessionResponse>;
//# sourceMappingURL=client.d.ts.map