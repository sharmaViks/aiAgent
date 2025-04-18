import {createReactAgent} from "@langchain/langgraph/prebuilt";
import {ChatAnthropic} from "@langchain/anthropic";
import {z} from "zod";
import { tool } from "@langchain/core/tools";
import { MemorySaver } from "@langchain/langgraph";

const weatherTool = tool(async ({query}) => {
    console.log('query', query);
    return 'Weather is sunny';
},
{
    name: "weather",
    description: "Get the weather in a specific location",
    schema: z.object({
        query: z.string().describe("The query to use in search"),
    }),
});

const model = new ChatAnthropic({
    model: "claude-3-5-sonnet-latest",
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
});

const memorySaver = new MemorySaver();

const agent = createReactAgent({
    llm: model,
    tools: [weatherTool],
    checkpointSaver: memorySaver 
})

const result = await agent.invoke({
    messages: [
        {
            role: "user",
            content: "What's the weather in Delhi?"
        }
    ]
},
{
    configurable:{ thread_id: 42 }
})

console.log(result.messages.at(-1)?.content);

const followup = await agent.invoke({
    messages: [
        {
            role: "user",
            content: "What was the city of the user?"
        }
    ]
},
{
    configurable:{ thread_id: 42 }
})

console.log(followup.messages.at(-1)?.content);