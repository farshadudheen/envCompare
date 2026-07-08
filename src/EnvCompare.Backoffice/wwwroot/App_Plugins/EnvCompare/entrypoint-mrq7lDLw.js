import { UMB_AUTH_CONTEXT as t } from "@umbraco-cms/backoffice/auth";
import { c as i } from "./client.gen-Cq1iPozM.js";
const l = async (n, e) => {
  const o = await n.getContext(t);
  if (!o) {
    console.warn("UMB_AUTH_CONTEXT not available — extension API client will not be authenticated");
    return;
  }
  o.configureClient(i), console.log("EnvCompare extension initialized");
}, r = (n, e) => {
  console.log("EnvCompare extension unloaded");
};
export {
  l as onInit,
  r as onUnload
};
//# sourceMappingURL=entrypoint-mrq7lDLw.js.map
