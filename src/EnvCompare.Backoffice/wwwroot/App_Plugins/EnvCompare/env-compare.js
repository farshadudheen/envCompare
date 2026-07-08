const a = [
  {
    name: "EnvCompare Entrypoint",
    alias: "EnvCompare.Entrypoint",
    type: "backofficeEntryPoint",
    js: () => import("./entrypoint-mrq7lDLw.js")
  }
], e = [
  {
    type: "dashboard",
    alias: "EnvCompare.Dashboard.Compare",
    name: "EnvCompare Dashboard",
    elementName: "envcompare-dashboard",
    element: () => import("./envcompare-dashboard.element-BQ4BcX7T.js"),
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
