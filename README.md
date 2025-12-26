<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# CI status

# [![CI](https://github.com/lovemoganna/promptray/actions/workflows/ci.yml/badge.svg)](https://github.com/lovemoganna/promptray/actions/workflows/ci.yml)

# Prompt Ray — Prompt authoring & metadata toolbox

Prompt Ray is an interactive prompt authoring tool and UI designed to help users create, edit, and manage AI prompts (text, image, audio, video). It integrates with large-model services (Gemini / other providers) to provide:

- Structured prompt metadata (category, output type, application scene, usage notes, cautions, recommended models)  
- Prompt-perspective extraction (intent, target audience, constraints) via model-based generation with heuristic fallback  
- Tagging, media preview, bilingual prompt support (Chinese/English), system persona editing, examples and saved runs  
- Local testing utilities and CI-ready test suite

This repository contains the full frontend app, services wrappers for model calls, and automated tests.

## Run Locally

**Prerequisites:** Node.js 18+ (Node 20 recommended) and npm

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a local env file and set your Gemini API key:
   ```bash
   # .env.local
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
3. Run the app in development:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

5. Preview the production build:
   ```bash
   npm run preview
   ```

View your app in AI Studio (if applicable): `https://ai.studio/apps/drive/...`

## Testing

Run unit tests (Jest + React Testing Library):

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

Notes:
- Tests use `ts-jest` and `jsdom` environment. Ensure devDependencies are installed (`npm ci` on CI).

## Project structure (high level)

- `src/components` — React UI components (prompt modal, meta panel, tags, etc.)  
- `src/services` — Model/service wrappers (Gemini integration, metadata/tag generation)  
- `src/types.ts` — Shared TypeScript types (Prompt, PromptFormData, metadata schema)  
- `components/promptModal/__tests__` — Unit tests for prompt modal components  
- `.github/workflows/ci.yml` — CI workflow to run tests on push/PR

## How the auto-metadata works

1. Primary: call `generatePromptMetadata` in `services/geminiService.ts` to request JSON-formatted metadata (model returns category/outputType/applicationScene/usageNotes/cautions/recommendedModels and optional extracted intent/audience/constraints).  
2. Fallback: if model call fails, the UI uses local heuristic extraction implemented in `usePromptMetaAndTags.ts` to infer category, output type, scene, and simple extracted perspective fields.  
3. Results are written into `formData.extracted` and other prompt fields, and are editable in the UI (`PromptMetaPanel`).

## Contribution

Contributions are welcome. Suggested workflow:

1. Fork the repo and create a feature branch.  
2. Run tests locally (`npm ci && npm test`).  
3. Open a pull request with a clear description and testing notes.

## CI / GitHub Actions

The repository includes a GitHub Actions workflow at `.github/workflows/ci.yml` that runs `npm ci` and `npm test` for pushes and PRs to `main`/`master`. The CI badge above links to this workflow for `lovemoganna/promptray`.

## License

This project is provided under the MIT License. Update the LICENSE file as needed.

## Model Provider & Model Name Configuration

This project supports selecting the model provider (platform) and the specific model to use for AI-powered features.

Where to configure
- Global UI: Open any Prompt modal and use the model selector in the top-right (齿轮 icon to open full settings).
- Settings modal: `Settings → Model Settings` or click the gear to open the modal.
- Environment variables (fallback): `GEMINI_API_KEY`, `OPENAI_API_KEY` or `GROQ_API_KEY`. Use env override for CI/servers.

Priority (highest → lowest)
1. Per-request override (passed programmatically via `onAutoMetadata({ provider, model })`)
2. Global UI selection (persisted in `localStorage` keys: `prompt_model_provider`, `prompt_model_name`)
3. Environment variables and server configuration

Providers and models
- `gemini` (Google Gemini): default models e.g. `gemini-3-flash-preview`
- `groq` (OpenAI/Groq): default model e.g. `openai/gpt-oss-120b`
- `openai` (future): e.g. `gpt-4o`

Reproducibility
- Each saved prompt includes `config.modelProvider` and `config.modelName` so others can reproduce results.

Troubleshooting
- If a provider call fails, the app will attempt fallback (Auto mode: Gemini → Groq).
- Check localStorage keys or the saved prompt's `config` to see what was used.
