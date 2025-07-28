import { configDotenv } from "dotenv";

configDotenv({ path: ".env" });

const parseEnvToInt = (env: string | undefined, defaultValue: number) => {
  if (!env) return defaultValue;
  const value = parseInt(env);
  if (isNaN(value)) return defaultValue;
  return value;
};

export const OLLAMA_PROXY_PORT = parseEnvToInt(
  process.env.OLLAMA_PROXY_PORT,
  4000
);
export const OLLAMA_PROXY_REQUEST_TIMEOUT = parseEnvToInt(
  process.env.OLLAMA_PROXY_REQUEST_TIMEOUT,
  120000
);
export const OLLAMA_PROXY_REQUEST_BODY_LIMIT =
  process.env.OLLAMA_PROXY_REQUEST_BODY_LIMIT || "50mb";
export const OLLAMA_HOST = process.env.OLLAMA_HOST || "localhost";
export const OLLAMA_PORT = parseEnvToInt(process.env.OLLAMA_PORT, 11434);
