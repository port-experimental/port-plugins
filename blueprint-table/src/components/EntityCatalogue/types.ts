export interface BlueprintProperty {
  title?: string;
  type?: string;
}

export interface Blueprint {
  identifier: string;
  title: string;
  icon?: string;
  schema?: { properties?: Record<string, BlueprintProperty> };
  relations?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

/** One column in the entity table */
export interface Column {
  key: string;     // 'identifier' | 'title' | 'blueprint' | 'updatedAt' | 'createdAt' | property key
  label: string;   // display name from schema or fallback to key
  type: string;    // 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date'
  fixed?: boolean; // always visible — excluded from the column picker
  source?: 'property' | 'relation' | 'builtin'; // where to read the value from on the entity
}

/** One entry in the tab bar */
export interface Tab {
  id: string;    // 'all' or a blueprint identifier
  label: string;
  icon?: string;
  count: number;
}
