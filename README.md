# XCline

XCline is a fork of [Cline](https://github.com/cline/cline) that extends the capabilities of the original VSCode extension by adding support for additional LLM providers. The main feature is integration with Russian Large Language Models and local providers:

- **YandexGPT** - a powerful language model from Yandex
- **GigaChat** - an advanced LLM developed by Sber
- **Local Models** - support for running models locally through LM Studio and Ollama
- **OpenAI-compatible APIs** - compatibility with any provider that implements the OpenAI API specification

This integration allows you to use these models through the familiar interface while maintaining all the powerful features of the original extension like file editing, terminal commands, browser control, and more.

---

<p align="center">
  <img src="https://media.githubusercontent.com/media/cline/cline/main/assets/docs/demo.gif" width="100%" />
</p>

<div align="center">
<table>
<tbody>
<td align="center">
<a href="https://marketplace.visualstudio.com/items?itemName=saoudrizwan.claude-dev" target="_blank"><strong>Download on VS Marketplace</strong></a>
</td>
<td align="center">
<a href="https://discord.gg/cline" target="_blank"><strong>Discord</strong></a>
</td>
<td align="center">
<a href="https://www.reddit.com/r/cline/" target="_blank"><strong>r/cline</strong></a>
</td>
<td align="center">
<a href="https://github.com/cline/cline/discussions/categories/feature-requests?discussions_q=is%3Aopen+category%3A%22Feature+Requests%22+sort%3Atop" target="_blank"><strong>Feature Requests</strong></a>
</td>
</tbody>
</table>
</div>

Meet XCline, an AI assistant that can use your **CLI** a**N**d **E**ditor.

XCline can handle complex software development tasks step-by-step. With tools that let it create & edit files, explore large projects, use the browser, and execute terminal commands (after you grant permission), it can assist you in ways that go beyond code completion or tech support. The assistant can even use the Model Context Protocol (MCP) to create new tools and extend its own capabilities. While autonomous AI scripts traditionally run in sandboxed environments, this extension provides a human-in-the-loop GUI to approve every file change and terminal command, providing a safe and accessible way to explore the potential of agentic AI.

1. Enter your task and add images to convert mockups into functional apps or fix bugs with screenshots.
2. The assistant starts by analyzing your file structure & source code ASTs, running regex searches, and reading relevant files to get up to speed in existing projects. By carefully managing what information is added to context, it can provide valuable assistance even for large, complex projects without overwhelming the context window.
3. Once the assistant has the information it needs, it can:
    - Create and edit files + monitor linter/compiler errors along the way, letting it proactively fix issues like missing imports and syntax errors on its own.
    - Execute commands directly in your terminal and monitor their output as it works, letting it e.g., react to dev server issues after editing a file.
    - For web development tasks, launch the site in a headless browser, click, type, scroll, and capture screenshots + console logs, allowing it to fix runtime errors and visual bugs.
4. When a task is completed, the assistant will present the result to you with a terminal command like `open -a "Google Chrome" index.html`, which you run with a click of a button.

> [!TIP]
> Use the `CMD/CTRL + Shift + P` shortcut to open the command palette and type "XCline: Open In New Tab" to open the extension as a tab in your editor. This lets you use the assistant side-by-side with your file explorer, and see how it changes your workspace more clearly.

---

<img align="right" width="340" src="https://github.com/user-attachments/assets/3cf21e04-7ce9-4d22-a7b9-ba2c595e88a4">

### Use Multiple LLM Providers

XCline supports multiple LLM providers:
- Russian models like YandexGPT and GigaChat
- Local models through LM Studio and Ollama
- Any OpenAI-compatible API provider

The extension keeps track of total tokens and API usage cost for the entire task loop and individual requests, keeping you informed of spend every step of the way.

<!-- Transparent pixel to create line break after floating image -->

<img width="2000" height="0" src="https://github.com/user-attachments/assets/ee14e6f7-20b8-4391-9091-8e8e25561929"><br>

<img align="left" width="370" src="https://github.com/user-attachments/assets/81be79a8-1fdb-4028-9129-5fe055e01e76">

### Run Commands in Terminal

Thanks to the new [shell integration updates in VSCode v1.93](https://code.visualstudio.com/updates/v1_93#_terminal-shell-integration-api), the assistant can execute commands directly in your terminal and receive the output. This allows it to perform a wide range of tasks, from installing packages and running build scripts to deploying applications, managing databases, and executing tests, all while adapting to your dev environment & toolchain to get the job done right.

For long running processes like dev servers, use the "Proceed While Running" button to let the assistant continue in the task while the command runs in the background. As it works, it'll be notified of any new terminal output along the way, letting it react to issues that may come up, such as compile-time errors when editing files.

<!-- Transparent pixel to create line break after floating image -->

<img width="2000" height="0" src="https://github.com/user-attachments/assets/ee14e6f7-20b8-4391-9091-8e8e25561929"><br>

<img align="right" width="400" src="https://github.com/user-attachments/assets/c5977833-d9b8-491e-90f9-05f9cd38c588">

### Create and Edit Files

The assistant can create and edit files directly in your editor, presenting you a diff view of the changes. You can edit or revert changes directly in the diff view editor, or provide feedback in chat until you're satisfied with the result. It also monitors linter/compiler errors (missing imports, syntax errors, etc.) so it can fix issues that come up along the way on its own.

All changes are recorded in your file's Timeline, providing an easy way to track and revert modifications if needed.

<!-- Transparent pixel to create line break after floating image -->

<img width="2000" height="0" src="https://github.com/user-attachments/assets/ee14e6f7-20b8-4391-9091-8e8e25561929"><br>

<img align="left" width="370" src="https://github.com/user-attachments/assets/bc2e85ba-dfeb-4fe6-9942-7cfc4703cbe5">

### Use the Browser

The assistant can launch a browser, click elements, type text, and scroll, capturing screenshots and console logs at each step. This allows for interactive debugging, end-to-end testing, and even general web use! This gives it autonomy to fixing visual bugs and runtime issues without you needing to handhold and copy-pasting error logs yourself.

Try asking it to "test the app", and watch as it runs a command like `npm run dev`, launches your locally running dev server in a browser, and performs a series of tests to confirm that everything works.

<!-- Transparent pixel to create line break after floating image -->

<img width="2000" height="0" src="https://github.com/user-attachments/assets/ee14e6f7-20b8-4391-9091-8e8e25561929"><br>

<img align="right" width="350" src="https://github.com/user-attachments/assets/ac0efa14-5c1f-4c26-a42d-9d7c56f5fadd">

### "add a tool that..."

Thanks to the [Model Context Protocol](https://github.com/modelcontextprotocol), the assistant can extend its capabilities through custom tools. While you can use [community-made servers](https://github.com/modelcontextprotocol/servers), it can instead create and install tools tailored to your specific workflow. Just ask it to "add a tool" and it will handle everything, from creating a new MCP server to installing it into the extension. These custom tools then become part of its toolkit, ready to use in future tasks.

-   "add a tool that fetches Jira tickets": Retrieve ticket ACs and put the assistant to work
-   "add a tool that manages AWS EC2s": Check server metrics and scale instances up or down
-   "add a tool that pulls the latest PagerDuty incidents": Fetch details and ask it to fix bugs

<!-- Transparent pixel to create line break after floating image -->

<img width="2000" height="0" src="https://github.com/user-attachments/assets/ee14e6f7-20b8-4391-9091-8e8e25561929"><br>

<img align="left" width="360" src="https://github.com/user-attachments/assets/7fdf41e6-281a-4b4b-ac19-020b838b6970">

### Add Context

**`@url`:** Paste in a URL for the extension to fetch and convert to markdown, useful when you want to give the assistant the latest docs

**`@problems`:** Add workspace errors and warnings ('Problems' panel) for the assistant to fix

**`@file`:** Adds a file's contents so you don't have to waste API requests approving read file (+ type to search files)

**`@folder`:** Adds folder's files all at once to speed up your workflow even more

<!-- Transparent pixel to create line break after floating image -->

<img width="2000" height="0" src="https://github.com/user-attachments/assets/ee14e6f7-20b8-4391-9091-8e8e25561929"><br>

<img align="right" width="350" src="https://github.com/user-attachments/assets/140c8606-d3bf-41b9-9a1f-4dbf0d4c90cb">

### Checkpoints: Compare and Restore

As the assistant works through a task, the extension takes a snapshot of your workspace at each step. You can use the 'Compare' button to see a diff between the snapshot and your current workspace, and the 'Restore' button to roll back to that point.

For example, when working with a local web server, you can use 'Restore Workspace Only' to quickly test different versions of your app, then use 'Restore Task and Workspace' when you find the version you want to continue building from. This lets you safely explore different approaches without losing progress.

<!-- Transparent pixel to create line break after floating image -->

<img width="2000" height="0" src="https://github.com/user-attachments/assets/ee14e6f7-20b8-4391-9091-8e8e25561929"><br>

## License

[Apache 2.0 © 2025 XRouter Inc.](./LICENSE)
