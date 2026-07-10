/** Required so umbHttpClient attaches the backoffice bearer token. */
export const managementApiSecurity = [
  { type: "http" as const, scheme: "bearer" as const },
];
