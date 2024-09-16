/**
 * This "graph" simply exposes an endpoint for a user to upload docs to be indexed.
 */

import { Document } from "@langchain/core/documents";
import { RunnableConfig } from "@langchain/core/runnables";
import { StateGraph } from "@langchain/langgraph";

import { IndexStateAnnotation, IndexState } from "./state.js";
import { makeRetriever } from "./retrieval.js";

function ensureDocsHaveUserId(
  docs: Document[],
  config: RunnableConfig,
): Document[] {
  const userId = config?.configurable?.user_id;
  return docs.map((doc) => {
    return new Document({
      pageContent: doc.pageContent,
      metadata: { ...doc.metadata, user_id: userId },
    });
  });
}

async function indexDocs(
  state: IndexState,
  config?: RunnableConfig,
): Promise<{ docs: string }> {
  if (!config) {
    throw new Error("Configuration required to run index_docs.");
  }
  const docs = state.docs;
  const retriever = await makeRetriever(config);
  const stampedDocs = ensureDocsHaveUserId(docs, config);

  await retriever.addDocuments(stampedDocs);
  return { docs: "delete" };
}

// Define a new graph

const builder = new StateGraph(IndexStateAnnotation)
  .addNode("indexDocs", indexDocs)
  .addEdge("__start__", "indexDocs");

// Finally, we compile it!
// This compiles it into a graph you can invoke and deploy.
export const graph = builder.compile();