(function () {
  var adminPath = "/admin/";
  var callbackTokens = ["confirmation_token", "invite_token", "recovery_token"];
  var callbackHashPattern = /(confirmation_token|invite_token|recovery_token)=/;
  var redirectFlag = "buildscopeIdentityCallbackPending";
  var siteUrl = (window.BUILDSCOPE_NETLIFY_SITE_URL || window.location.origin).replace(/\/+$/, "");
  var hasCallbackToken = callbackHashPattern.test(window.location.hash || "");

  function isAdminPage() {
    return window.location.pathname === adminPath || window.location.pathname.indexOf(adminPath) === 0;
  }

  function tokenStillInHash() {
    return callbackTokens.some(function (token) {
      return (window.location.hash || "").indexOf(token + "=") !== -1;
    });
  }

  function redirectToAdmin() {
    try {
      window.sessionStorage.removeItem(redirectFlag);
    } catch (error) {
      // sessionStorage can be blocked in strict browser modes; the redirect should still work.
    }

    if (isAdminPage()) {
      window.location.reload();
    } else {
      window.location.assign(adminPath);
    }
  }

  function rememberCallbackFlow() {
    try {
      window.sessionStorage.setItem(redirectFlag, "true");
    } catch (error) {
      // Safe to ignore; the widget events below still handle the active page session.
    }
  }

  function hasRememberedCallbackFlow() {
    try {
      return window.sessionStorage.getItem(redirectFlag) === "true";
    } catch (error) {
      return false;
    }
  }

  function resolveIdentity(candidate) {
    if (candidate && candidate.open) return candidate;
    if (candidate && candidate.default && candidate.default.open) return candidate.default;
    if (candidate && candidate.netlifyIdentity && candidate.netlifyIdentity.open) return candidate.netlifyIdentity;
    return undefined;
  }

  function initIdentityCallbackHandling() {
    var identity = resolveIdentity(window.netlifyIdentity) || resolveIdentity(window.BUILDSCOPE_NETLIFY_IDENTITY);

    if (!identity || window.__buildscopeNetlifyIdentityCallbackReady) {
      return;
    }

    window.netlifyIdentity = identity;
    window.BUILDSCOPE_NETLIFY_IDENTITY = identity;
    window.__buildscopeNetlifyIdentityCallbackReady = true;

    if (hasCallbackToken) {
      rememberCallbackFlow();
    }

    identity.on("init", function (user) {
      if (hasCallbackToken) {
        identity.open();
        return;
      }

      if (user && hasRememberedCallbackFlow()) {
        redirectToAdmin();
      }
    });

    identity.on("login", function () {
      identity.close();
      redirectToAdmin();
    });

    identity.on("signup", function () {
      if (hasRememberedCallbackFlow() && !tokenStillInHash()) {
        redirectToAdmin();
      }
    });

    identity.on("close", function () {
      if (hasRememberedCallbackFlow() && !tokenStillInHash()) {
        redirectToAdmin();
      }
    });

    identity.on("error", function (error) {
      console.error("Netlify Identity error:", error);
    });

    identity.init({
      APIUrl: siteUrl + "/.netlify/identity",
    });

    if (hasCallbackToken) {
      window.setTimeout(function () {
        identity.open();
      }, 250);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initIdentityCallbackHandling);
  } else {
    initIdentityCallbackHandling();
  }
})();
