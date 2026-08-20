import { DEV_MOCK } from "../hooks/usePostMessageData";
import { MOCK_WORKFLOW_TRIGGERS } from "../dev/mockData";

export type SelfServiceWorkflowPickerItem = {
  workflowIdentifier: string;
  triggerIdentifier: string;
  title: string;
  description?: string;
};

type WorkflowNode = {
  identifier?: string;
  title?: string;
  config?: { type?: string };
};

type ApiWorkflow = {
  identifier?: string;
  title?: string;
  description?: string;
  nodes?: WorkflowNode[];
};

const SELF_SERVE_TRIGGER_TYPES = new Set([
  "SELF_SERVE_TRIGGER",
  "SELF_SERVICE_TRIGGER",
]);

function findSelfServeTriggerNode(nodes: WorkflowNode[] | undefined): WorkflowNode | undefined {
  if (!nodes?.length) return undefined;
  return nodes.find((node) =>
    SELF_SERVE_TRIGGER_TYPES.has(node.config?.type ?? "")
  );
}

function mapWorkflow(
  workflowId: string,
  title?: string,
  description?: string,
  nodes?: WorkflowNode[]
): SelfServiceWorkflowPickerItem | null {
  const triggerIdentifier = findSelfServeTriggerNode(nodes)?.identifier;
  if (!triggerIdentifier) return null;

  return {
    workflowIdentifier: workflowId,
    triggerIdentifier,
    title: title ?? workflowId,
    description,
  };
}

async function mapWorkflowFromDetail(
  baseUrl: string,
  token: string,
  workflow: ApiWorkflow
): Promise<SelfServiceWorkflowPickerItem | null> {
  const workflowId = workflow.identifier;
  if (!workflowId) return null;

  const direct = mapWorkflow(
    workflowId,
    workflow.title,
    workflow.description,
    workflow.nodes
  );
  if (direct) return direct;

  const res = await fetch(
    `${baseUrl}/v1/workflows/${encodeURIComponent(workflowId)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) return null;

  const detail = await res.json();
  const detailWorkflow = (detail.workflow ?? detail) as ApiWorkflow;
  return mapWorkflow(
    workflowId,
    workflow.title ?? detailWorkflow.title,
    workflow.description ?? detailWorkflow.description,
    detailWorkflow.nodes
  );
}

export async function fetchSelfServiceWorkflowTriggers(
  baseUrl: string,
  token: string
): Promise<SelfServiceWorkflowPickerItem[]> {
  if (DEV_MOCK) {
    await new Promise((r) => setTimeout(r, 200));
    return MOCK_WORKFLOW_TRIGGERS;
  }

  const res = await fetch(`${baseUrl}/v1/workflows?isDeleted=false`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Port API ${res.status}:\n${body}`);
  }

  const data = await res.json();
  const workflows = Array.isArray(data.workflows)
    ? (data.workflows as ApiWorkflow[])
    : [];

  const results = await Promise.all(
    workflows.map((workflow) => mapWorkflowFromDetail(baseUrl, token, workflow))
  );

  return results.filter(
    (item): item is SelfServiceWorkflowPickerItem => item !== null
  );
}

export function selfServiceFavoriteKey(
  type: "action" | "workflow",
  identifier: string,
  triggerIdentifier?: string
): string {
  if (type === "workflow") {
    return `workflow:${identifier}/${triggerIdentifier ?? ""}`;
  }
  return `action:${identifier}`;
}
