/**
 * Port's plugin iframe may enforce Trusted Types. Mermaid uses innerHTML while
 * rendering; a default policy lets that run without weakening host CSP elsewhere.
 */
export function installTrustedTypesDefaultPolicy(): void {
  const tt = globalThis.trustedTypes;
  if (!tt || tt.defaultPolicy) return;

  const policyNames = ["default", "port-default", "trusted-types-default"];
  for (const name of policyNames) {
    try {
      tt.createPolicy(name, {
        createHTML: (html) => html,
        createScriptURL: (url) => url,
        createScript: (script) => script,
      });
      if (tt.defaultPolicy) return;
    } catch {
      // CSP may restrict policy names; try the next.
    }
  }
}
