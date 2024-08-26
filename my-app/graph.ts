/**
 * Empty LangGraph Template
 *
 * Make this code your own!
 */

import { StateGraph, Annotation } from "@langchain/langgraph";

/**
 * The State defines three things:
 * 1. The structure of the graph's state (which "channels" are available to read/write)
 * 2. The default values for the state's channels
 * 3. The reducers for the state's channels. Reducers are functions that determine how to apply updates to the state.
 * See [Reducers](https://langchain-ai.github.io/langgraphjs/concepts/low_level/#reducers) for more information.
 */
const State = Annotation.Root({
  // Example of a channel that will be replaced any time
  // it is written to
  input: Annotation<string>(),
  // Example of a channel that is "append-only"
  stringList: Annotation<string[]>({
    reducer: (x: string[], y: string[]) => x.concat(y),
    default: () => [],
  }),
});

type StateT = typeof State.State;

// Define nodes, these do the work:

const callModel = async (state: StateT) => {
  // Do some work... (e.g. call an LLM)
  return { stringList: [state.input, "b", "c"] };
};

// Define conditional edge logic:

/**
 * Routing function: Determines whether to continue research or end the workflow.
 * This function decides if the gathered information is satisfactory or if more research is needed.
 *
 * @param state - The current state of the research workflow
 * @returns Either "callModel" to continue research or END to finish the workflow
 */
export const _route = (state: StateT): "__end__" | "callModel" => {
  if (state.stringList.length > 0) {
    return "__end__";
  }
  // Loop back
  return "callModel";
};

// Finally, create the graph itself.
const workflow = new StateGraph(State)
  // Add the nodes to do the work.
  // Chaining the nodes together in this way
  // updates the types of the StateGraph instance
  // so you have static type checking when it comes time
  // to add the edges.
  .addNode("callModel", callModel)
  // Regular edges mean "always transition to node B after node A is done"
  // The "__start__" and "__end__" nodes are "virtual" nodes that are always present
  // and represent the beginning and end of the workflow.
  .addEdge("__start__", "callModel")
  .addConditionalEdges("callModel", _route);

export const graph: any = workflow.compile();
