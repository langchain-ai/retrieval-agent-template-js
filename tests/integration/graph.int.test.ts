import { describe, it, expect } from "@jest/globals";
import { graph } from "../../my-app/graph.js";
describe("Researcher", () => {
  it("Simple runthrough", async () => {
    const res = await graph.invoke({ input: "ExampleInput" });
    expect(res.stringList).toEqual(["ExampleInput", "b", "c"]);
  }, 100_000);
});
