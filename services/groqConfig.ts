export const getGroqApiKey = (): string => {
  const openaiKey = (process.env.OPENAI_API_KEY || '').trim();
  const groqKey = (process.env.GROQ_API_KEY || '').trim();
  const key = (openaiKey || groqKey || '').trim();

  return key;
};

export const isGroqApiKeyAvailable = (): boolean => {
  return getGroqApiKey().length > 0;
};

export const getGroqMissingKeyMessage = (): string => {
  const hasOpenAI = !!(process.env.OPENAI_API_KEY || '').trim();
  const hasGroq = !!(process.env.GROQ_API_KEY || '').trim();

  let message = 'Groq/OpenAI OSS API Key is missing. ';

  if (hasOpenAI) {
    message += 'OPENAI_API_KEY is set. ';
  }
  if (hasGroq) {
    message += 'GROQ_API_KEY is set. ';
  }
  if (!hasOpenAI && !hasGroq) {
    message += 'Please set OPENAI_API_KEY or GROQ_API_KEY in your .env.local file. ';
  }

  // Add debug info
  const debugInfo = (process.env.DEBUG_API_KEYS as any);
  if (debugInfo) {
    message += `Debug: ${JSON.stringify(debugInfo)}`;
  }

  return message;
};

// Debug function to check environment variables
export const debugEnvironmentVariables = () => {
  console.log('🔍 Environment Variable Debug:');
  console.log('OPENAI_API_KEY exists:', !!(process.env.OPENAI_API_KEY || '').trim());
  console.log('GROQ_API_KEY exists:', !!(process.env.GROQ_API_KEY || '').trim());
  console.log('OPENAI_API_KEY length:', (process.env.OPENAI_API_KEY || '').length);
  console.log('GROQ_API_KEY length:', (process.env.GROQ_API_KEY || '').length);

  const debugInfo = (process.env.DEBUG_API_KEYS as any);
  if (debugInfo) {
    console.log('Vite env debug:', debugInfo);
  }

  // Check all env vars that might contain API keys
  const apiKeys = Object.keys(process.env).filter(k =>
    k.toLowerCase().includes('api') || k.toLowerCase().includes('key')
  );
  console.log('All API-related env vars:', apiKeys);
};


