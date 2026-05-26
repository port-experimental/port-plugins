export const COMMENT_BLUEPRINT = "entityComment";
export const PARENT_COMMENT_RELATION = "parentComment";

export type ThreadStatus = "open" | "resolved";

export type Page = {
  identifier?: string;
  pageFilters?: unknown;
};

export type User = {
  firstName?: string;
  lastName?: string;
  email?: string;
  picture?: string;
};

export type PortEntity = {
  identifier: string;
  title?: string;
  blueprint?: string;
  createdAt?: string;
  updatedAt?: string;
  properties?: Record<string, unknown>;
  relations?: Record<string, string | string[] | null | undefined>;
};

export type Entity = PortEntity;

export type ParamValue = {
  type?: string;
  value?: unknown;
};

export type Params = Record<string, ParamValue>;

export type BlueprintParam = {
  identifier: string;
  title: string;
};

export type PluginConfig = {
  entityCommentBlueprint: BlueprintParam;
};

export type CommentEntity = PortEntity & {
  properties: {
    body?: string;
    author?: string;
    threadStatus?: ThreadStatus;
    mentions?: string[];
  };
};

export type PortUser = {
  identifier: string;
  title?: string;
  properties?: {
    port_role?: string;
    status?: string;
  };
};

export type BlueprintRelation = {
  title?: string;
  target: string;
  required: boolean;
  many: boolean;
};

export type BlueprintSchema = {
  identifier: string;
  title?: string;
  relations?: Record<string, BlueprintRelation>;
};

export type CommentThread = {
  root: CommentEntity;
  replies: CommentEntity[];
  status: ThreadStatus;
};

export type SubjectContext = {
  blueprint: string;
  identifier: string;
  title?: string;
  subjectRelationKey: string;
};
