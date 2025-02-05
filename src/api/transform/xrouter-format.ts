import OpenAI from "openai"
// Convert tool descriptions from system prompt to OpenAI tools format
export function getSystemTools(cwd: string): OpenAI.Chat.ChatCompletionTool[] {
  return [
  {
    type: "function",
    function: {
      name: "execute_command",
      description: `Request to execute a CLI command on the system. Use this when you need to perform system operations or run specific commands to accomplish any step in the user's task. You must tailor your command to the user's system and provide a clear explanation of what the command does. For command chaining, use the appropriate chaining syntax for the user's shell. Prefer to execute complex CLI commands over creating executable scripts, as they are more flexible and easier to run. Commands will be executed in the current working directory: ${cwd.toPosix()}`,
      parameters: {
        type: "object",
        properties: {
          command: {
            type: "string",
            description: "The CLI command to execute. This should be valid for the current operating system. Ensure the command is properly formatted and does not contain any harmful instructions."
          },
          requires_approval: {
            type: "boolean",
            description: "A boolean indicating whether this command requires explicit user approval before execution in case the user has auto-approve mode enabled. Set to 'true' for potentially impactful operations like installing/uninstalling packages, deleting/overwriting files, system configuration changes, network operations, or any commands that could have unintended side effects. Set to 'false' for safe operations like reading files/directories, running development servers, building projects, and other non-destructive operations."
          },
          thinking: {
            type: "string",
            description: "The model's thought process and analysis before executing the command"
          }
        },
        required: ["command", "requires_approval", "thinking"]
      }
    }
  },
  {
    type: "function", 
    function: {
      name: "read_file",
      description: `Request to read the contents of a file at the specified path. Use this when you need to examine the contents of an existing file you do not know the contents of, for example to analyze code, review text files, or extract information from configuration files. Automatically extracts raw text from PDF and DOCX files. May not be suitable for other types of binary files, as it returns the raw content as a string.`,
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: `The path of the file to read (relative to the current working directory ${cwd.toPosix()})`
          },
          thinking: {
            type: "string",
            description: "The model's thought process and analysis before reading the file"
          }
        },
        required: ["path", "thinking"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "write_to_file",
      description: `Request to write content to a file at the specified path. If the file exists, it will be overwritten with the provided content. If the file doesn't exist, it will be created. This tool will automatically create any directories needed to write the file.`,
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: `The path of the file to write to (relative to the current working directory ${cwd.toPosix()})`
          },
          content: {
            type: "string",
            description: "The content to write to the file. ALWAYS provide the COMPLETE intended content of the file, without any truncation or omissions. You MUST include ALL parts of the file, even if they haven't been modified."
          },
          thinking: {
            type: "string",
            description: "The model's thought process and analysis before writing to the file"
          }
        },
        required: ["path", "content", "thinking"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "replace_in_file",
      description: `Request to replace sections of content in an existing file using SEARCH/REPLACE blocks that define exact changes to specific parts of the file. This tool should be used when you need to make targeted changes to specific parts of a file.`,
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: `The path of the file to modify (relative to the current working directory ${cwd.toPosix()})`
          },
          diff: {
            type: "string",
            description: `One or more SEARCH/REPLACE blocks following this exact format:
  \`\`\`
  <<<<<<< SEARCH
  [exact content to find]
  =======
  [new content to replace with]
  >>>>>>> REPLACE
  \`\`\`
  Critical rules:
  1. SEARCH content must match the associated file section to find EXACTLY:
     * Match character-for-character including whitespace, indentation, line endings
     * Include all comments, docstrings, etc.
  2. SEARCH/REPLACE blocks will ONLY replace the first match occurrence.
     * Including multiple unique SEARCH/REPLACE blocks if you need to make multiple changes.
     * Include *just* enough lines in each SEARCH section to uniquely match each set of lines that need to change.
     * When using multiple SEARCH/REPLACE blocks, list them in the order they appear in the file.
  3. Keep SEARCH/REPLACE blocks concise:
     * Break large SEARCH/REPLACE blocks into a series of smaller blocks that each change a small portion of the file.
     * Include just the changing lines, and a few surrounding lines if needed for uniqueness.
     * Do not include long runs of unchanging lines in SEARCH/REPLACE blocks.
     * Each line must be complete. Never truncate lines mid-way through as this can cause matching failures.
  4. Special operations:
     * To move code: Use two SEARCH/REPLACE blocks (one to delete from original + one to insert at new location)
     * To delete code: Use empty REPLACE section`
          },
          thinking: {
            type: "string",
            description: "The model's thought process and analysis before executing the command"
          }
        },
        required: ["path", "diff", "thinking"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_files",
      description: "Request to perform a regex search across files in a specified directory, providing context-rich results. This tool searches for patterns or specific content across multiple files, displaying each match with encapsulating context.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: `The path of the directory to search in (relative to the current working directory ${cwd.toPosix()}). This directory will be recursively searched.`
          },
          regex: {
            type: "string",
            description: "The regular expression pattern to search for. Uses Rust regex syntax."
          },
          file_pattern: {
            type: "string",
            description: "Glob pattern to filter files (e.g., '*.ts' for TypeScript files). If not provided, it will search all files (*)."
          },
          thinking: {
            type: "string",
            description: "The model's thought process and analysis before performing the search"
          }
        },
        required: ["path", "regex", "thinking"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_files",
      description: "Request to list files and directories within the specified directory. If recursive is true, it will list all files and directories recursively. If recursive is false or not provided, it will only list the top-level contents. Do not use this tool to confirm the existence of files you may have created, as the user will let you know if the files were created successfully or not.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: `The path of the directory to list contents for (relative to the current working directory ${cwd.toPosix()})`
          },
          recursive: {
            type: "boolean",
            description: "Whether to list files recursively. Use true for recursive listing, false or omit for top-level only."
          },
          thinking: {
            type: "string",
            description: "The model's thought process and analysis before listing files"
          }
        },
        required: ["path", "thinking"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_code_definition_names",
      description: "Request to list definition names (classes, functions, methods, etc.) used in source code files at the top level of the specified directory. This tool provides insights into the codebase structure and important constructs, encapsulating high-level concepts and relationships that are crucial for understanding the overall architecture.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: `The path of the directory (relative to the current working directory ${cwd.toPosix()}) to list top level source code definitions for.`
          },
          thinking: {
            type: "string",
            description: "The model's thought process and analysis before listing code definitions"
          }
        },
        required: ["path", "thinking"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "browser_action",
      description: `Request to interact with a Puppeteer-controlled browser. Every action, except \`close\`, will be responded to with a screenshot of the browser's current state, along with any new console logs. You may only perform one browser action per message, and wait for the user's response including a screenshot and logs to determine the next action.
- The sequence of actions **must always start with** launching the browser at a URL, and **must always end with** closing the browser. If you need to visit a new URL that is not possible to navigate to from the current webpage, you must first close the browser, then launch again at the new URL.
- While the browser is active, only the \`browser_action\` tool can be used. No other tools should be called during this time. You may proceed to use other tools only after closing the browser. For example if you run into an error and need to fix a file, you must close the browser, then use other tools to make the necessary changes, then re-launch the browser to verify the result.
- The browser window has a resolution of **900x600** pixels. When performing any click actions, ensure the coordinates are within this resolution range.
- Before clicking on any elements such as icons, links, or buttons, you must consult the provided screenshot of the page to determine the coordinates of the element. The click should be targeted at the **center of the element**, not on its edges.`,
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            description: "The action to perform (launch, click, type, scroll_down, scroll_up, close)",
            enum: ["launch", "click", "type", "scroll_down", "scroll_up", "close"]
          },
          url: {
            type: "string",
            description: "The URL to launch the browser at (for launch action)"
          },
          coordinate: {
            type: "string",
            description: "The x,y coordinates for click action"
          },
          text: {
            type: "string",
            description: "The text to type (for type action)"
          },
          thinking: {
            type: "string",
            description: "The model's thought process and analysis before performing the browser action"
          }
        },
        required: ["action", "thinking"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "ask_followup_question",
      description: "Ask the user a question to gather additional information needed to complete the task. This tool should be used when you encounter ambiguities, need clarification, or require more details to proceed effectively. It allows for interactive problem-solving by enabling direct communication with the user. Use this tool judiciously to maintain a balance between gathering necessary information and avoiding excessive back-and-forth.",
      parameters: {
        type: "object",
        properties: {
          question: {
            type: "string",
            description: "The question to ask the user"
          },
          thinking: {
            type: "string",
            description: "The model's thought process and analysis before asking the question"
          }
        },
        required: ["question", "thinking"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "attempt_completion",
      description: "After each tool use, the user will respond with the result of that tool use, i.e. if it succeeded or failed, along with any reasons for failure. Once you've received the results of tool uses and can confirm that the task is complete, use this tool to present the result of your work to the user. Optionally you may provide a CLI command to showcase the result of your work. The user may respond with feedback if they are not satisfied with the result, which you can use to make improvements and try again.",
      parameters: {
        type: "object",
        properties: {
          result: {
            type: "string",
            description: "The result of the task"
          },
          command: {
            type: "string",
            description: "Optional command to demonstrate the result"
          },
          thinking: {
            type: "string",
            description: "The model's thought process and analysis before completing the task"
          }
        },
        required: ["result", "thinking"]
      }
    }
  }
  ];
}

// Convert tool calls to XML text
export function formatToolCallsToXml(toolCalls: OpenAI.Chat.Completions.ChatCompletionChunk["choices"][0]["delta"]["tool_calls"] | OpenAI.Chat.ChatCompletionMessageToolCall[]): string {
  if (!toolCalls) { return ""; }

  // Add index property if it's missing (for ChatCompletionMessageToolCall)
  const processedToolCalls = Array.isArray(toolCalls) ? toolCalls.map((call, index) => ({
    ...call,
    index: 'index' in call ? call.index : index
  })) : toolCalls;

  return processedToolCalls.map(toolCall => {
    if (toolCall.type === "function" && toolCall.function) {
      const { name, arguments: argsString } = toolCall.function;
      
      // Parse the JSON string into an object
      let args: Record<string, string>;
      try {
        args = JSON.parse(argsString || "{}");
      } catch {
        args = {};
      }

      // Extract thinking from arguments if present
      const { thinking, ...otherArgs } = args;
      
      // Build XML string with proper formatting
      let xml = '';
      if (thinking) {
        xml += `\n<thinking>${thinking}</thinking>\n`;
      }
      xml += `<${name}>\n`;
      if (toolCall.id) {
        xml += `<tool_use_id>${toolCall.id}</tool_use_id>\n`;
      }
      for (const [key, value] of Object.entries(otherArgs)) {
        xml += `<${key}>${value}</${key}>\n`;
      }
      xml += `</${name}>`;

      return xml;
    }
    return "";
  }).join("");
}

// Extract tool calls from XML content and convert to OpenAI format
// Transform the reminder message for OpenRouter format
export function transformReminderMessage(content: string): string {
  const errorPrefix = "[ERROR] You did not use a tool in your previous response! Please retry with a tool use.";
  const reminderStart = "# Reminder: Instructions for Tool Use";
  const reminderEnd = "Always adhere to this format for all tool uses to ensure proper parsing and execution.";
  
  // Check if the content contains the core reminder message parts
  if (content.includes(errorPrefix) && content.includes(reminderStart) && content.includes(reminderEnd)) {
    const newReminder = `# Reminder: Instructions for Tool Use

You must use either tool_calls or function_calls in your response, depending on your capabilities. The response should indicate a tool/function call with the following structure:

For tool_calls:
{
  "tool_calls": [{
    "id": "call_xyz",
    "type": "function",
    "function": {
      "name": "tool_name",
      "arguments": {
        "param1": "value1",
        "param2": "value2"
      }
    }
  }]
}

For function_calls (deprecated):
{
  "function_call": {
    "name": "tool_name",
    "arguments": {
      "param1": "value1",
      "param2": "value2"
    }
  }
}

For example:
{
  "tool_calls": [{
    "id": "call_abc",
    "type": "function",
    "function": {
      "name": "attempt_completion",
      "arguments": {
        "result": "I have completed the task..."
      }
    }
  }]
}

Always adhere to this format to ensure proper execution of tool/function calls.`;

    // Replace the old reminder with the new one, preserving any text before and after
    const reminderRegex = new RegExp(`(${reminderStart.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${reminderEnd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`);
    return content.replace(reminderRegex, newReminder);
  }
  
  return content;
}

export function extractToolCallsFromXml(content: string): { content: string | undefined; tool_calls: OpenAI.Chat.ChatCompletionMessageToolCall[] | undefined } {
  const toolCalls: OpenAI.Chat.ChatCompletionMessageToolCall[] = [];

  // First extract thinking blocks and their content
  const thinkingRegex = /<thinking>([\s\S]*?)<\/thinking>/g;
  let thinkingMatch;
  let thinking: string | undefined;
  
  while ((thinkingMatch = thinkingRegex.exec(content)) !== null) {
    thinking = thinkingMatch[1].trim();
  }

  // Regular expression to match XML tool calls
  const toolCallRegex = /<(\w+)>\s*((?:<\w+>[\s\S]*?<\/\w+>\s*)*)<\/\1>/g;
  let match;

  while ((match = toolCallRegex.exec(content)) !== null) {
    const toolName = match[1];
    if (toolName === 'thinking') {
      continue; // Skip thinking tags as they're already processed
    }

    const paramsXml = match[2];

    // Parse parameters from XML
    const params: Record<string, string> = {};
    const paramRegex = /<(\w+)>([\s\S]*?)<\/\1>/g;
    let paramMatch;
    while ((paramMatch = paramRegex.exec(paramsXml)) !== null) {
      const [_, paramName, paramValue] = paramMatch;
      params[paramName] = paramValue.trim();
    }

    // Create tool call in OpenAI format
    const toolId = params.tool_use_id || `call_${toolCalls.length + 1}`;
    delete params.tool_use_id; // Remove tool_use_id from params before creating arguments

    // Add thinking back to arguments if it exists
    if (thinking) {
      params.thinking = thinking;
    }

    toolCalls.push({
      id: toolId,
      type: "function",
      function: {
        name: toolName,
        arguments: JSON.stringify(params)
      }
    });
  }

  return {
    content: "", // Always return empty content for assistant messages
    tool_calls: toolCalls.length > 0 ? toolCalls : undefined
  };
}
