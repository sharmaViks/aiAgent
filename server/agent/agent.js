import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatAnthropic } from "@langchain/anthropic";
import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { MemorySaver } from "@langchain/langgraph";

const weatherTool = tool(async ({ query }) => {
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

async function evalAndCaptureOutput(code) {
    const oldLog = console.log;
    const oldError = console.error;

    const output = [];
    let errorOutput = [];

    console.log = (...args) => output.push(args.join(' '));
    console.error = (...args) => errorOutput.push(args.join(' '));

    try {
        await eval(code);
    } catch (error) {
        errorOutput.push(error.message);
    }

    console.log = oldLog;
    console.error = oldError;

    return { stdout: output.join('\n'), stderr: errorOutput.join('\n') };
}


const jsExecutorTool = tool(async ({ code }) => {
    const result = await evalAndCaptureOutput(code);
    return result;
},
    {
        name: 'run_javascript_code_tool',
        description: `
      Run general purpose javascript code. 
      This can be used to access Internet or do any computation that you need. 
      The output will be composed of the stdout and stderr. 
      The code should be written in a way that it can be executed with javascript eval in node environment.
    `,
        schema: z.object({
            code: z.string().describe('code to be executed'),
        }),
    })

const model = new ChatAnthropic({
    model: "claude-3-5-sonnet-latest",
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
});

const memorySaver = new MemorySaver();

export const agent = createReactAgent({
    llm: model,
    tools: [weatherTool, jsExecutorTool],
    checkpointSaver: memorySaver
})

// const result = await agent.invoke({
//     messages: [
//         {
//             role: "user",
//             content: "What's the weather in Delhi?"
//         }
//     ]
// },
// {
//     configurable:{ thread_id: 42 }
// })

// console.log(result.messages.at(-1)?.content);

// const followup = await agent.invoke({
//     messages: [
//         {
//             role: "user",
//             content: "What was the city of the user?"
//         }
//     ]
// },
// {
//     configurable:{ thread_id: 42 }
// })

// console.log(followup.messages.at(-1)?.content);