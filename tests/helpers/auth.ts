export function authHeader(userId: string): { Authorization: string } {
    return { Authorization: `Bearer ${userId}` };
}
