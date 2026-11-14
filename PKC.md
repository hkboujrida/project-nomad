# Project NOMAD on PKC (Kubernetes)

This fork's `pkc` branch runs NOMAD on a Talos/Kubernetes cluster instead of a single
Docker host. Manifests live in the PKC repo (`src/workloads/nomad`, `src/apps/nomad.yaml`).

## Why a fork

NOMAD's admin drives a Docker daemon to install its apps. On Kubernetes the admin pod
carries a Docker-in-Docker sidecar, which changes three things the stock code assumes:

| Env var | Default (stock) | PKC value | Why |
|---|---|---|---|
| `DOCKER_SOCKET_PATH` | `/var/run/docker.sock` | `/run/nomad-docker/docker.sock` | socket shared with the DinD sidecar through an emptyDir |
| `NOMAD_SERVICE_HOST` | container name (`nomad_kiwix_server`) | `localhost` | children publish ports into the pod's network namespace; the admin is not on their Docker network |
| `NOMAD_SERVICE_URL_TEMPLATE` | unset → `http://<host>:<port>` | `https://nomad-{name}.priv.exitthecloud.eu` | browsers reach apps through gateway hostnames, not raw ports |

All three are optional: unset, the image behaves exactly like upstream.
Code: `admin/app/utils/service_endpoints.ts` (+ `tests/unit/service_endpoints.spec.ts`).

## Image

`.github/workflows/build-pkc-image.yml` builds on every push to `pkc`:
`ghcr.io/hkboujrida/project-nomad:pkc-<version>-<sha>` and `:pkc-latest`.

## Syncing upstream

```bash
git fetch upstream
git checkout main && git merge --ff-only upstream/main && git push origin main
git checkout pkc && git rebase main && git push --force-with-lease origin pkc
```
Then bump the image tag in PKC `src/workloads/nomad/deployment.yaml`.
