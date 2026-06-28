(function () {
  var adminPath = "/admin/";
  var callbackTokens = ["confirmation_token", "invite_token", "recovery_token"];
  var callbackHashPattern = /(confirmation_token|invite_token|recovery_token)=/;
  var redirectFlag = "buildscopeIdentityCallbackPending";
  var siteUrl = (window.BUILDSCOPE_NETLIFY_SITE_URL || window.location.origin).replace(/\/+$/, "");
  var hasCallbackToken = Boolean(window.BUILDSCOPE_IDENTITY_TOKEN_TYPE) || callbackHashPattern.test(window.location.hash || "");

  function getCallbackTokenType() {
    if (window.BUILDSCOPE_IDENTITY_TOKEN_TYPE) {
      return window.BUILDSCOPE_IDENTITY_TOKEN_TYPE;
    }

    var hash = window.location.hash || "";
    for (var index = 0; index < callbackTokens.length; index += 1) {
      if (hash.indexOf(callbackTokens[index] + "=") !== -1) {
        return callbackTokens[index];
      }
    }
    return "";
  }

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

    if (!isAdminPage()) {
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

  function openIdentityFlow(identity) {
    var tokenType = getCallbackTokenType();

    try {
      if (tokenType === "invite_token") {
        identity.open("signup");
        return;
      }

      if (tokenType === "recovery_token") {
        identity.open("recovery");
        return;
      }

      identity.open();
    } catch (error) {
      console.error("Netlify Identity open error:", error);
      identity.open();
    }
  }

  function renderCallbackFallback(identity) {
    if (!hasCallbackToken || document.getElementById("buildscope-identity-token-panel")) {
      return;
    }

    var tokenType = getCallbackTokenType();
    var title = tokenType === "invite_token" ? "Set up your BuildScope admin account" : "Continue BuildScope admin verification";
    var buttonText = tokenType === "recovery_token" ? "Continue password recovery" : "Continue account setup";
    var panel = document.createElement("div");

    panel.id = "buildscope-identity-token-panel";
    panel.style.cssText =
      "position:fixed;inset:0;z-index:10000;display:grid;place-items:center;background:rgba(8,21,38,.94);font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:white;padding:1.5rem;";
    panel.innerHTML = [
      '<section style="max-width:30rem;border:1px solid rgba(255,255,255,.16);background:#0b1a2d;padding:2rem;text-align:center;box-shadow:0 24px 80px rgba(0,0,0,.35);">',
      '<img src="/favicon.svg" alt="BuildScope" style="width:5rem;height:5rem;margin:0 auto 1rem;" />',
      '<h1 style="font-size:1.5rem;margin:0 0 .75rem;">',
      title,
      "</h1>",
      '<p style="color:#b9c3d1;line-height:1.6;margin:0 0 1.25rem;">If the Netlify Identity popup does not appear automatically, click the button below.</p>',
      '<button id="buildscope-identity-token-button" type="button" style="border:0;border-radius:4px;background:#ff7a1a;color:#081526;font-weight:800;padding:.8rem 1rem;cursor:pointer;">',
      buttonText,
      "</button>",
      '<p style="color:#7f8da3;font-size:.85rem;line-height:1.5;margin:1rem 0 0;">Tip: use the newest invitation email only. Old links may be expired.</p>',
      "</section>",
    ].join("");

    document.body.appendChild(panel);
    document.getElementById("buildscope-identity-token-button").addEventListener("click", function () {
      openIdentityFlow(identity);
    });
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
      renderCallbackFallback(identity);
    }

    identity.on("init", function (user) {
      if (hasCallbackToken) {
        renderCallbackFallback(identity);
        openIdentityFlow(identity);
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
      if (hasCallbackToken || (hasRememberedCallbackFlow() && !tokenStillInHash())) {
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
        renderCallbackFallback(identity);
        openIdentityFlow(identity);
      }, 250);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initIdentityCallbackHandling);
  } else {
    initIdentityCallbackHandling();
  }
})();
