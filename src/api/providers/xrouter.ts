import { Anthropic } from "@anthropic-ai/sdk"
import axios from "axios"
import OpenAI from "openai"
import { ApiHandler } from "../"
import { ApiHandlerOptions, ModelInfo, xRouterDefaultModelId, xRouterDefaultModelInfo } from "../../shared/api"
import { convertToOpenAiMessages } from "../transform/openai-format"
import { ApiStream } from "../transform/stream"
import delay from "delay"
import { getSystemTools, formatToolCallsToXml, extractToolCallsFromXml, transformReminderMessage } from "../transform/xrouter-format"
import { SYSTEM_PROMPT } from "../../core/prompts/system-no-tools"

// Configuration
export const xrouterBaseUrl = "https://xrouter.chat/api/v1"

export class XRouterHandler implements ApiHandler {
    private options: ApiHandlerOptions
    private client: OpenAI

    constructor(options: ApiHandlerOptions) {
        this.options = options
        this.client = new OpenAI({
            baseURL: xrouterBaseUrl,
            apiKey: this.options.xRouterApiKey,
            defaultHeaders: {
                "X-Title": "xCline",
            },
        })
    }

    async *createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[]): ApiStream {
        // Get system prompt without tool descriptions
        const noToolsSystemPrompt = await SYSTEM_PROMPT(
            process.cwd(),
            false, // supportsComputerUse
            {} as any, // mcpHub - not needed for now
            {} as any  // browserSettings - not needed for now
        )

        // Convert Anthropic messages to OpenAI format
        const convertedMessages = convertToOpenAiMessages(messages);
        
        // Process messages to transform reminders and extract tool calls
        const processedMessages = convertedMessages.map(msg => {
            if (msg.role === 'user') {
                if (typeof msg.content === 'string') {
                    return {
                        ...msg,
                        content: transformReminderMessage(msg.content)
                    };
                } else if (Array.isArray(msg.content)) {
                    return {
                        ...msg,
                        content: msg.content.map(part => {
                            if (part.type === 'text') {
                                return {
                                    type: "text" as const,
                                    text: transformReminderMessage(part.text)
                                };
                            }
                            return part;
                        })
                    };
                }
            } 
            // check tool_result src/core/Cline.ts
            else if (msg.role === 'assistant' && typeof msg.content === 'string') {
                const { content, tool_calls } = extractToolCallsFromXml(msg.content);
                const updatedToolCalls = tool_calls?.map(toolCall => ({
                    ...toolCall,
                    id: ""
                }));
                return {
                    ...msg,
                    content,
                    tool_calls: updatedToolCalls
                };
            }
            return msg;
        });

        const openAiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            { role: "system", content: noToolsSystemPrompt },
            ...processedMessages,
        ]

        // Always apply middle-out transform since models don't support prompt caching yet
        const shouldApplyMiddleOutTransform = true

        // @ts-ignore-next-line
        const stream = await this.client.chat.completions.create({
            model: this.getModel().id,
            temperature: 0,
            messages: openAiMessages,
            stream: true,
            transforms: shouldApplyMiddleOutTransform ? ["middle-out"] : undefined,
            tools: getSystemTools(process.cwd()), // Add tools support with current working directory
            tool_choice: "auto",
        })

        let genId: string | undefined

        for await (const chunk of stream) {
            // xrouter returns an error object instead of the openai sdk throwing an error
            if ("error" in chunk) {
                const error = chunk.error as { message?: string; code?: number }
                console.error(`XRouter API Error: ${error?.code} - ${error?.message}`)
                throw new Error(`XRouter API Error ${error?.code}: ${error?.message}`)
            }

            if (!genId && chunk.id) {
                genId = chunk.id
            }

            const delta = chunk.choices[0]?.delta
            if (delta?.content) {
                yield {
                    type: "text",
                    text: delta.content,
                }
            } else if (delta?.tool_calls) {
                // TODO: call convertToAnthropicMessage --> tool_use message. 
                // check src/core/Cline.ts recursivelyMakeClineRequests 
                yield {
                    type: "text",
                    text: formatToolCallsToXml(delta.tool_calls)
                }
            }
        }

        await delay(500) // FIXME: necessary delay to ensure generation endpoint is ready

        try {
            const response = await axios.get(`${xrouterBaseUrl}/generation?id=${genId}`, {
                headers: {
                    Authorization: `Bearer ${this.options.xRouterApiKey}`,
                    "X-Title": "xCline",
                },
                timeout: 5_000,
            })

            const generation = response.data?.data
            console.log("XRouter generation details:", response.data)
            yield {
                type: "usage",
                inputTokens: generation?.native_tokens_prompt || 0,
                outputTokens: generation?.native_tokens_completion || 0,
                totalCost: generation?.total_cost || 0,
            }
        } catch (error) {
            // ignore if fails
            console.error("Error fetching XRouter generation details:", error)
        }
    }

    getModel(): { id: string; info: ModelInfo } {
        const modelId = this.options.xRouterModelId
        const modelInfo = this.options.xRouterModelInfo
        if (modelId && modelInfo) {
            return { id: modelId, info: modelInfo }
        }
        return {
            id: xRouterDefaultModelId,
            info: xRouterDefaultModelInfo,
        }
    }
}
