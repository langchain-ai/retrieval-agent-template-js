import { describe, it, expect } from "@jest/globals";
import { _route } from "../../my-app/graph.js";
describe("Routers", () => {
  it("Test route", async () => {
    const res = _route({ input: "ExampleInput", stringList: [] });
    expect(res).toEqual("callModel");
  }, 100_000);
});
