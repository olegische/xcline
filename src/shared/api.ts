export type ApiProvider = "xrouter" | "openai" | "ollama" | "lmstudio"

export interface ApiHandlerOptions {
	apiModelId?: string
	xRouterApiKey?: string
	xRouterModelId?: string
	xRouterModelInfo?: ModelInfo
	openAiBaseUrl?: string
	openAiApiKey?: string
	openAiModelId?: string
	openAiModelInfo?: OpenAiCompatibleModelInfo
	ollamaModelId?: string
	ollamaBaseUrl?: string
	ollamaApiOptionsCtxNum?: string
	lmStudioModelId?: string
	lmStudioBaseUrl?: string
}

export type ApiConfiguration = ApiHandlerOptions & {
	apiProvider?: ApiProvider
}

// Models

export interface ModelInfo {
	maxTokens?: number
	contextWindow?: number
	supportsImages?: boolean
	supportsComputerUse?: boolean
	supportsPromptCache: boolean
	inputPrice?: number
	outputPrice?: number
	cacheWritesPrice?: number
	cacheReadsPrice?: number
	description?: string
}

export interface OpenAiCompatibleModelInfo extends ModelInfo {
	temperature?: number
}

// XRouter
// https://xrouter.info/models?order=newest&supported_parameters=tools
export const xRouterDefaultModelId = "gigachat/gigachat"
export const xRouterDefaultModelInfo: ModelInfo = {
	maxTokens: 4096,
	contextWindow: 32768,
	supportsImages: false,
	supportsPromptCache: false,
	inputPrice: 10.2, // 0.0000102 * 1_000_000
	outputPrice: 10.2, // 0.0000102 * 1_000_000
	description: "A lightweight model for simple tasks requiring maximum speed.",
}

// Azure OpenAI
// https://learn.microsoft.com/en-us/azure/ai-services/openai/api-version-deprecation
// https://learn.microsoft.com/en-us/azure/ai-services/openai/reference#api-specs
export const azureOpenAiDefaultApiVersion = "2024-08-01-preview"

export const openAiModelInfoSaneDefaults: OpenAiCompatibleModelInfo = {
	maxTokens: -1,
	contextWindow: 128_000,
	supportsImages: true,
	supportsPromptCache: false,
	inputPrice: 0,
	outputPrice: 0,
	temperature: 0,
}
