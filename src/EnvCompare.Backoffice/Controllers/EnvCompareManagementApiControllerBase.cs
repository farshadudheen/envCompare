using Microsoft.AspNetCore.Authorization;
using Umbraco.Cms.Api.Common.Attributes;
using Umbraco.Cms.Api.Management.Controllers;
using Umbraco.Cms.Api.Management.Routing;
using Umbraco.Cms.Web.Common.Authorization;

namespace EnvCompare.Backoffice.Controllers;

/// <summary>
/// Base for EnvCompare Management API controllers used by the backoffice UI.
/// </summary>
[VersionedApiBackOfficeRoute("envcompare")]
[Authorize(Policy = AuthorizationPolicies.RequireAdminAccess)]
[MapToApi(Constants.ApiName)]
public abstract class EnvCompareManagementApiControllerBase : ManagementApiControllerBase
{
}
