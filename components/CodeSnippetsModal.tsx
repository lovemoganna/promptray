import React, { useState } from 'react';
import { Icons } from './Icons';
import { Example, PromptConfig } from '../types';
import { CodeBlock } from './CodeBlock';

interface CodeSnippetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawPrompt: string;
  systemInstruction?: string;
  examples?: Example[];
  config: PromptConfig;
  detectedVariables: string[];
  variableValues: Record<string, string>;
}

export const CodeSnippetsModal: React.FC<CodeSnippetsModalProps> = ({
  isOpen,
  onClose,
  rawPrompt,
  systemInstruction,
  examples,
  config,
  detectedVariables,
  variableValues,
}) => {
  const [activeLang, setActiveLang] = useState<'curl' | 'js' | 'python' | 'json'>('curl');
  const [injectData, setInjectData] = useState(false);

  const getProcessedText = (text: string) => {
    if (!injectData) return text;
    let result = text;
    detectedVariables.forEach((v) => {
      if (variableValues[v]) {
        result = result.split(`{${v}}`).join(variableValues[v]);
      }
    });
    return result;
  };

  const promptText = getProcessedText(rawPrompt);
  const processedExamples = examples?.map((ex) => ({
    input: getProcessedText(ex.input),
    output: ex.output,
  }));

  const safePrompt = promptText.replace(/"/g, '\\"').replace(/\n/g, '\\n');
  const safeSystem = systemInstruction
    ? getProcessedText(systemInstruction).replace(/"/g, '\\"').replace(/\n/g, '\\n')
    : undefined;

  const constructContentsJson = () => {
    const parts: string[] = [];
    if (processedExamples) {
      processedExamples.forEach((ex) => {
        if (ex.input)
          parts.push(
            `{"role": "user", "parts": [{"text": "${ex.input
              .replace(/"/g, '\\"')
              .replace(/\n/g, '\\n')}"}]}`,
          );
        if (ex.output)
          parts.push(
            `{"role": "model", "parts": [{"text": "${ex.output
              .replace(/"/g, '\\"')
              .replace(/\n/g, '\\n')}"}]}`,
          );
      });
    }
    parts.push(`{"role": "user", "parts": [{"text": "${safePrompt}"}]}`);
    return parts.join(',\n    ');
  };

  const snippets = {
    curl: `curl "https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=$API_KEY" \\
-H 'Content-Type: application/json' \\
-d '{
  "contents": [
    ${constructContentsJson()}
  ],
  "generationConfig": {
    "temperature": ${config.temperature},
    "maxOutputTokens": ${config.maxOutputTokens},
    "topP": ${config.topP || 0.95},
    "topK": ${config.topK || 64}
  }${
    safeSystem
      ? `,\n  "systemInstruction": {
    "parts": [{"text": "${safeSystem}"}]
  }`
      : ''
  }
}'`,
    js: `import { GoogleGenerativeAI } from "@google/generative-ai";

const ai = new GoogleGenerativeAI(process.env.API_KEY);

const contents = [
${processedExamples
  ?.map(
    (ex) =>
      `  { role: 'user', parts: [{ text: \`${ex.input.replace(/`/g, '\\`')}\` }] },
  { role: 'model', parts: [{ text: \`${ex.output.replace(/`/g, '\\`')}\` }] },`,
  )
  .join('\n') || ''}
  { role: 'user', parts: [{ text: \`${promptText.replace(/`/g, '\\`')}\` }] }
];

const response = await ai.models.generateContent({
  model: '${config.model}',
  contents: contents,
  config: {
    temperature: ${config.temperature},
    maxOutputTokens: ${config.maxOutputTokens},
    topP: ${config.topP || 0.95},
    topK: ${config.topK || 64},${
      safeSystem ? `\n    systemInstruction: \`${safeSystem}\`,` : ''
    }
  },
});

console.log(response.text);`,
    python: `import os
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ["API_KEY"])

contents = [
${processedExamples
  ?.map(
    (ex) =>
      `    types.Content(role="user", parts=[types.Part.from_text("""${ex.input}""")]),
    types.Content(role="model", parts=[types.Part.from_text("""${ex.output}""")]),`,
  )
  .join('\n') || ''}
    types.Content(role="user", parts=[types.Part.from_text("""${promptText}""")])
]

response = client.models.generate_content(
    model="${config.model}",
    contents=contents,
    config=types.GenerateContentConfig(
        temperature=${config.temperature},
        max_output_tokens=${config.maxOutputTokens},
        top_p=${config.topP || 0.95},
        top_k=${config.topK || 64},${
          safeSystem ? `\n        system_instruction="""${safeSystem}""","` : ''
        }
    )
)

print(response.text)`,
    json: `{
  "model": "${config.model}",
  "contents": [
    ${constructContentsJson()}
  ],
  "generationConfig": {
    "temperature": ${config.temperature},
    "maxOutputTokens": ${config.maxOutputTokens},
    "topP": ${config.topP || 0.95},
    "topK": ${config.topK || 64}
  }${
    safeSystem
      ? `,\n  "systemInstruction": {
    "parts": [{"text": "${safeSystem}"}]
  }`
      : ''
  }
}`,
  } as const;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-6 sm:p-8 animate-fade-in">
      <div className="relative bg-gradient-to-br from-gray-900 to-gray-950 w-full max-w-[96vw] lg:max-w-6xl 2xl:max-w-[1500px] rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-slide-up-fade max-h-[88vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-gray-900/60">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Icons.Code size={16} className="text-brand-500" /> Developer Snippets
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <Icons.Close size={16} />
          </button>
        </div>
        <div className="flex items-center justify-between border-b border-white/5 bg-gray-900/40">
          <div className="flex">
            {(['curl', 'js', 'python', 'json'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setActiveLang(lang)}
                className={`px-4 py-2 text-xs font-mono uppercase tracking-wider transition-colors border-b-2 ${
                  activeLang === lang
                    ? 'border-brand-500 text-white bg-white/5'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                {lang === 'js' ? 'Node.js' : lang.toUpperCase()}
              </button>
            ))}
          </div>
          {detectedVariables.length > 0 && (
            <label className="flex items-center gap-2 px-4 py-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={injectData}
                onChange={(e) => setInjectData(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-gray-600 bg-gray-800 text-brand-500 focus:ring-offset-gray-900 focus:ring-brand-500"
              />
              <span
                className={`text-xs uppercase font-semibold tracking-wider transition-colors ${
                  injectData
                    ? 'text-brand-500'
                    : 'text-gray-500 group-hover:text-gray-400'
                }`}
              >
                Inject Test Data
              </span>
            </label>
          )}
        </div>
        <div className="p-0 overflow-hidden bg-[#050608]">
          <CodeBlock
            language={
              activeLang === 'curl'
                ? 'bash'
                : activeLang === 'js'
                ? 'javascript'
                : activeLang === 'python'
                ? 'python'
                : 'json'
            }
            code={snippets[activeLang]}
          />
        </div>
      </div>
    </div>
  );
};


