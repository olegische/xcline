import {
	VSCodeDropdown,
	VSCodeLink,
	VSCodeOption,
	VSCodeRadio,
	VSCodeRadioGroup,
	VSCodeTextField,
} from "@vscode/webview-ui-toolkit/react"
import { Fragment, memo, useCallback, useEffect, useMemo, useState } from "react"
import { useEvent, useInterval } from "react-use"
import {
	ApiConfiguration,
	ModelInfo,
	openAiModelInfoSaneDefaults,
	xRouterDefaultModelId,
	xRouterDefaultModelInfo,
} from "../../../../src/shared/api"
import { ExtensionMessage } from "../../../../src/shared/ExtensionMessage"
import { useExtensionState } from "../../context/ExtensionStateContext"
import { vscode } from "../../utils/vscode"
import VSCodeButtonLink from "../common/VSCodeButtonLink"
import XRouterModelPicker, { ModelDescriptionMarkdown, XROUTER_MODEL_PICKER_Z_INDEX } from "./XRouterModelPicker"

interface ApiOptionsProps {
	showModelOptions: boolean
	apiErrorMessage?: string
	modelIdErrorMessage?: string
}

const ApiOptions = ({ showModelOptions, apiErrorMessage, modelIdErrorMessage }: ApiOptionsProps) => {
	const { apiConfiguration, setApiConfiguration, uriScheme } = useExtensionState()
	const [ollamaModels, setOllamaModels] = useState<string[]>([])
	const [lmStudioModels, setLmStudioModels] = useState<string[]>([])
	const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)

    const handleInputChange = (field: keyof ApiConfiguration) => (event: any) => {
        const newValue = event.target.value
        setApiConfiguration({
            ...apiConfiguration,
            [field]: newValue,
        })
    }

	const { selectedProvider, selectedModelId, selectedModelInfo } = useMemo(() => {
		return normalizeApiConfiguration(apiConfiguration)
	}, [apiConfiguration])

	// Poll ollama/lmstudio models
	const requestLocalModels = useCallback(() => {
		if (selectedProvider === "ollama") {
			vscode.postMessage({
				type: "requestOllamaModels",
				text: apiConfiguration?.ollamaBaseUrl,
			})
		} else if (selectedProvider === "lmstudio") {
			vscode.postMessage({
				type: "requestLmStudioModels",
				text: apiConfiguration?.lmStudioBaseUrl,
			})
		}
	}, [selectedProvider, apiConfiguration?.ollamaBaseUrl, apiConfiguration?.lmStudioBaseUrl])

	useEffect(() => {
	}, [selectedProvider, requestLocalModels])
	useEffect(() => {
		if (selectedProvider === "ollama" || selectedProvider === "lmstudio") {
			requestLocalModels()
		}
	}, [selectedProvider, requestLocalModels])
	useInterval(requestLocalModels, selectedProvider === "ollama" || selectedProvider === "lmstudio" ? 2000 : null)

	const handleMessage = useCallback((event: MessageEvent) => {
		const message: ExtensionMessage = event.data
		if (message.type === "ollamaModels" && message.ollamaModels) {
			setOllamaModels(message.ollamaModels)
		} else if (message.type === "lmStudioModels" && message.lmStudioModels) {
			setLmStudioModels(message.lmStudioModels)
		}
	}, [])
	useEvent("message", handleMessage)

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
			<div className="dropdown-container">
				<label htmlFor="api-provider">
					<span style={{ fontWeight: 500 }}>API Provider</span>
				</label>
				<VSCodeDropdown
					id="api-provider"
					value={selectedProvider}
					onChange={handleInputChange("apiProvider")}
					style={{
						minWidth: 130,
						position: "relative",
						zIndex: XROUTER_MODEL_PICKER_Z_INDEX + 1,
					}}>
					<VSCodeOption value="xrouter">xRouter</VSCodeOption>
					<VSCodeOption value="openai">OpenAI Compatible</VSCodeOption>
					<VSCodeOption value="lmstudio">LM Studio</VSCodeOption>
					<VSCodeOption value="ollama">Ollama</VSCodeOption>
				</VSCodeDropdown>
			</div>

			{selectedProvider === "xrouter" && (
				<div>
					<VSCodeTextField
						value={apiConfiguration?.xRouterApiKey || ""}
						style={{ width: "100%" }}
						type="password"
						onInput={handleInputChange("xRouterApiKey")}
						placeholder="Enter API Key...">
						<span style={{ fontWeight: 500 }}>XRouter API Key</span>
					</VSCodeTextField>
					{!apiConfiguration?.xRouterApiKey && (
						<VSCodeButtonLink
							href={getXRouterAuthUrl(uriScheme)}
							style={{ margin: "5px 0 0 0" }}
							appearance="secondary">
							Get xRouter API Key
						</VSCodeButtonLink>
					)}
					<p
						style={{
							fontSize: "12px",
							marginTop: "5px",
							color: "var(--vscode-descriptionForeground)",
						}}>
						This key is stored locally and only used to make API requests from this extension.{" "}
					</p>
				</div>
			)}

			{selectedProvider === "openai" && (
				<div>
					<VSCodeTextField
						value={apiConfiguration?.openAiBaseUrl || ""}
						style={{ width: "100%" }}
						type="url"
						onInput={handleInputChange("openAiBaseUrl")}
						placeholder={"Enter base URL..."}>
						<span style={{ fontWeight: 500 }}>Base URL</span>
					</VSCodeTextField>
					<VSCodeTextField
						value={apiConfiguration?.openAiApiKey || ""}
						style={{ width: "100%" }}
						type="password"
						onInput={handleInputChange("openAiApiKey")}
						placeholder="Enter API Key...">
						<span style={{ fontWeight: 500 }}>API Key</span>
					</VSCodeTextField>
					<VSCodeTextField
						value={apiConfiguration?.openAiModelId || ""}
						style={{ width: "100%" }}
						onInput={handleInputChange("openAiModelId")}
						placeholder={"Enter Model ID..."}>
						<span style={{ fontWeight: 500 }}>Model ID</span>
					</VSCodeTextField>
					<p
						style={{
							fontSize: "12px",
							marginTop: 3,
							color: "var(--vscode-descriptionForeground)",
						}}>
						<span style={{ color: "var(--vscode-errorForeground)" }}>
							(<span style={{ fontWeight: 500 }}>Note:</span> Cline uses complex prompts and works best with Claude
							models. Less capable models may not work as expected.)
						</span>
					</p>
				</div>
			)}

			{selectedProvider === "lmstudio" && (
				<div>
					<VSCodeTextField
						value={apiConfiguration?.lmStudioBaseUrl || ""}
						style={{ width: "100%" }}
						type="url"
						onInput={handleInputChange("lmStudioBaseUrl")}
						placeholder={"Default: http://localhost:1234"}>
						<span style={{ fontWeight: 500 }}>Base URL (optional)</span>
					</VSCodeTextField>
					<VSCodeTextField
						value={apiConfiguration?.lmStudioModelId || ""}
						style={{ width: "100%" }}
						onInput={handleInputChange("lmStudioModelId")}
						placeholder={"e.g. meta-llama-3.1-8b-instruct"}>
						<span style={{ fontWeight: 500 }}>Model ID</span>
					</VSCodeTextField>
					{lmStudioModels.length > 0 && (
						<VSCodeRadioGroup
							value={
								lmStudioModels.includes(apiConfiguration?.lmStudioModelId || "")
									? apiConfiguration?.lmStudioModelId
									: ""
							}
							onChange={(e) => {
								const value = (e.target as HTMLInputElement)?.value
								// need to check value first since radio group returns empty string sometimes
								if (value) {
									handleInputChange("lmStudioModelId")({
										target: { value },
									})
								}
							}}>
							{lmStudioModels.map((model) => (
								<VSCodeRadio key={model} value={model} checked={apiConfiguration?.lmStudioModelId === model}>
									{model}
								</VSCodeRadio>
							))}
						</VSCodeRadioGroup>
					)}
					<p
						style={{
							fontSize: "12px",
							marginTop: "5px",
							color: "var(--vscode-descriptionForeground)",
						}}>
						LM Studio allows you to run models locally on your computer. For instructions on how to get started, see
						their
						<VSCodeLink href="https://lmstudio.ai/docs" style={{ display: "inline", fontSize: "inherit" }}>
							quickstart guide.
						</VSCodeLink>
						You will also need to start LM Studio's{" "}
						<VSCodeLink
							href="https://lmstudio.ai/docs/basics/server"
							style={{ display: "inline", fontSize: "inherit" }}>
							local server
						</VSCodeLink>{" "}
						feature to use it with this extension.{" "}
						<span style={{ color: "var(--vscode-errorForeground)" }}>
							(<span style={{ fontWeight: 500 }}>Note:</span> Cline uses complex prompts and works best with Claude
							models. Less capable models may not work as expected.)
						</span>
					</p>
				</div>
			)}

			{selectedProvider === "ollama" && (
				<div>
					<VSCodeTextField
						value={apiConfiguration?.ollamaBaseUrl || ""}
						style={{ width: "100%" }}
						type="url"
						onInput={handleInputChange("ollamaBaseUrl")}
						placeholder={"Default: http://localhost:11434"}>
						<span style={{ fontWeight: 500 }}>Base URL (optional)</span>
					</VSCodeTextField>
					<VSCodeTextField
						value={apiConfiguration?.ollamaModelId || ""}
						style={{ width: "100%" }}
						onInput={handleInputChange("ollamaModelId")}
						placeholder={"e.g. llama3.1"}>
						<span style={{ fontWeight: 500 }}>Model ID</span>
					</VSCodeTextField>
					{ollamaModels.length > 0 && (
						<VSCodeRadioGroup
							value={
								ollamaModels.includes(apiConfiguration?.ollamaModelId || "")
									? apiConfiguration?.ollamaModelId
									: ""
							}
							onChange={(e) => {
								const value = (e.target as HTMLInputElement)?.value
								// need to check value first since radio group returns empty string sometimes
								if (value) {
									handleInputChange("ollamaModelId")({
										target: { value },
									})
								}
							}}>
							{ollamaModels.map((model) => (
								<VSCodeRadio key={model} value={model} checked={apiConfiguration?.ollamaModelId === model}>
									{model}
								</VSCodeRadio>
							))}
						</VSCodeRadioGroup>
					)}
					<p
						style={{
							fontSize: "12px",
							marginTop: "5px",
							color: "var(--vscode-descriptionForeground)",
						}}>
						Ollama allows you to run models locally on your computer. For instructions on how to get started, see
						their
						<VSCodeLink
							href="https://github.com/ollama/ollama/blob/main/README.md"
							style={{ display: "inline", fontSize: "inherit" }}>
							quickstart guide.
						</VSCodeLink>
						<span style={{ color: "var(--vscode-errorForeground)" }}>
							(<span style={{ fontWeight: 500 }}>Note:</span> Cline uses complex prompts and works best with Claude
							models. Less capable models may not work as expected.)
						</span>
					</p>
				</div>
			)}

			{apiErrorMessage && (
				<p
					style={{
						margin: "-10px 0 4px 0",
						fontSize: 12,
						color: "var(--vscode-errorForeground)",
					}}>
					{apiErrorMessage}
				</p>
			)}

			{selectedProvider === "xrouter" && showModelOptions && <XRouterModelPicker />}

			{selectedProvider !== "xrouter" &&
				selectedProvider !== "openai" &&
				selectedProvider !== "ollama" &&
				selectedProvider !== "lmstudio" &&
				showModelOptions && (
					<>
						<ModelInfoView
							selectedModelId={selectedModelId}
							modelInfo={selectedModelInfo}
							isDescriptionExpanded={isDescriptionExpanded}
							setIsDescriptionExpanded={setIsDescriptionExpanded}
						/>
					</>
				)}

			{modelIdErrorMessage && (
				<p
					style={{
						margin: "-10px 0 4px 0",
						fontSize: 12,
						color: "var(--vscode-errorForeground)",
					}}>
					{modelIdErrorMessage}
				</p>
			)}
		</div>
	)
}

export function getXRouterAuthUrl(uriScheme?: string) {
	return `https://xrouter.chat/authorize?redirect_url=${uriScheme || "vscode"}://xrouter.xcline/xrouter`
}

export const formatPrice = (price: number) => {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(price)
}

export const ModelInfoView = ({
	selectedModelId,
	modelInfo,
	isDescriptionExpanded,
	setIsDescriptionExpanded,
}: {
	selectedModelId: string
	modelInfo: ModelInfo
	isDescriptionExpanded: boolean
	setIsDescriptionExpanded: (isExpanded: boolean) => void
}) => {
	const infoItems = [
		modelInfo.description && (
			<ModelDescriptionMarkdown
				key="description"
				markdown={modelInfo.description}
				isExpanded={isDescriptionExpanded}
				setIsExpanded={setIsDescriptionExpanded}
			/>
		),
		<ModelInfoSupportsItem
			key="supportsImages"
			isSupported={modelInfo.supportsImages ?? false}
			supportsLabel="Supports images"
			doesNotSupportLabel="Does not support images"
		/>,
		<ModelInfoSupportsItem
			key="supportsComputerUse"
			isSupported={modelInfo.supportsComputerUse ?? false}
			supportsLabel="Supports computer use"
			doesNotSupportLabel="Does not support computer use"
		/>,
		<ModelInfoSupportsItem
			key="supportsPromptCache"
			isSupported={modelInfo.supportsPromptCache}
			supportsLabel="Supports prompt caching"
			doesNotSupportLabel="Does not support prompt caching"
		/>,
		modelInfo.maxTokens !== undefined && modelInfo.maxTokens > 0 && (
			<span key="maxTokens">
				<span style={{ fontWeight: 500 }}>Max output:</span> {modelInfo.maxTokens?.toLocaleString()} tokens
			</span>
		),
		modelInfo.inputPrice !== undefined && modelInfo.inputPrice > 0 && (
			<span key="inputPrice">
				<span style={{ fontWeight: 500 }}>Input price:</span> {formatPrice(modelInfo.inputPrice)}/million tokens
			</span>
		),
		modelInfo.supportsPromptCache && modelInfo.cacheWritesPrice && (
			<span key="cacheWritesPrice">
				<span style={{ fontWeight: 500 }}>Cache writes price:</span> {formatPrice(modelInfo.cacheWritesPrice || 0)}
				/million tokens
			</span>
		),
		modelInfo.supportsPromptCache && modelInfo.cacheReadsPrice && (
			<span key="cacheReadsPrice">
				<span style={{ fontWeight: 500 }}>Cache reads price:</span> {formatPrice(modelInfo.cacheReadsPrice || 0)}/million
				tokens
			</span>
		),
		modelInfo.outputPrice !== undefined && modelInfo.outputPrice > 0 && (
			<span key="outputPrice">
				<span style={{ fontWeight: 500 }}>Output price:</span> {formatPrice(modelInfo.outputPrice)}/million tokens
			</span>
		)
	].filter(Boolean)

	return (
		<p
			style={{
				fontSize: "12px",
				marginTop: "2px",
				color: "var(--vscode-descriptionForeground)",
			}}>
			{infoItems.map((item, index) => (
				<Fragment key={index}>
					{item}
					{index < infoItems.length - 1 && <br />}
				</Fragment>
			))}
		</p>
	)
}

const ModelInfoSupportsItem = ({
	isSupported,
	supportsLabel,
	doesNotSupportLabel,
}: {
	isSupported: boolean
	supportsLabel: string
	doesNotSupportLabel: string
}) => (
	<span
		style={{
			fontWeight: 500,
			color: isSupported ? "var(--vscode-charts-green)" : "var(--vscode-errorForeground)",
		}}>
		<i
			className={`codicon codicon-${isSupported ? "check" : "x"}`}
			style={{
				marginRight: 4,
				marginBottom: isSupported ? 1 : -1,
				fontSize: isSupported ? 11 : 13,
				fontWeight: 700,
				display: "inline-block",
				verticalAlign: "bottom",
			}}></i>
		{isSupported ? supportsLabel : doesNotSupportLabel}
	</span>
)

export function normalizeApiConfiguration(apiConfiguration?: ApiConfiguration) {
	const provider = apiConfiguration?.apiProvider || "xrouter"

	switch (provider) {
		case "xrouter":
			return {
				selectedProvider: provider,
				selectedModelId: apiConfiguration?.xRouterModelId || xRouterDefaultModelId,
				selectedModelInfo: apiConfiguration?.xRouterModelInfo || xRouterDefaultModelInfo
			}
		case "openai":
			return {
				selectedProvider: provider,
				selectedModelId: apiConfiguration?.openAiModelId || "",
				selectedModelInfo: openAiModelInfoSaneDefaults,
			}
		case "ollama":
			return {
				selectedProvider: provider,
				selectedModelId: apiConfiguration?.ollamaModelId || "",
				selectedModelInfo: openAiModelInfoSaneDefaults,
			}
		case "lmstudio":
			return {
				selectedProvider: provider,
				selectedModelId: apiConfiguration?.lmStudioModelId || "",
				selectedModelInfo: openAiModelInfoSaneDefaults,
			}
		default:
			return {
				selectedProvider: "xrouter",
				selectedModelId: xRouterDefaultModelId,
				selectedModelInfo: xRouterDefaultModelInfo
			}
	}
}

export default memo(ApiOptions)
