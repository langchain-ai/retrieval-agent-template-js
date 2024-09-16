/**
 * Default prompts.
 */

export const RESPONSE_SYSTEM_PROMPT: string = `You are a helpful AI assistant. Answer the user's questions based on the retrieved documents.

{retrieved_docs}

System time: {system_time}`;

export const QUERY_SYSTEM_PROMPT: string = `Generate search queries to retrieve documents that may help answer the user's question. Previously, you made the following queries:
    
<previous_queries/>
{queries}
</previous_queries>

System time: {system_time}`;
