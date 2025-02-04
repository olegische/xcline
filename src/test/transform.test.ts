import * as assert from "assert"
import { formatToolCallsToXml } from "../api/transform/xrouter-format"
import { OpenAI } from "openai"
import { describe, it } from "mocha"
import { parseAssistantMessage } from "../core/assistant-message/parse-assistant-message"
import "should"

describe("Tool Call Transformation", () => {
    it("should format tool calls with thinking and preserve tool_use_id", () => {
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
<tool_use_id>call_1</tool_use_id>
<path>src/main.ts</path>
</read_file>
`

        const result = formatToolCallsToXml(toolCalls)
        assert.strictEqual(result.trim(), expected.trim())
    })

    it("should create parseable XML that preserves tool_use_id", () => {
        const xmlContent = `
<thinking>Analyzing the file contents</thinking>
<read_file>
<tool_use_id>call_1</tool_use_id>
<path>src/main.ts</path>
</read_file>`.trim()
        // Parse the XML content
        const parsedBlocks = parseAssistantMessage(xmlContent)
        
        // Log XML for debugging
        console.log("XML with line breaks:", xmlContent.split('').map(c => c === '\n' ? '\\n' : c).join(''))

        // Verify the parsed content
        assert.strictEqual(parsedBlocks.length, 2) // thinking + tool
        
        // Verify thinking block
        assert.strictEqual(parsedBlocks[0].type, "text")
        assert.ok((parsedBlocks[0] as any).content.includes("Analyzing the file contents"))
        
        // Verify tool block
        assert.strictEqual(parsedBlocks[1].type, "tool_use")
        const toolBlock = parsedBlocks[1] as any
        assert.strictEqual(toolBlock.name, "read_file")
        assert.strictEqual(toolBlock.id, "call_1")
        assert.strictEqual(toolBlock.params.path, "src/main.ts")
        assert.strictEqual(toolBlock.partial, false)
    })
})
