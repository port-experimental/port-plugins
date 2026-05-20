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

export type Entity = {
  identifier: string;
  title?: string;
  icon?: string;
  team?: string;
  blueprint?: string;
  createdAt?: string;
  updatedAt?: string;
  properties?: Record<string, unknown>;
  relations?: Record<string, unknown>;
};

export type ParamValue = {
  type?: string;
  value?: unknown;
};

export type Params = Record<string, ParamValue>;

export type RelatedToDirection = "upstream" | "downstream";

export type PluginConfig = {
  techDocBlueprint: string;
  repositoryBlueprint: string;
  /**
   * Direction for Port `relatedTo` when resolving tech docs for the current entity page
   * (`POST /v1/entities/search`).
   */
  relatedToDirection: RelatedToDirection;
};

export type TechDocEntity = {
  identifier: string;
  title: string;
  /** Port catalog entity timestamp; used when `properties.lastUpdated` is empty */
  updatedAt?: string;
  properties: {
    content: string;
    filePath: string;
    folderPath: string;
    url: string;
    lastUpdated?: string;
  } & Record<string, unknown>;
  relations: {
    repository: string;
    service?: string | string[];
  } & Record<string, unknown>;
};

export type SidebarNode = {
  label: string;
  docId?: string;
  children: SidebarNode[];
};

export type RepoGroup = {
  repoName: string;
  nodes: SidebarNode[];
};
