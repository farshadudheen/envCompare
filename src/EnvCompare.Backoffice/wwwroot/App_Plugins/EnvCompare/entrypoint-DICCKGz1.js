import { UMB_AUTH_CONTEXT as F } from "@umbraco-cms/backoffice/auth";
import { umbHttpClient as M } from "@umbraco-cms/backoffice/http-client";
const G = {
  bodySerializer: (t) => JSON.stringify(
    t,
    (e, r) => typeof r == "bigint" ? r.toString() : r
  )
}, Q = ({
  onRequest: t,
  onSseError: e,
  onSseEvent: r,
  responseTransformer: o,
  responseValidator: a,
  sseDefaultRetryDelay: l,
  sseMaxRetryAttempts: c,
  sseMaxRetryDelay: n,
  sseSleepFn: i,
  url: u,
  ...s
}) => {
  let d;
  const j = i ?? ((f) => new Promise((y) => setTimeout(y, f)));
  return { stream: async function* () {
    let f = l ?? 3e3, y = 0;
    const S = s.signal ?? new AbortController().signal;
    for (; !S.aborted; ) {
      y++;
      const C = s.headers instanceof Headers ? s.headers : new Headers(s.headers);
      d !== void 0 && C.set("Last-Event-ID", d);
      try {
        const x = {
          redirect: "follow",
          ...s,
          body: s.serializedBody,
          headers: C,
          signal: S
        };
        let m = new Request(u, x);
        t && (m = await t(u, x));
        const p = await (s.fetch ?? globalThis.fetch)(m);
        if (!p.ok)
          throw new Error(
            `SSE failed: ${p.status} ${p.statusText}`
          );
        if (!p.body) throw new Error("No body in SSE response");
        const g = p.body.pipeThrough(new TextDecoderStream()).getReader();
        let O = "";
        const $ = () => {
          try {
            g.cancel();
          } catch {
          }
        };
        S.addEventListener("abort", $);
        try {
          for (; ; ) {
            const { done: _, value: V } = await g.read();
            if (_) break;
            O += V;
            const k = O.split(`

`);
            O = k.pop() ?? "";
            for (const L of k) {
              const J = L.split(`
`), T = [];
              let I;
              for (const b of J)
                if (b.startsWith("data:"))
                  T.push(b.replace(/^data:\s*/, ""));
                else if (b.startsWith("event:"))
                  I = b.replace(/^event:\s*/, "");
                else if (b.startsWith("id:"))
                  d = b.replace(/^id:\s*/, "");
                else if (b.startsWith("retry:")) {
                  const U = Number.parseInt(
                    b.replace(/^retry:\s*/, ""),
                    10
                  );
                  Number.isNaN(U) || (f = U);
                }
              let E, B = !1;
              if (T.length) {
                const b = T.join(`
`);
                try {
                  E = JSON.parse(b), B = !0;
                } catch {
                  E = b;
                }
              }
              B && (a && await a(E), o && (E = await o(E))), r?.({
                data: E,
                event: I,
                id: d,
                retry: f
              }), T.length && (yield E);
            }
          }
        } finally {
          S.removeEventListener("abort", $), g.releaseLock();
        }
        break;
      } catch (x) {
        if (e?.(x), c !== void 0 && y >= c)
          break;
        const m = Math.min(
          f * 2 ** (y - 1),
          n ?? 3e4
        );
        await j(m);
      }
    }
  }() };
}, X = (t) => {
  switch (t) {
    case "label":
      return ".";
    case "matrix":
      return ";";
    case "simple":
      return ",";
    default:
      return "&";
  }
}, K = (t) => {
  switch (t) {
    case "form":
      return ",";
    case "pipeDelimited":
      return "|";
    case "spaceDelimited":
      return "%20";
    default:
      return ",";
  }
}, Y = (t) => {
  switch (t) {
    case "label":
      return ".";
    case "matrix":
      return ";";
    case "simple":
      return ",";
    default:
      return "&";
  }
}, P = ({
  allowReserved: t,
  explode: e,
  name: r,
  style: o,
  value: a
}) => {
  if (!e) {
    const n = (t ? a : a.map((i) => encodeURIComponent(i))).join(K(o));
    switch (o) {
      case "label":
        return `.${n}`;
      case "matrix":
        return `;${r}=${n}`;
      case "simple":
        return n;
      default:
        return `${r}=${n}`;
    }
  }
  const l = X(o), c = a.map((n) => o === "label" || o === "simple" ? t ? n : encodeURIComponent(n) : A({
    allowReserved: t,
    name: r,
    value: n
  })).join(l);
  return o === "label" || o === "matrix" ? l + c : c;
}, A = ({
  allowReserved: t,
  name: e,
  value: r
}) => {
  if (r == null)
    return "";
  if (typeof r == "object")
    throw new Error(
      "Deeply-nested arrays/objects aren’t supported. Provide your own `querySerializer()` to handle these."
    );
  return `${e}=${t ? r : encodeURIComponent(r)}`;
}, D = ({
  allowReserved: t,
  explode: e,
  name: r,
  style: o,
  value: a,
  valueOnly: l
}) => {
  if (a instanceof Date)
    return l ? a.toISOString() : `${r}=${a.toISOString()}`;
  if (o !== "deepObject" && !e) {
    let i = [];
    Object.entries(a).forEach(([s, d]) => {
      i = [
        ...i,
        s,
        t ? d : encodeURIComponent(d)
      ];
    });
    const u = i.join(",");
    switch (o) {
      case "form":
        return `${r}=${u}`;
      case "label":
        return `.${u}`;
      case "matrix":
        return `;${r}=${u}`;
      default:
        return u;
    }
  }
  const c = Y(o), n = Object.entries(a).map(
    ([i, u]) => A({
      allowReserved: t,
      name: o === "deepObject" ? `${r}[${i}]` : i,
      value: u
    })
  ).join(c);
  return o === "label" || o === "matrix" ? c + n : n;
}, Z = /\{[^{}]+\}/g, ee = ({ path: t, url: e }) => {
  let r = e;
  const o = e.match(Z);
  if (o)
    for (const a of o) {
      let l = !1, c = a.substring(1, a.length - 1), n = "simple";
      c.endsWith("*") && (l = !0, c = c.substring(0, c.length - 1)), c.startsWith(".") ? (c = c.substring(1), n = "label") : c.startsWith(";") && (c = c.substring(1), n = "matrix");
      const i = t[c];
      if (i == null)
        continue;
      if (Array.isArray(i)) {
        r = r.replace(
          a,
          P({ explode: l, name: c, style: n, value: i })
        );
        continue;
      }
      if (typeof i == "object") {
        r = r.replace(
          a,
          D({
            explode: l,
            name: c,
            style: n,
            value: i,
            valueOnly: !0
          })
        );
        continue;
      }
      if (n === "matrix") {
        r = r.replace(
          a,
          `;${A({
            name: c,
            value: i
          })}`
        );
        continue;
      }
      const u = encodeURIComponent(
        n === "label" ? `.${i}` : i
      );
      r = r.replace(a, u);
    }
  return r;
}, te = ({
  baseUrl: t,
  path: e,
  query: r,
  querySerializer: o,
  url: a
}) => {
  const l = a.startsWith("/") ? a : `/${a}`;
  let c = (t ?? "") + l;
  e && (c = ee({ path: e, url: c }));
  let n = r ? o(r) : "";
  return n.startsWith("?") && (n = n.substring(1)), n && (c += `?${n}`), c;
};
function re(t) {
  const e = t.body !== void 0;
  if (e && t.bodySerializer)
    return "serializedBody" in t ? t.serializedBody !== void 0 && t.serializedBody !== "" ? t.serializedBody : null : t.body !== "" ? t.body : null;
  if (e)
    return t.body;
}
const se = async (t, e) => {
  const r = typeof e == "function" ? await e(t) : e;
  if (r)
    return t.scheme === "bearer" ? `Bearer ${r}` : t.scheme === "basic" ? `Basic ${btoa(r)}` : r;
}, H = ({
  allowReserved: t,
  array: e,
  object: r
} = {}) => (a) => {
  const l = [];
  if (a && typeof a == "object")
    for (const c in a) {
      const n = a[c];
      if (n != null)
        if (Array.isArray(n)) {
          const i = P({
            allowReserved: t,
            explode: !0,
            name: c,
            style: "form",
            value: n,
            ...e
          });
          i && l.push(i);
        } else if (typeof n == "object") {
          const i = D({
            allowReserved: t,
            explode: !0,
            name: c,
            style: "deepObject",
            value: n,
            ...r
          });
          i && l.push(i);
        } else {
          const i = A({
            allowReserved: t,
            name: c,
            value: n
          });
          i && l.push(i);
        }
    }
  return l.join("&");
}, ne = (t) => {
  if (!t)
    return "stream";
  const e = t.split(";")[0]?.trim();
  if (e) {
    if (e.startsWith("application/json") || e.endsWith("+json"))
      return "json";
    if (e === "multipart/form-data")
      return "formData";
    if (["application/", "audio/", "image/", "video/"].some(
      (r) => e.startsWith(r)
    ))
      return "blob";
    if (e.startsWith("text/"))
      return "text";
  }
}, ae = (t, e) => e ? !!(t.headers.has(e) || t.query?.[e] || t.headers.get("Cookie")?.includes(`${e}=`)) : !1, ie = async ({
  security: t,
  ...e
}) => {
  for (const r of t) {
    if (ae(e, r.name))
      continue;
    const o = await se(r, e.auth);
    if (!o)
      continue;
    const a = r.name ?? "Authorization";
    switch (r.in) {
      case "query":
        e.query || (e.query = {}), e.query[a] = o;
        break;
      case "cookie":
        e.headers.append("Cookie", `${a}=${o}`);
        break;
      default:
        e.headers.set(a, o);
        break;
    }
  }
}, v = (t) => te({
  baseUrl: t.baseUrl,
  path: t.path,
  query: t.query,
  querySerializer: typeof t.querySerializer == "function" ? t.querySerializer : H(t.querySerializer),
  url: t.url
}), N = (t, e) => {
  const r = { ...t, ...e };
  return r.baseUrl?.endsWith("/") && (r.baseUrl = r.baseUrl.substring(0, r.baseUrl.length - 1)), r.headers = W(t.headers, e.headers), r;
}, oe = (t) => {
  const e = [];
  return t.forEach((r, o) => {
    e.push([o, r]);
  }), e;
}, W = (...t) => {
  const e = new Headers();
  for (const r of t) {
    if (!r)
      continue;
    const o = r instanceof Headers ? oe(r) : Object.entries(r);
    for (const [a, l] of o)
      if (l === null)
        e.delete(a);
      else if (Array.isArray(l))
        for (const c of l)
          e.append(a, c);
      else l !== void 0 && e.set(
        a,
        typeof l == "object" ? JSON.stringify(l) : l
      );
  }
  return e;
};
class q {
  constructor() {
    this.fns = [];
  }
  clear() {
    this.fns = [];
  }
  eject(e) {
    const r = this.getInterceptorIndex(e);
    this.fns[r] && (this.fns[r] = null);
  }
  exists(e) {
    const r = this.getInterceptorIndex(e);
    return !!this.fns[r];
  }
  getInterceptorIndex(e) {
    return typeof e == "number" ? this.fns[e] ? e : -1 : this.fns.indexOf(e);
  }
  update(e, r) {
    const o = this.getInterceptorIndex(e);
    return this.fns[o] ? (this.fns[o] = r, e) : !1;
  }
  use(e) {
    return this.fns.push(e), this.fns.length - 1;
  }
}
const ce = () => ({
  error: new q(),
  request: new q(),
  response: new q()
}), le = H({
  allowReserved: !1,
  array: {
    explode: !0,
    style: "form"
  },
  object: {
    explode: !0,
    style: "deepObject"
  }
}), fe = {
  "Content-Type": "application/json"
}, R = (t = {}) => ({
  ...G,
  headers: fe,
  parseAs: "auto",
  querySerializer: le,
  ...t
}), ue = (t = {}) => {
  let e = N(R(), t);
  const r = () => ({ ...e }), o = (u) => (e = N(e, u), r()), a = ce(), l = async (u) => {
    const s = {
      ...e,
      ...u,
      fetch: u.fetch ?? e.fetch ?? globalThis.fetch,
      headers: W(e.headers, u.headers),
      serializedBody: void 0
    };
    s.security && await ie({
      ...s,
      security: s.security
    }), s.requestValidator && await s.requestValidator(s), s.body !== void 0 && s.bodySerializer && (s.serializedBody = s.bodySerializer(s.body)), (s.body === void 0 || s.serializedBody === "") && s.headers.delete("Content-Type");
    const d = v(s);
    return { opts: s, url: d };
  }, c = async (u) => {
    const { opts: s, url: d } = await l(u), j = {
      redirect: "follow",
      ...s,
      body: re(s)
    };
    let w = new Request(d, j);
    for (const h of a.request.fns)
      h && (w = await h(w, s));
    const z = s.fetch;
    let f = await z(w);
    for (const h of a.response.fns)
      h && (f = await h(f, w, s));
    const y = {
      request: w,
      response: f
    };
    if (f.ok) {
      const h = (s.parseAs === "auto" ? ne(f.headers.get("Content-Type")) : s.parseAs) ?? "json";
      if (f.status === 204 || f.headers.get("Content-Length") === "0") {
        let g;
        switch (h) {
          case "arrayBuffer":
          case "blob":
          case "text":
            g = await f[h]();
            break;
          case "formData":
            g = new FormData();
            break;
          case "stream":
            g = f.body;
            break;
          default:
            g = {};
            break;
        }
        return s.responseStyle === "data" ? g : {
          data: g,
          ...y
        };
      }
      let p;
      switch (h) {
        case "arrayBuffer":
        case "blob":
        case "formData":
        case "json":
        case "text":
          p = await f[h]();
          break;
        case "stream":
          return s.responseStyle === "data" ? f.body : {
            data: f.body,
            ...y
          };
      }
      return h === "json" && (s.responseValidator && await s.responseValidator(p), s.responseTransformer && (p = await s.responseTransformer(p))), s.responseStyle === "data" ? p : {
        data: p,
        ...y
      };
    }
    const S = await f.text();
    let C;
    try {
      C = JSON.parse(S);
    } catch {
    }
    const x = C ?? S;
    let m = x;
    for (const h of a.error.fns)
      h && (m = await h(x, f, w, s));
    if (m = m || {}, s.throwOnError)
      throw m;
    return s.responseStyle === "data" ? void 0 : {
      error: m,
      ...y
    };
  }, n = (u) => (s) => c({ ...s, method: u }), i = (u) => async (s) => {
    const { opts: d, url: j } = await l(s);
    return Q({
      ...d,
      body: d.body,
      headers: d.headers,
      method: u,
      onRequest: async (w, z) => {
        let f = new Request(w, z);
        for (const y of a.request.fns)
          y && (f = await y(f, d));
        return f;
      },
      url: j
    });
  };
  return {
    buildUrl: v,
    connect: n("CONNECT"),
    delete: n("DELETE"),
    get: n("GET"),
    getConfig: r,
    head: n("HEAD"),
    interceptors: a,
    options: n("OPTIONS"),
    patch: n("PATCH"),
    post: n("POST"),
    put: n("PUT"),
    request: c,
    setConfig: o,
    sse: {
      connect: i("CONNECT"),
      delete: i("DELETE"),
      get: i("GET"),
      head: i("HEAD"),
      options: i("OPTIONS"),
      patch: i("PATCH"),
      post: i("POST"),
      put: i("PUT"),
      trace: i("TRACE")
    },
    trace: n("TRACE")
  };
}, de = (t) => ({
  ...t,
  ...M.getConfig()
}), he = ue(de(R({
  baseUrl: "https://localhost:5000"
}))), be = async (t, e) => {
  const r = await t.getContext(F);
  if (!r) {
    console.warn("UMB_AUTH_CONTEXT not available — extension API client will not be authenticated");
    return;
  }
  r.configureClient(he), console.log("EnvCompare extension initialized");
}, me = (t, e) => {
  console.log("EnvCompare extension unloaded");
};
export {
  be as onInit,
  me as onUnload
};
//# sourceMappingURL=entrypoint-DICCKGz1.js.map
