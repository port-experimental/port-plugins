function messageFromError(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === "string") return error;
    try {
        return JSON.stringify(error);
    } catch {
        return "Unknown error";
    }
}

export function ErrorDocView({ error }: { error: unknown }) {
    const message = messageFromError(error);

    return (
        <div className="docs-fetch-state docs-fetch-state--error" role="alert">
            <div className="docs-fetch-card docs-fetch-card--error">
                <div className="docs-fetch-error-icon-wrap" aria-hidden>
                    <svg
                        className="docs-fetch-error-icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" x2="12" y1="8" y2="12" />
                        <line x1="12" x2="12.01" y1="16" y2="16" />
                    </svg>
                </div>
                <h1 className="docs-fetch-title">Couldn't load documentation</h1>
                <pre className="docs-fetch-error-detail">{message}</pre>
            </div>
        </div>
    );
}
