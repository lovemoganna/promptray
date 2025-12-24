<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# CI status

# [![CI](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/ci.yml)

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

The repository includes a GitHub Actions workflow at `.github/workflows/ci.yml` that runs `npm ci` and `npm test` for pushes and PRs to `main`/`master`. Replace the badge `OWNER/REPO` in the top section with your repository information to enable the status badge:

```
[![CI](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/ci.yml)
```

## License

This project is provided under the MIT License. Update the LICENSE file as needed.
