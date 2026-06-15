import type { PortEntity } from "../types";

/** Mock blueprint identifier shown when running outside Port's iframe (npm run dev). */
export const MOCK_BLUEPRINT = "skill";

export const MOCK_ENTITIES: PortEntity[] = [
  {
    identifier: "writing-tests",
    title: "Writing Tests",
    properties: {
      spec_compliance_score: 85,
      discoverability_score: 70,
      clarity_score: 90,
      maintainability_score: 60,
    },
    relations: { skill_to_skill_group: "testing" },
  },
  {
    identifier: "adding-auth",
    title: "Adding Auth",
    properties: {
      spec_compliance_score: 40,
      discoverability_score: 30,
      clarity_score: 55,
      maintainability_score: 20,
    },
    relations: { skill_to_skill_group: "security" },
  },
  {
    identifier: "reviewing-code",
    title: "Reviewing Code",
    properties: {
      spec_compliance_score: 75,
      discoverability_score: 80,
      clarity_score: 65,
      maintainability_score: 85,
    },
    relations: { skill_to_skill_group: "code-quality" },
  },
  {
    identifier: "incident-response",
    title: "Incident Response",
    properties: {
      spec_compliance_score: 20,
      discoverability_score: 15,
      clarity_score: 30,
      maintainability_score: 10,
    },
    relations: {},
  },
  {
    identifier: "setting-up-ci",
    title: "Setting Up CI",
    properties: {
      spec_compliance_score: 95,
      discoverability_score: 88,
      clarity_score: 92,
      maintainability_score: 90,
    },
    relations: { skill_to_skill_group: "devops" },
  },
];

export const MOCK_PARAMS = {
  blueprint: { type: "blueprint", value: MOCK_BLUEPRINT },
  dim1_label: { type: "string", value: "Structure" },
  dim1_property: { type: "string", value: "spec_compliance_score" },
  dim2_label: { type: "string", value: "Findability" },
  dim2_property: { type: "string", value: "discoverability_score" },
  dim3_label: { type: "string", value: "Clarity" },
  dim3_property: { type: "string", value: "clarity_score" },
  dim4_label: { type: "string", value: "Maintenance" },
  dim4_property: { type: "string", value: "maintainability_score" },
  group_relation: { type: "string", value: "skill_to_skill_group" },
};
