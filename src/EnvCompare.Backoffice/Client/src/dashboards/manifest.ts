import type { ManifestDashboard } from "@umbraco-cms/backoffice/dashboard";

/**
 * EnvCompare dashboard — Settings section, administrators only.
 */
export const manifests: Array<ManifestDashboard> = [
  {
    type: "dashboard",
    alias: "EnvCompare.Dashboard.Compare",
    name: "EnvCompare Dashboard",
    elementName: "envcompare-dashboard",
    element: () => import("./envcompare-dashboard.element.js"),
    weight: 100,
    meta: {
      label: "EnvCompare",
      pathname: "envcompare",
    },
    conditions: [
      {
        alias: "Umb.Condition.SectionAlias",
        match: "Umb.Section.Settings",
      },
      {
        alias: "Umb.Condition.CurrentUser.IsAdmin",
      },
    ],
  },
];
