import { useQuery } from "@tanstack/react-query";
import { usePortPluginData } from "@port-labs/plugins-sdk/react";


async function fetchBlueprints(token: string, portApiBaseUrl: string | null) {
    const BLUEPRINTS_URL = `${portApiBaseUrl}/v1/blueprints`;

    const res = await fetch(BLUEPRINTS_URL, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    if (!res.ok) throw new Error(`Blueprints failed: ${res.status}`);
    return res.json();
}

export function useBlueprints() {
    const { portApiBaseUrl, portToken } = usePortPluginData();
    return useQuery({
        queryKey: ['blueprints', portToken],
        queryFn: () => fetchBlueprints(portToken!, portApiBaseUrl),
        enabled: !!portToken,
        refetchInterval: 1000 * 60 * 5,
    });
}
