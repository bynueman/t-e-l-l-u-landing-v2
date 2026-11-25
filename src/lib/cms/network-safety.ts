export interface AdminNetworkCheck {
  allowed: boolean;
  isHttps: boolean;
  reason?: string;
}

function parseHttpsOrigin(raw: string | undefined): URL | null {
  if (!raw) return null;
  try {
    const parsed = new URL(raw.trim());
    if (parsed.protocol !== "https:") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function evaluateAdminNetworkPolicy(params: {
  nodeEnv: string | undefined;
  forceProdCheck?: boolean;
  adminEnabled?: string;
  adminOrigin?: string;
  trustProxy?: string;
  requestUrl?: string;
  forwardedProto?: string | null;
  hostHeader?: string | null;
}): AdminNetworkCheck {
  const isProduction = params.nodeEnv === "production" || params.forceProdCheck === true;

  if (!isProduction) {
    return { allowed: true, isHttps: false };
  }

  // Production fails closed unless explicitly enabled with a valid HTTPS origin
  if (params.adminEnabled !== "true") {
    return {
      allowed: false,
      isHttps: false,
      reason: "Akses panel admin produksi belum diaktifkan (TELLU_ADMIN_ENABLED !== 'true').",
    };
  }

  const allowedOrigin = parseHttpsOrigin(params.adminOrigin);
  if (!allowedOrigin) {
    return {
      allowed: false,
      isHttps: false,
      reason: "TELLU_ADMIN_ORIGIN dengan skema https:// wajib dikonfigurasi untuk produksi.",
    };
  }

  // Check transport security without blindly trusting client headers
  let isHttps = false;
  let matchesHost = false;

  if (params.requestUrl) {
    try {
      const reqUrl = new URL(params.requestUrl);
      if (reqUrl.protocol === "https:") {
        isHttps = true;
      }
      if (reqUrl.host === allowedOrigin.host) {
        matchesHost = true;
      }
    } catch {
      // ignore invalid URL
    }
  }

  if (params.trustProxy === "true") {
    const proto = params.forwardedProto?.split(",")[0]?.trim().toLowerCase();
    const host = params.hostHeader?.split(",")[0]?.trim().toLowerCase();
    if (proto === "https") {
      isHttps = true;
    }
    if (host && host === allowedOrigin.host.toLowerCase()) {
      matchesHost = true;
    }
  }

  if (!isHttps || !matchesHost) {
    return {
      allowed: false,
      isHttps: false,
      reason: "Panel admin hanya dapat diakses melalui domain HTTPS resmi yang terkonfigurasi.",
    };
  }

  return { allowed: true, isHttps: true };
}

export function verifyMutationOrigin(request: Request): boolean {
  const originHeader = request.headers.get("origin");
  const refererHeader = request.headers.get("referer");
  const candidate = originHeader || refererHeader;

  // Same-origin non-browser CLI/tests may omit Origin only in non-production when no browser cookie CSRF applies,
  // or require valid origin in browser requests.
  if (!candidate) {
    return process.env.NODE_ENV !== "production";
  }

  let parsedOrigin: string;
  try {
    parsedOrigin = new URL(candidate).origin;
  } catch {
    return false;
  }

  const configuredOrigin = parseHttpsOrigin(process.env.TELLU_ADMIN_ORIGIN);
  if (process.env.NODE_ENV === "production") {
    return Boolean(configuredOrigin && parsedOrigin === configuredOrigin.origin);
  }

  try {
    const reqOrigin = new URL(request.url).origin;
    if (parsedOrigin === reqOrigin) return true;
  } catch {
    // fallback host check
  }

  const host = request.headers.get("host");
  if (host) {
    if (parsedOrigin === `http://${host}` || parsedOrigin === `https://${host}`) {
      return true;
    }
  }

  return false;
}
