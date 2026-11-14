/**
 * Endpoint overrides for running NOMAD outside its stock Docker Compose layout,
 * e.g. on Kubernetes with a Docker-in-Docker sidecar in the admin pod.
 *
 * Kept pure (env passed in) so they can be unit-tested without booting Adonis.
 */

/**
 * Host the admin uses to reach a child app it started.
 *
 * Stock compose: the admin shares the `project-nomad_default` network with the
 * children and reaches them by container name. In a pod with a DinD sidecar the
 * children publish their ports into the pod's network namespace instead, so the
 * admin must dial `localhost`. `NOMAD_SERVICE_HOST` selects that.
 */
export function resolveServiceHost(
  serviceName: string,
  opts: { nodeEnv?: string; serviceHostOverride?: string | null }
): string {
  const override = opts.serviceHostOverride?.trim()
  if (override) return override
  return opts.nodeEnv === 'production' ? serviceName : 'localhost'
}

/**
 * Browser-facing URL for a curated child app, built from `NOMAD_SERVICE_URL_TEMPLATE`.
 *
 * The stock UI links to `http://<current host>:<port>`, which only works when the
 * browser can reach the box's ports directly. Behind a reverse proxy / ingress each
 * app gets its own hostname instead; the template describes that hostname.
 *
 * Placeholders:
 *   {name} — service_name without the `nomad_` prefix, `_` → `-` (nomad_kiwix_server → kiwix-server)
 *   {port} — the published host port from ui_location (8090)
 *
 * Only plain-port ui_locations are templated. Paths (`/chat`) are served by the
 * admin itself, and `https:<port>` apps terminate their own TLS, so a plain HTTP
 * route would not reach them — those keep the stock behaviour.
 *
 * Returns null when no template applies.
 */
export function templateServiceUrl(
  serviceName: string,
  uiLocation: string | null | undefined,
  template: string | null | undefined
): string | null {
  const tpl = template?.trim()
  if (!tpl || !uiLocation) return null
  if (!/^\d+$/.test(uiLocation.trim())) return null

  const name = serviceName
    .replace(/^nomad_/, '')
    .replace(/_/g, '-')
    .toLowerCase()
  const url = tpl.replaceAll('{name}', name).replaceAll('{port}', uiLocation.trim())
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
    return parsed.href.replace(/\/$/, '')
  } catch {
    return null
  }
}
