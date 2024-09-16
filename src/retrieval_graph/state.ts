import { Document } from "@langchain/core/documents";
import { BaseMessage } from "@langchain/core/messages";
import { Annotation, messagesStateReducer } from "@langchain/langgraph";
import { v4 as uuidv4 } from "uuid";
/**
 * Reduces the document array based on the provided new documents or actions.
 *
 * @param existing - The existing array of documents.
 * @param newDocs - The new documents or actions to apply.
 * @returns The updated array of documents.
 */
export function reduceDocs(
  existing?: Document[],
  newDocs?:
    | Document[]
    | { [key: string]: any }[]
    | string[]
    | string
    | "delete",
) {
  // Supports deletion by returning an empty array when "delete" is specified
  if (newDocs === "delete") {
    return [];
  }
  // Supports adding a single string document
  if (typeof newDocs === "string") {
    return [{ pageContent: newDocs, metadata: { id: uuidv4() } }];
  }
  // User can provide "docs" content in a few different ways
  if (Array.isArray(newDocs)) {
    const coerced: Document[] = [];
    for (const item of newDocs) {
      if (typeof item === "string") {
        coerced.push({ pageContent: item, metadata: { id: uuidv4() } });
      } else if (typeof item === "object") {
        const doc = item as Document;
        if (!doc.metadata || !doc.metadata.id) {
          doc.metadata = doc.metadata || {};
          doc.metadata.id = uuidv4();
        }
        coerced.push(doc);
      }
    }
    return coerced;
  }
  // Returns existing documents if no valid update is provided
  return existing || [];
}

/**
 * Defines the structure and behavior of the index state.
 * This state is used to manage the documents in the index.
 */
export const IndexState = Annotation.Root({
  /**
   * Stores the documents in the index.
   * @type {Document[]}
   * @reducer reduceDocs - Handles updates to the documents array, including adding new documents.
   * @default An empty array.
   */
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
  /**
   * Stores the conversation messages.
   * @type {BaseMessage[]}
   * @reducer messagesStateReducer - Handles updates to the messages array.
   * @default An empty array.
   */
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),

  /**
   * Stores the user queries.
   * @type {string[]}
   * @reducer addQueries - Handles adding new queries to the existing ones.
   * @default An empty array.
   */
  queries: Annotation<string[]>({ reducer: addQueries, default: () => [] }),

  /**
   * Stores the retrieved documents.
   * @type {Document[]}
   */
  retrievedDocs: Annotation<Document[]>,
});

export type StateT = typeof State.State;
