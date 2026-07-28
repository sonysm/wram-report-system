export interface SessionUser {
    id: number;
    username: string;
    role: string;
    provinceId: number | null;
    provinceName: string | null;
    isDemo?: boolean;
}

const TOKEN_STORAGE_KEY = "token";

export function getStoredToken(): string | null {
    if (typeof window === "undefined") {
        return null;
    }

    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string): void {
    if (typeof window === "undefined") {
        return;
    }

    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearStoredToken(): void {
    if (typeof window === "undefined") {
        return;
    }

    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export async function fetchSessionUser(token: string): Promise<SessionUser | null> {
    try {
        const response = await fetch("/api/me", {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
            return null;
        }

        const payload = (await response.json()) as SessionUser;
        if (!payload || typeof payload.role !== "string" || typeof payload.username !== "string") {
            return null;
        }

        return payload;
    } catch {
        return null;
    }
}

export function getRoleHomePath(role: string): string {
    return "/";
}