# Intrax → TELLU: manual embedding runbook

Status: **PENDING — routing/security review required. No production patch is approved.**

This document prepares a manual change. The coding agent has not connected to the VPS, inspected Intrax source, edited Nginx/PHP, or deployed either application. Facts below come from the configuration and diagnostics supplied by the owner; they are not a fresh server audit.

## Confirmed facts

| Item | Supplied value |
| --- | --- |
| Website / intended preview URL | `https://intrax.web.id/` |
| DNS / server | `72.62.64.41` |
| Observed response | HTTP 200; `X-Frame-Options: SAMEORIGIN` |
| Intrax directory | `/home/intrax` |
| Nginx document root | `/home/intrax/intrax-app/var/www/intrax/public` |
| PHP-FPM upstream | `unix:/run/php/php8.3-fpm.sock` |
| Virtual host | `/etc/nginx/sites-available/intrax.web.id` |
| Enabled configuration | `/etc/nginx/sites-enabled/intrax.web.id` |
| HTTP handling | Port 80 redirects to HTTPS |
| HTTPS routing | `try_files $uri $uri/ /index.php?$query_string` |
| PHP handler | Exact `/index.php`; other PHP paths return 404 |
| Existing HTTPS headers | `X-Frame-Options: SAMEORIGIN` and `X-Content-Type-Options: nosniff`, both `always` |
| **Only approved TELLU parent origin** | **`http://72.62.64.41:8088`** |

The two sites share a machine, but their scheme, host, and port differ. They are different browser origins. The supplied `SAMEORIGIN` header blocks this embedding. CORS, parent JavaScript, an iframe `onLoad`, and changing the TELLU iframe URL cannot grant permission.

The local registry keeps one Intrax entry with `previewType: "remote-iframe"`, `previewUrl: "https://intrax.web.id/"`, `previewStatus: "pending-server-permission"`, and `embeddable: false`. No Intrax iframe is created in this state. Its approved screenshot, pending message, and external link remain available.

## Security gate: complete before changing headers

The Nginx file does **not** establish which PHP routes are safe. The Intrax maintainer must fill this inventory using the actual router, middleware, response headers, and anonymous/authenticated browser behavior. No route names are assumed here.

The approved local screenshot shows `Masuk` and `Mulai Gratis` controls. This is a reason to review authentication and signup behavior, not proof of their current route paths or framing safety.

| Question | Current status / required evidence |
| --- | --- |
| Which URLs are explicitly public marketing pages? | Unknown; list exact paths, query behavior, and allowed methods. |
| Is the homepage always public, including with a signed-in cookie? | Unknown; verify personalization and redirects. |
| Does the homepage redirect elsewhere? | Unknown; record every hop and final response. |
| Are there login, dashboard, admin, or private operational routes? | Unknown; identify and keep framing denied. |
| Are payment, account, sensitive, or state-changing forms present? | Unknown; exclude them from the preview surface. |
| Does PHP/middleware add XFO, CSP, or CSP-Report-Only? | Unknown; inspect both code and final GET responses. |
| Are there global Nginx includes with additional headers? | Unknown; inspect the effective configuration privately. |
| Do cookies/authentication/redirects affect the embedded page? | Unknown; test clean and signed-in sessions separately. |
| Can an iframe navigate from the preview into private functionality? | Unknown; review links, redirects, scripts, and embedded subframes. |
| Can the final PHP response be scoped to an exact safe surface? | Unknown; required before a Nginx exception can be approved. |

Do not treat an anonymous HTTP 200 or a successful HEAD response as proof that the page is safe to frame. Preserve clickjacking protection for every sensitive surface, including redirects and error responses.

## Recommended architecture

**Preferred: a dedicated, explicitly public, read-only preview route with application support.** The maintainer must first identify or implement the actual route; this document does not invent one. It must show only approved marketing content, avoid authenticated personalization and sensitive forms, and prevent navigation into privileged functionality. The application should select the appropriate response policy at the final front controller/middleware layer.

If that isolation cannot be established within the current application, assess a dedicated preview origin or isolated instance with no privileged sessions or sensitive endpoints. That is a separate manual design/deployment decision, not authorization to clone or move Intrax now.

A carefully scoped Nginx exception is an option **only after** routing and response ownership prove it cannot include private pages. Otherwise, keep the screenshot fallback.

The intended policy for the approved public response is conceptually:

```http
Content-Security-Policy: frame-ancestors 'self' http://72.62.64.41:8088;
```

This is a target response fragment, **not a server-wide configuration patch**. Integrate it into any existing enforced CSP without dropping other directives. The approved response should avoid a contradictory legacy XFO restriction; all non-preview responses must retain their current protections.

### Why there is no copy/paste production patch yet

- Public and private requests can internally redirect to the **same** `/index.php` handler. A header exception on that handler would be too broad.
- A header configured in `location /` may not describe the eventual FastCGI response after an internal redirect. `$uri` can change during routing; `$request_uri` preserves the original request but does not establish whether the resulting application response is public.
- On Nginx **1.24**, adding any location-level `add_header` stops inheritance of the parent's `add_header` list. A reviewed exception must deliberately retain `nosniff` and every other required header discovered in the effective configuration. `add_header_inherit` is a newer feature and must not be used on 1.24.
- `add_header` does not replace or remove a header emitted by PHP. Any `fastcgi_hide_header` would need exact, verified scope; do not hide XFO or an entire CSP globally.
- Multiple enforced CSP policies intersect. Adding a permissive second policy does not loosen an existing restrictive policy. Modern CSP framing rules and legacy XFO behavior need real-browser validation; do not rely on one browser ignoring a contradiction.
- Do not use `ALLOW-FROM`, wildcard parents, a guessed production domain, a proxy bypass, or an HTML meta tag as the solution.

Until the security gate is complete, removing the supplied server-level `SAMEORIGIN` or adding the illustrated allowlist globally is **not approved**. Keep the document root, PHP socket, PHP path restrictions, hidden-file restriction, HTTPS redirect, and TLS settings unchanged.

## Manual operating procedure — owner only

Run the following only in the owner's authorized Termius session. No commands in this document have been executed by the coding agent. Because other applications share Nginx, coordinate the maintenance window and record their current health.

### 1. Record and back up before any edit

```sh
umask 077
backup_dir=$(mktemp -d "$HOME/intrax-tellu-embed.XXXXXXXX")
printf 'Private backup: %s\n' "$backup_dir"
sudo nginx -v
sudo nginx -t
readlink -f /etc/nginx/sites-enabled/intrax.web.id
sudo cp -a -- /etc/nginx/sites-available/intrax.web.id "$backup_dir/intrax.web.id"
sudo nginx -T > "$backup_dir/nginx-effective.txt" 2>&1
curl -sS -I https://intrax.web.id/ > "$backup_dir/home-before.headers"
curl -sS -D "$backup_dir/home-get-before.headers" -o /dev/null https://intrax.web.id/
```

Confirm the enabled target is the expected file before proceeding. Effective configuration and response headers may contain operational information or cookies: keep backups private and redact them before sharing. Back up any application route/middleware files using the maintainer's actual identified paths; do not guess or replace the entire application.

### 2. Approve the actual route and patch

Complete the inventory above and review the exact application/header changes. Record the final public URL, accepted methods/query parameters, redirect behavior, and private regression URLs. A private route must not gain the TELLU ancestor permission merely because it shares `/index.php`.

Only after approval, apply the minimal reviewed changes manually. If the existing vhost needs editing, use `sudoedit /etc/nginx/sites-available/intrax.web.id`. Check the exact diff against the backup. Do not change unrelated vhosts, PHP-FPM, TLS, firewall, or systemd application services.

### 3. Validate and safely reload

```sh
sudo diff -u -- "$backup_dir/intrax.web.id" /etc/nginx/sites-available/intrax.web.id
sudo nginx -t
# Continue only after validation succeeds and the reviewed diff is correct:
sudo systemctl reload nginx
sudo systemctl is-active nginx
```

Use reload, not restart. If validation fails, do not reload. A syntactically valid configuration is not a security approval; the route/header checks below are also mandatory.

### 4. Check headers and routing after the approved change

Set these variables to **real routes established by the inventory**, not examples:

```sh
: "${APPROVED_PUBLIC_PREVIEW_URL:?Set the reviewed public preview URL first}"
: "${PRIVATE_REGRESSION_URL:?Set an actual private route from the inventory first}"
curl -sS -I -- "$APPROVED_PUBLIC_PREVIEW_URL"
curl -sS -D "$backup_dir/preview-get-after.headers" -o /dev/null -- "$APPROVED_PUBLIC_PREVIEW_URL"
curl -sS -I -L --max-redirs 5 --proto '=https' --proto-redir '=https' -- "$APPROVED_PUBLIC_PREVIEW_URL"
curl -sS -I -- "$PRIVATE_REGRESSION_URL"
curl -sS -I https://intrax.web.id/
```

Inspect all redirect hops and final GET responses, not HEAD alone. On the approved response, confirm the exact ancestor origin, no conflicting enforced policy/XFO, and retained `nosniff`/other required headers. On **every identified private category**, verify its original framing denial remains unchanged. Repeat with the maintainer's test account where necessary, without publishing cookies or credentials. Test actual query variations, HTTP→HTTPS redirects, static assets, and applicable 3xx/4xx/5xx responses. Confirm other production applications still work.

### 5. Real-browser acceptance and TELLU enablement

- Test from **`http://72.62.64.41:8088`**, in fresh Chrome/Edge, Firefox, and Safari sessions where supported. Localhost is not on the production allowlist and must not be silently added.
- Confirm the **actual approved Intrax public page** renders interactively inside TELLU's existing frame. An iframe load event alone is not proof.
- Test anonymous and signed-in cases, third-party cookie restrictions, links/redirects, mobile width, and the absence of account/private/payment interactions. Do not weaken cookie settings just to make authentication work inside the preview.
- Verify an unapproved parent origin and identified private routes remain blocked. Inspect console/header failures rather than suppressing them. Ensure the iframe cannot navigate TELLU's top-level window.
- The future Intrax sandbox is intentionally limited to `allow-scripts allow-same-origin`, without form submission, popups, or top-level navigation permissions. Confirm the approved public page works within that scope; do not broaden it casually.
- Only after those checks pass, review a **separate local change** to the Intrax registry: set `previewStatus` to `approved`, set `embeddable` to `true`, and set `previewUrl` to the actual verified public surface if it differs from the homepage. The external `url` remains the real Intrax website.
- Recheck that selection starts with the screenshot, activation creates one iframe, switching projects removes the previous iframe, and the screenshot/external-site recovery controls work. Keep the status pending if any security or rendering check fails.

The coding agent cannot mark Intrax live preview PASS from the present evidence. The current frontend deliberately retains the pending state and fallback.

### 6. Rollback

If private-route protections regress or rendering/security checks fail, disable the TELLU Intrax live flag and retain the screenshot. Coordinate with anyone who may have changed the vhost since the backup; do not overwrite unrelated concurrent edits.

If the saved file is still the correct complete rollback target:

```sh
sudo cp -a -- "$backup_dir/intrax.web.id" /etc/nginx/sites-available/intrax.web.id
sudo nginx -t
# Reload only when validation succeeds:
sudo systemctl reload nginx
curl -sS -I https://intrax.web.id/
```

Restore any approved application header/route changes using their own recorded backups. Verify `SAMEORIGIN`, `nosniff`, routing, TLS, and other applications again. Do not delete application files, move Intrax, restart PHP-FPM, or change the firewall as a rollback shortcut.

## Future HTTPS TELLU domain

No production TELLU domain is invented here. Once its exact HTTPS origin is supplied, update only the approved public response's allowlist, test in real browsers, then remove the temporary HTTP/IP origin when migration is complete. Recheck redirects and any nested ancestors. Keep private framing restrictions and HTTPS protections intact.

## Primary references

- [Nginx response headers and inheritance](https://nginx.org/en/docs/http/ngx_http_headers_module.html#add_header)
- [Nginx locations and internal redirects](https://nginx.org/en/docs/http/ngx_http_core_module.html#location)
- [Nginx FastCGI response header handling](https://nginx.org/en/docs/http/ngx_http_fastcgi_module.html#fastcgi_hide_header)
- [W3C CSP frame-ancestors](https://w3c.github.io/webappsec-csp/#directive-frame-ancestors)
- [HTML standard: X-Frame-Options interaction](https://html.spec.whatwg.org/multipage/document-lifecycle.html#the-x-frame-options-header)
