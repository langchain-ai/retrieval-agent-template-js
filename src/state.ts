import { BaseMessage } from "@langchain/core/messages";
import { RunnableConfig } from "@langchain/core/runnables";
import { Annotation } from "@langchain/langgraph";
import { messagesStateReducer } from "@langchain/langgraph";
import { v4 as uuidv4 } from "uuid";
import { Client } from "@elastic/elasticsearch";
import { OpenAIEmbeddings } from "@langchain/openai";
import { ElasticVectorSearch } from "@langchain/community/vectorstores/elasticsearch";
import { VectorStoreRetriever } from "@langchain/core/vectorstores";
import { Document } from "@langchain/core/documents";
import { ensureConfigurable } from "./configuration.js";

export function reduceDocs(
  existing?: Document[],
  newDocs?:
    | Document[]
    | { [key: string]: any }[]
    | string[]
    | string
    | "delete",
) {
  if (newDocs === "delete") {
    return [];
  }
  if (typeof newDocs === "string") {
    return [{ pageContent: newDocs, metadata: { id: uuidv4() } }];
  }
  if (Array.isArray(newDocs)) {
    const coerced: Document[] = [];
    for (const item of newDocs) {
      if (typeof item === "string") {
        coerced.push({ pageContent: item, metadata: { id: uuidv4() } });
      } else if (typeof item === "object") {
        coerced.push(item as Document);
      }
    }
    return coerced;
  }
  return existing || [];
}

export async function makeRetriever(
  config: RunnableConfig,
): Promise<VectorStoreRetriever> {
  const configuration = ensureConfigurable(config);
  const embeddingModel = new OpenAIEmbeddings({
    model: configuration.embeddingModelName,
  });

  const userId = configuration.userId;
  if (!userId) {
    throw new Error("Please provide a valid user_id in the configuration.");
  }

  const client = new Client({
    node: process.env.ELASTICSEARCH_URL,
    auth: {
      apiKey: process.env.ELASTICSEARCH_API_KEY || "",
    },
  });

  const vectorStore = new ElasticVectorSearch(embeddingModel, {
    client,
    indexName: "langchain_index",
  });

  const searchKwargs = configuration.searchKwargs || {};
  searchKwargs.filter = searchKwargs.filter || [];
  searchKwargs.filter.push({ term: { "metadata.user_id": userId } });

  return vectorStore.asRetriever({ searchKwargs });
}

export const IndexState = Annotation.Root({
  docs: Annotation<Document[], Document[] | string | string[]>({
    reducer: reduceDocs,
    default: () => [],
  }),
});
export type IndexStateT = typeof IndexState.State;
export function addQueries(existing: string[], newQueries: string[]): string[] {
  return [...existing, ...newQueries];
}

/**
 * The State defines three things:
 * 1. The structure of the graph's state (which "channels" are available to read/write)
 * 2. The default values for the state's channels
 * 3. The reducers for the state's channels. Reducers are functions that determine how to apply updates to the state.
 * See [Reducers](https://langchain-ai.github.io/langgraphjs/concepts/low_level/#reducers) for more information.
 */
export const State = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  queries: Annotation<string[]>({ reducer: addQueries, default: () => [] }),
  retrievedDocs: Annotation<Document[]>,
});

export type StateT = typeof State.State;
