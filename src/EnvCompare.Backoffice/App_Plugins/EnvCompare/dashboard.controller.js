(function () {
  "use strict";

  var STATUS_NAMES = ["Identical", "Added", "Missing", "Modified", "Ignored"];
  var STATUS_ICONS = {
    Identical: "✔",
    Added: "＋",
    Missing: "−",
    Modified: "△",
    Ignored: "○"
  };
  var STATUS_RANK = {
    Missing: 4,
    Modified: 3,
    Added: 2,
    Identical: 1,
    Ignored: 0
  };

  function EnvCompareDashboardController(envCompareResource, $sce, $scope) {
    var vm = this;

    vm.environments = [];
    vm.environmentA = "";
    vm.environmentB = "";
    vm.isLoadingEnvironments = true;
    vm.isComparing = false;
    vm.progress = 0;
    vm.compareButtonState = "init";
    vm.hasError = false;
    vm.statusMessage = "Loading environments…";
    vm.result = null;
    vm.selectedItem = null;
    vm.activeTab = "content";
    vm.viewMode = "tree";
    vm.search = "";
    vm.statusFilter = "";
    vm.cultureFilter = "";
    vm.contentTypeFilter = "";
    vm.expandedPaths = {};
    vm.filterOptions = { cultures: [], contentTypes: [] };
    vm.diffHtml = { left: "", right: "" };

    vm.statusLabel = statusLabel;
    vm.statusIcon = statusIcon;
    vm.statusIconFromRank = statusIconFromRank;
    vm.rankStatusName = rankStatusName;
    vm.swapEnvironments = swapEnvironments;
    vm.runCompare = runCompare;
    vm.compareDisabled = compareDisabled;
    vm.onEnvironmentChanged = onEnvironmentChanged;
    vm.setTab = setTab;
    vm.tabCount = tabCount;
    vm.visibleItems = visibleItems;
    vm.visibleTreeRows = visibleTreeRows;
    vm.selectItem = selectItem;
    vm.selectTreeNode = selectTreeNode;
    vm.toggleExpand = toggleExpand;
    vm.isExpanded = isExpanded;
    vm.expandAll = expandAll;
    vm.collapseAll = collapseAll;

    loadEnvironments();

    $scope.$watchGroup(
      ["vm.search", "vm.statusFilter", "vm.cultureFilter", "vm.contentTypeFilter", "vm.activeTab"],
      function () {
        refreshFilterOptions();
      });

    function pick(obj, camel, pascal) {
      if (!obj) {
        return undefined;
      }
      if (obj[camel] !== undefined && obj[camel] !== null) {
        return obj[camel];
      }
      return obj[pascal];
    }

    function normalizeEnvironment(raw) {
      return {
        name: pick(raw, "name", "Name") || "",
        displayName: pick(raw, "displayName", "DisplayName") || pick(raw, "name", "Name") || "",
        baseUrl: pick(raw, "baseUrl", "BaseUrl") || null,
        isLocal: !!pick(raw, "isLocal", "IsLocal"),
        isAvailable: pick(raw, "isAvailable", "IsAvailable") !== false
      };
    }

    function normalizeEnvironments(payload) {
      var list = payload;
      if (payload && !angular.isArray(payload)) {
        list = payload.items || payload.Items || payload.data || payload.Data || [];
      }
      return (list || []).map(normalizeEnvironment).filter(function (e) {
        return !!e.name;
      });
    }

    function loadEnvironments() {
      vm.isLoadingEnvironments = true;
      vm.hasError = false;
      envCompareResource.getEnvironments()
        .then(function (environments) {
          vm.environments = normalizeEnvironments(environments);
          var local = (vm.environments.filter(function (e) { return e.isLocal; })[0] || {}).name ||
            (vm.environments[0] || {}).name ||
            "";
          var remote = (vm.environments.filter(function (e) { return !e.isLocal; })[0] ||
            vm.environments.filter(function (e) { return e.name !== local; })[0] ||
            {}).name || "";
          vm.environmentA = local;
          vm.environmentB = remote;
          if (vm.environments.length > 1 && vm.environmentA && vm.environmentB && vm.environmentA !== vm.environmentB) {
            vm.statusMessage = "Ready to compare " + vm.environmentA + " with " + vm.environmentB + ".";
          } else if (vm.environments.length > 1) {
            vm.statusMessage = "Select two different environments, then compare.";
          } else {
            vm.statusMessage = "Only Local is available. Configure remote ApiUrl values in appsettings.";
          }
        })
        .catch(function (err) {
          vm.hasError = true;
          vm.environments = [{ name: "Local", displayName: "Local", isLocal: true, isAvailable: true }];
          vm.environmentA = "Local";
          vm.environmentB = "";
          vm.statusMessage = extractError(err) || "Could not load environments.";
        })
        .finally(function () {
          vm.isLoadingEnvironments = false;
        });
    }

    function onEnvironmentChanged() {
      vm.hasError = false;
      if (!vm.environmentA || !vm.environmentB) {
        vm.statusMessage = "Select two environments, then compare.";
      } else if (vm.environmentA === vm.environmentB) {
        vm.statusMessage = "Choose two different environments.";
      } else {
        vm.statusMessage = "Ready to compare " + vm.environmentA + " with " + vm.environmentB + ".";
      }
    }

    function compareDisabled() {
      return vm.isLoadingEnvironments ||
        vm.isComparing ||
        !vm.environmentA ||
        !vm.environmentB ||
        vm.environmentA === vm.environmentB;
    }

    function swapEnvironments() {
      var previous = vm.environmentA;
      vm.environmentA = vm.environmentB;
      vm.environmentB = previous;
      onEnvironmentChanged();
    }

    function extractError(err) {
      if (!err) {
        return "";
      }
      if (typeof err === "string") {
        return err;
      }
      if (err.data) {
        if (typeof err.data === "string") {
          return err.data;
        }
        return err.data.message || err.data.Message || err.data.title || "";
      }
      return err.message || err.Message || "";
    }

    function runCompare() {
      if (compareDisabled()) {
        return;
      }

      vm.isComparing = true;
      vm.progress = 15;
      vm.compareButtonState = "busy";
      vm.hasError = false;
      vm.statusMessage = "Comparing " + vm.environmentA + " → " + vm.environmentB + "…";
      vm.selectedItem = null;
      vm.diffHtml = { left: "", right: "" };

      var progressTimer = setInterval(function () {
        if (vm.progress < 85) {
          vm.progress += 5;
          if (!$scope.$$phase) {
            $scope.$applyAsync();
          }
        }
      }, 200);

      envCompareResource.compare({
        environmentA: vm.environmentA,
        environmentB: vm.environmentB,
        EnvironmentA: vm.environmentA,
        EnvironmentB: vm.environmentB,
        modules: ["content", "media", "settings", "dictionary"],
        Modules: ["content", "media", "settings", "dictionary"]
      })
        .then(function (result) {
          vm.result = normalizeResult(result);
          vm.expandedPaths = {};
          refreshFilterOptions();
          vm.progress = 100;
          vm.compareButtonState = "success";
          vm.statusMessage = "Compared " + (vm.result.totalCompared || 0) + " item(s).";
          expandAll();
        })
        .catch(function (err) {
          vm.result = null;
          vm.hasError = true;
          vm.progress = 0;
          vm.compareButtonState = "error";
          vm.statusMessage = extractError(err) || "Comparison failed.";
        })
        .finally(function () {
          clearInterval(progressTimer);
          vm.isComparing = false;
          setTimeout(function () {
            vm.compareButtonState = "init";
            if (!$scope.$$phase) {
              $scope.$applyAsync();
            }
          }, 1500);
        });
    }

    function setTab(tab) {
      vm.activeTab = tab;
      vm.selectedItem = null;
      vm.diffHtml = { left: "", right: "" };
      refreshFilterOptions();
    }

    function tabCount(tab) {
      return filterItems(tab).length;
    }

    function visibleItems() {
      return filterItems(vm.activeTab);
    }

    function filterItems(tab) {
      if (!vm.result || !vm.result.items) {
        return [];
      }
      return vm.result.items.filter(function (item) {
        var module = (item.moduleAlias || "content").toLowerCase();
        if (module !== tab) {
          return false;
        }
        return matchesFilters(item);
      });
    }

    function matchesFilters(item) {
      var status = statusLabel(item.status);
      if (vm.statusFilter && status.toLowerCase() !== vm.statusFilter.toLowerCase()) {
        return false;
      }
      if (vm.cultureFilter && (item.culture || "").toLowerCase() !== vm.cultureFilter.toLowerCase()) {
        return false;
      }
      if (vm.contentTypeFilter && (item.contentType || "").toLowerCase() !== vm.contentTypeFilter.toLowerCase()) {
        return false;
      }
      if (vm.search && vm.search.trim()) {
        var term = vm.search.trim().toLowerCase();
        var haystack = [item.name, item.id, item.path || "", item.contentType || "", item.differenceSummary || ""]
          .join(" ")
          .toLowerCase();
        if (haystack.indexOf(term) < 0) {
          return false;
        }
      }
      return true;
    }

    function refreshFilterOptions() {
      var items = filterItems(vm.activeTab);
      // Collect from tab items without status/search so filters stay usable
      var tabItems = (vm.result && vm.result.items || []).filter(function (item) {
        return (item.moduleAlias || "content").toLowerCase() === vm.activeTab;
      });
      var cultures = {};
      var contentTypes = {};
      tabItems.forEach(function (item) {
        if (item.culture) {
          cultures[item.culture] = true;
        }
        if (item.contentType) {
          contentTypes[item.contentType] = true;
        }
      });
      vm.filterOptions = {
        cultures: Object.keys(cultures).sort(),
        contentTypes: Object.keys(contentTypes).sort()
      };
      return items;
    }

    function selectItem(item) {
      vm.selectedItem = item;
      var diff = diffText(item.environmentAValue, item.environmentBValue);
      vm.diffHtml = {
        left: $sce.trustAsHtml(renderDiffSide(diff.left)),
        right: $sce.trustAsHtml(renderDiffSide(diff.right))
      };
    }

    function selectTreeNode(node) {
      if (node.item) {
        selectItem(node.item);
      }
    }

    function toggleExpand(path) {
      vm.expandedPaths[path] = !vm.expandedPaths[path];
    }

    function isExpanded(path) {
      return !!vm.expandedPaths[path];
    }

    function expandAll() {
      var tree = buildComparisonTree(visibleItems());
      walk(tree);
      function walk(nodes) {
        nodes.forEach(function (n) {
          if (n.children.length) {
            vm.expandedPaths[n.path] = true;
            walk(n.children);
          }
        });
      }
    }

    function collapseAll() {
      vm.expandedPaths = {};
    }

    function visibleTreeRows() {
      return flattenTree(buildComparisonTree(visibleItems()), vm.expandedPaths);
    }

    function statusLabel(status) {
      if (typeof status === "number") {
        return STATUS_NAMES[status] || String(status);
      }
      return status || "Identical";
    }

    function statusIcon(status) {
      return STATUS_ICONS[statusLabel(status)] || "○";
    }

    function statusIconFromRank(rank) {
      var name = Object.keys(STATUS_RANK).find(function (k) { return STATUS_RANK[k] === rank; }) || "Identical";
      return STATUS_ICONS[name] || "○";
    }

    function rankStatusName(node) {
      if (node.item) {
        return statusLabel(node.item.status);
      }
      var name = Object.keys(STATUS_RANK).find(function (k) { return STATUS_RANK[k] === node.statusRank; });
      return name || "Identical";
    }

    function normalizeResult(result) {
      if (!result) {
        return null;
      }
      result.items = (result.items || []).map(function (item) {
        // Newtonsoft may serialize enums as ints
        return item;
      });
      return result;
    }
  }

  function buildComparisonTree(items) {
    var nodes = {};
    var roots = [];
    var sorted = (items || []).slice().sort(function (a, b) {
      return String(a.path || a.id).localeCompare(String(b.path || b.id));
    });

    sorted.forEach(function (item) {
      var path = (item.path && item.path.trim()) || item.id;
      var segments = path.split(",").filter(function (s) { return s.length > 0; });
      var depth = Math.max(segments.length, 1);
      var currentPath = "";

      for (var i = 0; i < depth; i++) {
        var segment = segments[i] || item.id;
        var parentPath = currentPath;
        currentPath = currentPath ? currentPath + "," + segment : segment;

        if (!nodes[currentPath]) {
          var isLeaf = i === depth - 1;
          var node = {
            id: isLeaf ? item.id : currentPath,
            label: isLeaf ? item.name : ("… " + segment),
            path: currentPath,
            depth: i,
            item: isLeaf ? item : null,
            children: [],
            statusRank: isLeaf ? (STATUS_RANK[statusLabelStandalone(item.status)] || 0) : 0
          };
          nodes[currentPath] = node;
          if (parentPath) {
            nodes[parentPath].children.push(node);
          } else {
            roots.push(node);
          }
        } else if (i === depth - 1) {
          var existing = nodes[currentPath];
          existing.item = item;
          existing.label = item.name;
          existing.id = item.id;
          existing.statusRank = Math.max(existing.statusRank, STATUS_RANK[statusLabelStandalone(item.status)] || 0);
        }
      }
    });

    propagateStatus(roots);
    return roots;
  }

  function statusLabelStandalone(status) {
    if (typeof status === "number") {
      return STATUS_NAMES[status] || String(status);
    }
    return status || "Identical";
  }

  function propagateStatus(nodes) {
    nodes.forEach(function (node) {
      if (node.children.length) {
        propagateStatus(node.children);
        node.statusRank = Math.max.apply(null, [node.statusRank].concat(node.children.map(function (c) { return c.statusRank; })));
      }
    });
  }

  function flattenTree(nodes, expanded, depth) {
    depth = depth || 0;
    var flat = [];
    (nodes || []).forEach(function (node) {
      flat.push({ node: node, depth: depth });
      if (node.children.length && expanded[node.path]) {
        flat = flat.concat(flattenTree(node.children, expanded, depth + 1));
      }
    });
    return flat;
  }

  function tokenize(text) {
    return text.split(/(\s+)/).filter(function (t) { return t.length > 0; });
  }

  function longestCommonSubsequence(a, b) {
    var m = a.length;
    var n = b.length;
    var dp = [];
    for (var i = 0; i <= m; i++) {
      dp[i] = new Array(n + 1).fill(0);
    }
    for (i = 1; i <= m; i++) {
      for (var j = 1; j <= n; j++) {
        if (a[i - 1] === b[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }
    var lcs = [];
    i = m;
    j = n;
    while (i > 0 && j > 0) {
      if (a[i - 1] === b[j - 1]) {
        lcs.unshift(a[i - 1]);
        i--;
        j--;
      } else if (dp[i - 1][j] >= dp[i][j - 1]) {
        i--;
      } else {
        j--;
      }
    }
    return lcs;
  }

  function buildDiffFromLcs(leftTokens, rightTokens, lcs) {
    var leftParts = [];
    var rightParts = [];
    var li = 0;
    var ri = 0;
    lcs.forEach(function (token) {
      while (li < leftTokens.length && leftTokens[li] !== token) {
        leftParts.push({ text: leftTokens[li++], type: "removed" });
      }
      while (ri < rightTokens.length && rightTokens[ri] !== token) {
        rightParts.push({ text: rightTokens[ri++], type: "added" });
      }
      leftParts.push({ text: token, type: "same" });
      rightParts.push({ text: token, type: "same" });
      li++;
      ri++;
    });
    while (li < leftTokens.length) {
      leftParts.push({ text: leftTokens[li++], type: "removed" });
    }
    while (ri < rightTokens.length) {
      rightParts.push({ text: rightTokens[ri++], type: "added" });
    }
    return { left: leftParts, right: rightParts };
  }

  function diffWords(left, right) {
    return buildDiffFromLcs(tokenize(left), tokenize(right), longestCommonSubsequence(tokenize(left), tokenize(right)));
  }

  function diffText(left, right) {
    var a = left == null ? "" : String(left);
    var b = right == null ? "" : String(right);
    if (a === b) {
      return { left: [{ text: a, type: "same" }], right: [{ text: b, type: "same" }] };
    }
    if (!a && b) {
      return { left: [], right: [{ text: b, type: "added" }] };
    }
    if (a && !b) {
      return { left: [{ text: a, type: "removed" }], right: [] };
    }
    var leftLines = a.split("\n");
    var rightLines = b.split("\n");
    if (leftLines.length === 1 && rightLines.length === 1) {
      return diffWords(a, b);
    }
    var lineLcs = longestCommonSubsequence(leftLines, rightLines);
    var leftParts = [];
    var rightParts = [];
    var li = 0;
    var ri = 0;
    lineLcs.forEach(function (line) {
      while (li < leftLines.length && leftLines[li] !== line) {
        leftParts.push({ text: leftLines[li++] + "\n", type: "removed" });
      }
      while (ri < rightLines.length && rightLines[ri] !== line) {
        rightParts.push({ text: rightLines[ri++] + "\n", type: "added" });
      }
      leftParts.push({ text: line + "\n", type: "same" });
      rightParts.push({ text: line + "\n", type: "same" });
      li++;
      ri++;
    });
    while (li < leftLines.length) {
      leftParts.push({ text: leftLines[li++] + "\n", type: "removed" });
    }
    while (ri < rightLines.length) {
      rightParts.push({ text: rightLines[ri++] + "\n", type: "added" });
    }
    return { left: leftParts, right: rightParts };
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderDiffSide(parts) {
    return (parts || []).map(function (part) {
      var cls = part.type === "same" ? "" : (" envcompare-diff--" + part.type);
      return '<span class="' + cls.trim() + '">' + escapeHtml(part.text) + "</span>";
    }).join("");
  }

  angular.module("umbraco").controller("EnvCompare.DashboardController", EnvCompareDashboardController);
})();
