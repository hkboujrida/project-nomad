import * as assert from 'node:assert/strict'
import { test } from 'node:test'

import { resolveServiceHost, templateServiceUrl } from '../../app/utils/service_endpoints.js'

test('service host: stock behaviour without override', () => {
  assert.equal(resolveServiceHost('nomad_ollama', { nodeEnv: 'production' }), 'nomad_ollama')
  assert.equal(resolveServiceHost('nomad_ollama', { nodeEnv: 'development' }), 'localhost')
})

test('service host: NOMAD_SERVICE_HOST wins in production (DinD sidecar)', () => {
  assert.equal(
    resolveServiceHost('nomad_qdrant', { nodeEnv: 'production', serviceHostOverride: 'localhost' }),
    'localhost'
  )
  assert.equal(
    resolveServiceHost('nomad_qdrant', { nodeEnv: 'production', serviceHostOverride: '  ' }),
    'nomad_qdrant'
  )
})

const TPL = 'https://nomad-{name}.priv.example.eu'

test('url template: plain port → named hostname', () => {
  assert.equal(
    templateServiceUrl('nomad_kiwix_server', '8090', TPL),
    'https://nomad-kiwix-server.priv.example.eu'
  )
  assert.equal(
    templateServiceUrl('nomad_it_tools', '8430', 'http://box.lan:{port}'),
    'http://box.lan:8430'
  )
})

test('url template: no template, paths and self-TLS ports keep stock behaviour', () => {
  assert.equal(templateServiceUrl('nomad_kiwix_server', '8090', undefined), null)
  assert.equal(templateServiceUrl('nomad_kiwix_server', '8090', ''), null)
  assert.equal(templateServiceUrl('nomad_ollama', '/chat', TPL), null)
  assert.equal(templateServiceUrl('nomad_vaultwarden', 'https:8480', TPL), null)
  assert.equal(templateServiceUrl('nomad_kiwix_server', null, TPL), null)
})

test('url template: rejects templates that do not yield an http(s) URL', () => {
  assert.equal(templateServiceUrl('nomad_kiwix_server', '8090', 'not a url {name}'), null)
  assert.equal(templateServiceUrl('nomad_kiwix_server', '8090', 'javascript:{name}'), null)
})
