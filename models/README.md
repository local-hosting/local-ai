# Composer GGUF weights (`local-ai/models/`)

Files are **gitignored**; use `uri` in [`MANIFEST.json`](./MANIFEST.json) (canonical `filename` on disk). Qwen3 *-instruct* names map to bartowski **Qwen3** base GGUFs (post-trained instruct; same weights Qwen ships for edge).

**Swap model (no code edits):**

```bash
# Runtime / boot — picks MANIFEST entry + GGUF path + llama alias
export LOCAL_AI_COMPOSE_MODEL=qwen2.5-1.5b-instruct
yarn workspace @local-hosting/local-ai resolve:composer          # path
yarn workspace @local-hosting/local-ai resolve:composer --field alias

# Or pin in MANIFEST.json: chosen_composer / fallback_composer
```

Current defaults (see [compose-model-eval.md](../../docs/compose-model-eval.md)): **chosen** `qwen3-0.6b-instruct`, **fallback** `qwen2.5-1.5b-instruct`.

## Download (rename to manifest `filename`)

```bash
cd local-ai/models

curl -fL \
  'https://huggingface.co/bartowski/Qwen_Qwen3-0.6B-GGUF/resolve/main/Qwen_Qwen3-0.6B-Q4_K_M.gguf' \
  -o qwen3-0.6b-instruct-q4_k_m.gguf

curl -fL \
  'https://huggingface.co/bartowski/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/Qwen2.5-1.5B-Instruct-Q4_K_M.gguf' \
  -o qwen2.5-1.5b-instruct-q4_k_m.gguf

curl -fL \
  'https://huggingface.co/lmstudio-community/gemma-2-2b-it-GGUF/resolve/main/gemma-2-2b-it-Q4_K_M.gguf' \
  -o gemma-2-2b-it-q4_k_m.gguf

curl -fL \
  'https://huggingface.co/bartowski/Qwen_Qwen3-1.7B-GGUF/resolve/main/Qwen_Qwen3-1.7B-Q4_K_M.gguf' \
  -o qwen3-1.7b-instruct-q4_k_m.gguf

curl -fL \
  'https://huggingface.co/bartowski/Qwen_Qwen3-8B-GGUF/resolve/main/Qwen_Qwen3-8B-Q4_K_M.gguf' \
  -o qwen3-8b-instruct-q4_k_m.gguf

curl -fL \
  'https://huggingface.co/lmstudio-community/gemma-4-E2B-it-GGUF/resolve/main/gemma-4-E2B-it-Q4_K_M.gguf' \
  -o gemma-4-e2b-q4_k_m.gguf
```

Or with the Hub CLI (still rename to manifest filenames):

```bash
huggingface-cli download bartowski/Qwen_Qwen3-0.6B-GGUF Qwen_Qwen3-0.6B-Q4_K_M.gguf --local-dir .
mv Qwen_Qwen3-0.6B-Q4_K_M.gguf qwen3-0.6b-instruct-q4_k_m.gguf
```

After download, run `shasum -a 256` on each file and compare to `MANIFEST.json` when promoting a model from `candidate` to `active`.

## Compose eval (`@local-hosting/spatial-ai`)

Eval model list is **derived from this MANIFEST** (no duplicate GGUF table in spatial-ai). See [`spatial-ai/docs/resilience-geo-eval.md`](../../spatial-ai/docs/resilience-geo-eval.md). Subset a run:

```bash
LOCAL_AI_EVAL_COMPOSE_MODELS=qwen3-0.6b-instruct,qwen3-1.7b-instruct \
  yarn workspace @local-hosting/spatial-ai eval:everyday-spatial:live
```
