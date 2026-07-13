const a = [
  {
    name: "EnvCompare Entrypoint",
    alias: "EnvCompare.Entrypoint",
    type: "backofficeEntryPoint",
    js: () => import("./entrypoint-DICCKGz1.js")
  }
], e = [
  {
    type: "dashboard",
    alias: "EnvCompare.Dashboard.Compare",
    name: "EnvCompare Dashboard",
    elementName: "envcompare-dashboard",
    element: () => import("./envcompare-dashboard.element-DfoBRgDY.js"),
    weight: 100,
    meta: {
      label: "EnvCompare",
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
], n = [
  ...a,
  ...e
];
export {
  n as manifests
};
//# sourceMappingURL=env-compare.js.map
