import { Anthropic } from "@anthropic-ai/sdk"
import axios from "axios"
import OpenAI from "openai"
import { ApiHandler } from "../"
import { ApiHandlerOptions, ModelInfo, xRouterDefaultModelId, xRouterDefaultModelInfo } from "../../shared/api"
import { convertToOpenAiMessages } from "../transform/openai-format"
import { ApiStream } from "../transform/stream"
import delay from "delay"

// Configuration
export const xrouterBaseUrl = "http://localhost:8000/api/v1"
// export const xrouterBaseUrl = "https://xrouter.ru/api/v1"

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
        // Convert Anthropic messages to OpenAI format
        const openAiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            { role: "system", content: systemPrompt },
            ...convertToOpenAiMessages(messages),
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
            }
        }

        await delay(500) // FIXME: necessary delay to ensure generation endpoint is ready

        try {
            const response = await axios.get(`${xrouterBaseUrl}/generation?id=${genId}`, {
                headers: {
                    Authorization: `Bearer ${this.options.xRouterApiKey}`,
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
