import { Client } from "@elastic/elasticsearch";
import { ElasticVectorSearch } from "@langchain/community/vectorstores/elasticsearch";
import { RunnableConfig } from "@langchain/core/runnables";
import { VectorStoreRetriever } from "@langchain/core/vectorstores";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { MongoClient } from "mongodb";
import { ensureConfiguration } from "./configuration.js";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";

async function makeElasticRetriever(
  configuration: ReturnType<typeof ensureConfiguration>,
  embeddingModel: OpenAIEmbeddings
): Promise<VectorStoreRetriever> {
  const client = new Client({
    node: process.env.ELASTICSEARCH_URL,
    auth:
      configuration.retrieverProvider === "elastic-local"
        ? {
            username: process.env.ELASTICSEARCH_USER || "",
            password: process.env.ELASTICSEARCH_PASSWORD || "",
          }
        : {
            apiKey: process.env.ELASTICSEARCH_API_KEY || "",
          },
  });

  const vectorStore = new ElasticVectorSearch(embeddingModel, {
    client,
    indexName: "langchain_index",
  });

  const searchKwargs = configuration.searchKwargs || {};
  searchKwargs.filter = searchKwargs.filter || [];
  searchKwargs.filter.push({
    term: { "metadata.user_id": configuration.userId },
  });

  return vectorStore.asRetriever({ searchKwargs });
}

async function makePineconeRetriever(
  configuration: ReturnType<typeof ensureConfiguration>,
  embeddingModel: OpenAIEmbeddings
): Promise<VectorStoreRetriever> {
  const indexName = process.env.PINECONE_INDEX_NAME;
  if (!indexName) {
    throw new Error("PINECONE_INDEX_NAME environment variable is not defined");
  }
  const pinecone = new PineconeClient();
  const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX!);
  const vectorStore = await PineconeStore.fromExistingIndex(embeddingModel, {
    pineconeIndex,
  });

  const searchKwargs = configuration.searchKwargs || {};
  searchKwargs.filter = searchKwargs.filter || {};
  searchKwargs.filter.user_id = configuration.userId;

  return vectorStore.asRetriever({ searchKwargs });
}

async function makeMongoDBRetriever(
  configuration: ReturnType<typeof ensureConfiguration>,
  embeddingModel: OpenAIEmbeddings
): Promise<VectorStoreRetriever> {
  const client = new MongoClient(process.env.MONGODB_ATLAS_URI || "");
  const namespace = `langgraph_retrieval_agent.${configuration.userId}`;
  const [dbName, collectionName] = namespace.split(".");
  const collection = client.db(dbName).collection(collectionName);
  const vectorStore = new MongoDBAtlasVectorSearch(embeddingModel, {
    collection: collection,
    indexName: process.env.MONGODB_INDEX_NAME || "",
    textKey: "text",
    embeddingKey: "embedding",
  });

  return vectorStore.asRetriever();
}

export async function makeRetriever(
  config: RunnableConfig
): Promise<VectorStoreRetriever> {
  const configuration = ensureConfiguration(config);
  const embeddingModel = new OpenAIEmbeddings({
    model: configuration.embeddingModel,
  });

  const userId = configuration.userId;
  if (!userId) {
    throw new Error("Please provide a valid user_id in the configuration.");
  }

  switch (configuration.retrieverProvider) {
    case "elastic":
    case "elastic-local":
      return makeElasticRetriever(configuration, embeddingModel);
    case "pinecone":
      return makePineconeRetriever(configuration, embeddingModel);
    case "mongodb":
      return makeMongoDBRetriever(configuration, embeddingModel);
    default:
      throw new Error(
        `Unrecognized retriever_provider in configuration: ${configuration.retrieverProvider}`
      );
  }
}
