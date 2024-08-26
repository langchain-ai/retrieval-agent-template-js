import { initChatModel } from "langchain/chat_models/universal";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableConfig } from "@langchain/core/runnables";
import { StateGraph } from "@langchain/langgraph";
import { ensureConfigurable } from "./utils/configuration.js";
import { makeRetriever, State, StateT } from "./utils/state.js";
import { formatDocs, getMessageText } from "./utils/utils.js";
import { z } from "zod";
// Define the function that calls the model

const SearchQuery = z.object({
  query: z.string().describe("Search the indexed documents for a query."),
});

async function generateQuery(
  state: StateT,
  config?: RunnableConfig,
): Promise<{ queries: string[] }> {
  const messages = state.messages;
  if (messages.length === 1) {
    // It's the first user question. We will use the input directly to search.
    const humanInput = getMessageText(messages[messages.length - 1]);
    return { queries: [humanInput] };
  } else {
    const configuration = ensureConfigurable(config);
    // Feel free to customize the prompt, model, and other logic!
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", configuration.querySystemPrompt],
      ["placeholder", "{messages}"],
    ]);
    const model = (
      await initChatModel(configuration.responseModelName)
    ).withStructuredOutput(SearchQuery);

    const messageValue = await prompt.invoke(
      {
        ...state,
        queries: (state.queries || []).join("\n- "),
        systemTime: new Date().toISOString(),
      },
      config,
    );
    const generated = await model.invoke(messageValue, config);
    return {
      queries: [generated.query],
    };
  }
}

async function retrieve(
  state: StateT,
  config: RunnableConfig,
): Promise<{ retrievedDocs: any[] }> {
  const query = state.queries[state.queries.length - 1];
  const retriever = await makeRetriever(config);
  const response = await retriever.invoke(query, config);
  return { retrievedDocs: response };
}

async function respond(state: StateT, config: RunnableConfig) {
  /**
   * Call the LLM powering our "agent".
   */
  const configuration = ensureConfigurable(config);
  // Feel free to customize the prompt, model, and other logic!
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", configuration.responseSystemPrompt],
    ["placeholder", "{messages}"],
  ]);
  const model = await initChatModel(configuration.responseModelName);

  const retrievedDocs = formatDocs(state.retrievedDocs);
  const messageValue = await prompt.invoke(
    {
      ...state,
      retrievedDocs,
      systemTime: new Date().toISOString(),
    },
    config,
  );
  const response = await model.invoke(messageValue, config);
  // We return a list, because this will get added to the existing list
  return { messages: [response] };
}

// Define a new graph (It's just a pipe)

const builder = new StateGraph(State)
  .addNode("generateQuery", generateQuery)
  .addNode("retrieve", retrieve)
  .addNode("respond", respond)
  .addEdge("__start__", "generateQuery")
  .addEdge("generateQuery", "retrieve")
  .addEdge("retrieve", "respond");

// Finally, we compile it!
// This compiles it into a graph you can invoke and deploy.
export const graph = builder.compile({
  interruptBefore: [], // if you want to update the state before calling the tools
  interruptAfter: [],
});
