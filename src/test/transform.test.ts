import * as assert from "assert"
import { transformToolCallToContent, formatToolCallsToXml } from "../api/transform/xrouter-format"
import { OpenAI } from "openai"
import { Anthropic } from "@anthropic-ai/sdk"
import { describe, it } from "mocha"
import { parseAssistantMessage } from "../core/assistant-message/parse-assistant-message"
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

    it("should create parseable XML output", () => {
        // Create OpenAI completion with tool call
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

        // Transform to Anthropic format with XML
        const result = transformToolCallToContent(completion)

        // Get the XML content from the first text block
        const xmlContent = (result.content[0] as Anthropic.TextBlock).text

        // Parse the XML content
        const parsedBlocks = parseAssistantMessage(xmlContent)

        // Log the parsed blocks for debugging
        console.log('XML Content:', xmlContent)
        console.log('Parsed Blocks:', JSON.stringify(parsedBlocks, null, 2))

        // Verify the parsed content
        assert.strictEqual(parsedBlocks.length, 3) // empty text + thinking + tool
        
        // Verify thinking block
        assert.strictEqual(parsedBlocks[0].type, "text")
        assert.ok((parsedBlocks[0] as any).content.includes("Analyzing the file contents"))
        
        // Verify tool block
        assert.strictEqual(parsedBlocks[1].type, "tool_use")
        const toolBlock = parsedBlocks[1] as any
        
        // Verify final empty text block
        assert.strictEqual(parsedBlocks[2].type, "text")
        assert.strictEqual((parsedBlocks[2] as any).content.trim(), "")
        assert.strictEqual((parsedBlocks[2] as any).partial, true)
        assert.strictEqual(toolBlock.name, "read_file")
        assert.strictEqual(toolBlock.params.path, "src/main.ts")
        assert.strictEqual(toolBlock.partial, false)
    })
})
