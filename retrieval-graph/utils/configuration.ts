/**
 * Define the configurable parameters for the agent.
 */

import { RunnableConfig } from "@langchain/core/runnables";

export interface IndexConfiguration {
  embeddingModelName: string;
  searchKwargs: Record<string, any>;
  userId: string;
}

export function ensureIndexConfigurable(
  config: RunnableConfig | undefined = undefined,
): IndexConfiguration {
  // Ensure the defaults are populated.
  const configurable = (config?.configurable || {}) as Record<string, any>;
  return {
    userId: configurable.userId,
    embeddingModelName:
      configurable.embeddingModelName || "text-embedding-3-small",
    searchKwargs: configurable.searchKwargs || {},
  };
}

interface Configuration extends IndexConfiguration {
  responseSystemPrompt: string;
  responseModelName: string;
  querySystemPrompt: string;
  queryModelName: string;
  threadId: string;
}

export function ensureConfigurable(
  config: RunnableConfig | undefined = undefined,
): Configuration {
  // Ensure the defaults are populated.
  const configurable = (config?.configurable || {}) as Record<string, any>;
  return {
    userId: configurable.userId,
    threadId: configurable.threadId,
    responseSystemPrompt:
      configurable.responseSystemPrompt ||
      "You are a helpful AI assistant. Answer the user's questions based on the retrieved documents." +
        "\n\n{retrievedDocs}" +
        "\n\nSystem time: {systemTime}",
    responseModelName:
      configurable.responseModelName || "claude-3-5-sonnet-20240620",
    querySystemPrompt:
      configurable.querySystemPrompt ||
      "Generate search queries to retrieve documents that may help answer the user's question." +
        "\n\nPreviously, you made the following queries:<previousQueries/>" +
        "\n{queries}\n<\\previousQueries/>\n\nSystem time: {systemTime}",
    queryModelName:
      configurable.queryModelName ||
      "accounts/fireworks/models/firefunction-v2",
    // In general, you could make these things nested configs and load from a file to get the
    // defaults. But for now, we'll keep it simple.
    embeddingModelName:
      configurable.embeddingModelName || "text-embedding-3-small",
    searchKwargs: configurable.searchKwargs || {},
  };
}
