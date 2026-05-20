export async function portFetch(
    baseUrl: string,
    token: string,
    path: string,
    options: RequestInit = {}
): Promise<Response> {
    const res = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            ...options.headers,
        },
    });
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Port API ${res.status}:\n${body}`);
    }
    return res;
}