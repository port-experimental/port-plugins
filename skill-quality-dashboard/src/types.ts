export interface PluginParams {
  blueprint?: { type: string; value?: string };
  dim1_label?: { type: string; value?: string };
  dim1_property?: { type: string; value?: string };
  dim2_label?: { type: string; value?: string };
  dim2_property?: { type: string; value?: string };
  dim3_label?: { type: string; value?: string };
  dim3_property?: { type: string; value?: string };
  dim4_label?: { type: string; value?: string };
  dim4_property?: { type: string; value?: string };
  group_relation?: { type: string; value?: string };
}

export interface PortEntity {
  identifier: string;
  title: string;
  properties: Record<string, unknown>;
  relations: Record<string, unknown>;
}

export interface DimConfig {
  key: string;
  label: string;
  property: string;
}

export interface NormalisedEntity {
  id: string;
  title: string;
  group: string | null;
  dims: Record<string, number>;
  overall: number;
}
