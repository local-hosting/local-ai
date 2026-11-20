import { callLlamaCompose } from './llama-client.js'
import { rulesFallbackIntent } from './rules-fallback.js'
import { validateComposeOutput } from './validate-output.js'
import { maybeRulesOnly } from '../wrap/maybe-rules-only.js'
import type { ComposeIntent, ComposeRequest } from '../types/compose.js'
import {
  composerLlamaAlias,
  readManifest,
  resolveComposer,
} from '../manifest.js'
import { vocabularyTip } from '../vocab/symbol-table.js'

export type ComposeOptions = {
  llamaBaseUrl: string
  timeoutMs: number
  rulesOnlyForce?: boolean
  /**
   * Pin a MANIFEST composer by name (eval / A/B).
   * When omitted: `LOCAL_AI_COMPOSE_MODEL` → `chosen_composer` → active.
   */
  composerName?: string
}

export async function compose(
  req: ComposeRequest,
  options: ComposeOptions,
): Promise<ComposeIntent> {
  const t0 = Date.now()
  const early = maybeRulesOnly(req.vocab, req.event, {
    force: options.rulesOnlyForce,
  })
  if (early) return early

  let manifest
  try {
    manifest = readManifest()
  } catch {
    return rulesFallbackIntent(req.vocab, req.event, {
      latency_ms: Date.now() - t0,
    })
  }

  const model = resolveComposer(manifest, { name: options.composerName })
  if (!model) {
    return rulesFallbackIntent(req.vocab, req.event, {
      latency_ms: Date.now() - t0,
    })
  }

  const llama = await callLlamaCompose(req, model, {
    baseUrl: options.llamaBaseUrl,
    model: composerLlamaAlias(model),
    timeoutMs: options.timeoutMs,
  })

  if (!llama.ok) {
    return rulesFallbackIntent(req.vocab, req.event, {
      latency_ms: Date.now() - t0,
    })
  }

  const validation = validateComposeOutput(req.event, llama.per_actor)
  if (!validation.ok) {
    return rulesFallbackIntent(req.vocab, req.event, {
      latency_ms: Date.now() - t0,
    })
  }

  const latency_ms = Date.now() - t0
  return {
    event_id: req.event.event_id,
    event_ref: req.event.event_ref,
    per_actor: llama.per_actor.map((row) => ({
      ...row,
      place_ids: row.place_ids?.filter((id) => id !== '__none__'),
      resource_ids: row.resource_ids?.filter((id) => id !== '__none__'),
    })),
    source: 'model',
    model: {
      name: model.name,
      params: model.params,
      quant: model.quant,
      gguf_sha256: model.sha256,
      adapter: null,
    },
    vocab_version: req.vocab.vocab_version,
    vocab_tip: vocabularyTip(req.vocab),
    latency_ms,
  }
}