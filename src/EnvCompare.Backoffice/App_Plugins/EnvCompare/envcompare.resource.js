(function () {
  "use strict";

  function envCompareResource($http, umbRequestHelper) {
    var baseUrl = Umbraco.Sys.ServerVariables.umbracoSettings.umbracoPath
      + "/backoffice/EnvCompare/EnvCompareApi/";

    return {
      getEnvironments: function () {
        return umbRequestHelper.resourcePromise(
          $http.get(baseUrl + "GetEnvironments"),
          "Failed to load EnvCompare environments");
      },
      compare: function (request) {
        return umbRequestHelper.resourcePromise(
          $http.post(baseUrl + "Compare", request),
          "EnvCompare comparison failed");
      }
    };
  }

  angular.module("umbraco.resources").factory("envCompareResource", envCompareResource);
})();
