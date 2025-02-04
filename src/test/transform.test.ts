import * as assert from "assert"
import { transformToolCallToContent, formatToolCallsToXml } from "../api/transform/xrouter-format"
import { OpenAI } from "openai"
import { Anthropic } from "@anthropic-ai/sdk"
import { describe, it } from "mocha"
import "should"

describe("Tool Call Transformation", () => {
    it("should format tool calls with thinking", () => {
        const toolCalls: OpenAI.Chat.ChatCompletionMessageToolCall[] = [
            {
                id: "call_1",
                type: "function",
                function: {
                    name: "read_file",
                    arguments: JSON.stringify({
                        thinking: "Analyzing the file contents",
                        path: "src/main.ts"
                    })
                }
            }
        ]

        const expected = `
<thinking>Analyzing the file contents</thinking>
<read_file>
<path>src/main.ts</path>
</read_file>
`

        const result = formatToolCallsToXml(toolCalls)
        assert.strictEqual(result.trim(), expected.trim())
    })

    it("should create Anthropic message with XML", () => {
        const completion: OpenAI.Chat.Completions.ChatCompletion = {
            id: "test",
            object: "chat.completion",
            created: Date.now(),
            model: "gpt-4",
            choices: [{
                index: 0,
                logprobs: null,
                message: {
                    role: "assistant",
                    content: null,
                    refusal: null,
                    tool_calls: [{
                        id: "call_1",
                        type: "function",
                        function: {
                            name: "read_file",
                            arguments: JSON.stringify({
                                thinking: "Analyzing the file contents",
                                path: "src/main.ts"
                            })
                        }
                    }]
                },
                finish_reason: "tool_calls"
            }],
            usage: {
                prompt_tokens: 100,
                completion_tokens: 50,
                total_tokens: 150
            }
        }

        const result = transformToolCallToContent(completion)

        // Verify the message content
        assert.strictEqual(result.content.length, 2)
        
        // Verify XML content in first text block
        assert.strictEqual(result.content[0].type, "text")
        assert.ok((result.content[0] as Anthropic.TextBlock).text.includes("<thinking>Analyzing the file contents</thinking>"))
        
        // Verify tool_use content
        assert.deepStrictEqual(result.content[1], {
            type: "tool_use",
            id: "call_1",
            name: "read_file",
            input: {
                path: "src/main.ts"
            }
        })
    })
})
