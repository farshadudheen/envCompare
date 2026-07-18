const e = [
  {
    name: "CloudLens Entrypoint",
    alias: "EnvCompare.Entrypoint",
    type: "backofficeEntryPoint",
    js: () => import("./entrypoint-DICCKGz1.js")
  }
], n = [
  {
    type: "dashboard",
    alias: "EnvCompare.Dashboard.Compare",
    name: "CloudLens Dashboard",
    elementName: "envcompare-dashboard",
    element: () => import("./envcompare-dashboard.element-CFES_-AX.js"),
    weight: 100,
    meta: {
      label: "CloudLens",
      pathname: "envcompare"
    },
    conditions: [
      {
        alias: "Umb.Condition.SectionAlias",
        match: "Umb.Section.Settings"
      },
      {
        alias: "Umb.Condition.CurrentUser.IsAdmin"
      }
    ]
  }
], a = [
  ...e,
  ...n
];
export {
  a as manifests
};
//# sourceMappingURL=env-compare.js.map
