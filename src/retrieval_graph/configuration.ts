/**
 * Define the configurable parameters for the agent.
 */

import { RunnableConfig } from "@langchain/core/runnables";
import { RESPONSE_SYSTEM_PROMPT, QUERY_SYSTEM_PROMPT } from "./prompts.js";

/**
 * Configuration class for indexing and retrieval operations.
 *
 * This interface defines the parameters needed for configuring the indexing and
 * retrieval processes, including user identification, embedding model selection,
 * retriever provider choice, and search parameters.
 */
export interface IndexConfiguration {
  /**
   * Unique identifier for the user.
   */
  userId: string;

  /**
   * Name of the embedding model to use. Must be a valid embedding model name.
   */
  embeddingModel: string;

  /**
   * The vector store provider to use for retrieval.
   * Options are 'elastic', 'elastic-local', 'pinecone', or 'mongodb'.
   */
  retrieverProvider: "elastic" | "elastic-local" | "pinecone" | "mongodb";

  /**
   * Additional keyword arguments to pass to the search function of the retriever.
   */
  searchKwargs: Record<string, any>;
}

/**
 * Create an IndexConfiguration instance from a RunnableConfig object.
 *
 * @param config - The configuration object to use.
 * @returns An instance of IndexConfiguration with the specified configuration.
 */
export function ensureIndexConfiguration(
  config: RunnableConfig | undefined = undefined,
): IndexConfiguration {
  const configurable = (config?.configurable ||
    {}) as Partial<IndexConfiguration>;
  return {
    userId: configurable.userId || "default", // Give a default user for shared docs
    embeddingModel:
      configurable.embeddingModel || "openai/text-embedding-3-small",
    retrieverProvider: configurable.retrieverProvider || "elastic",
    searchKwargs: configurable.searchKwargs || {},
  };
}

/**
 * The complete configuration for the agent.
 */
export interface Configuration extends IndexConfiguration {
  /**
   * The system prompt used for generating responses.
   */
  responseSystemPrompt: string;

  /**
   * The language model used for generating responses. Should be in the form: provider/model-name.
   */
  responseModel: string;

  /**
   * The system prompt used for processing and refining queries.
   */
  querySystemPrompt: string;

  /**
   * The language model used for processing and refining queries. Should be in the form: provider/model-name.
   */
  queryModel: string;
}

/**
 * Create a Configuration instance from a RunnableConfig object.
 *
 * @param config - The configuration object to use.
 * @returns An instance of Configuration with the specified configuration.
 */
export function ensureConfiguration(
  config: RunnableConfig | undefined = undefined,
): Configuration {
  const indexConfig = ensureIndexConfiguration(config);
  const configurable = (config?.configurable || {}) as Partial<Configuration>;

  return {
    ...indexConfig,
    responseSystemPrompt:
      configurable.responseSystemPrompt || RESPONSE_SYSTEM_PROMPT,
    responseModel:
      configurable.responseModel || "anthropic/claude-3-5-sonnet-20240620",
    querySystemPrompt: configurable.querySystemPrompt || QUERY_SYSTEM_PROMPT,
    queryModel: configurable.queryModel || "openai/gpt-4o-mini",
  };
}
