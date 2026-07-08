using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Cms.Api.Common.Attributes;
using Umbraco.Cms.Web.Common.Authorization;
using Umbraco.Cms.Web.Common.Routing;

namespace EnvCompare.Backoffice.Controllers;

/// <summary>
/// Base controller for EnvCompare backoffice APIs.
/// Restricted to backoffice administrators; read-only surface (no mutate endpoints).
/// </summary>
[ApiController]
[BackOfficeRoute("envcompare/api/v{version:apiVersion}")]
[Authorize(Policy = AuthorizationPolicies.RequireAdminAccess)]
[MapToApi(Constants.ApiName)]
public abstract class EnvCompareApiControllerBase : ControllerBase
{
}
