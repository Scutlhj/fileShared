# WebMCP 技术分享：让网页成为 AI Agent 可调用的工具

> 调研日期：2026-11-18  
> 规范快照：W3C Web Machine Learning Community Group，Draft Community Group Report，2026-11-13  
> 注意：WebMCP 仍处于快速演进阶段，本文以当日规范和官方实现状态为准，落地前应重新核对最新文档。

## 目录

- [WebMCP 技术分享：让网页成为 AI Agent 可调用的工具](#webmcp-技术分享让网页成为-ai-agent-可调用的工具)
  - [目录](#目录)
  - [一句话理解 WebMCP](#一句话理解-webmcp)
  - [为什么需要 WebMCP](#为什么需要-webmcp)
  - [核心原理](#核心原理)
  - [WebMCP 与 MCP 的关系](#webmcp-与-mcp-的关系)
  - [核心 API](#核心-api)
    - [注册工具：registerTool](#注册工具registertool)
    - [发现工具：getTools](#发现工具gettools)
    - [调用工具：executeTool](#调用工具executetool)
    - [事件与取消](#事件与取消)
  - [最小实践：注册一个待办事项工具](#最小实践注册一个待办事项工具)
  - [工具设计最佳实践](#工具设计最佳实践)
  - [安全与隐私](#安全与隐私)
    - [主要风险](#主要风险)
    - [跨源 iframe 的三道边界](#跨源-iframe-的三道边界)
    - [上线检查清单](#上线检查清单)
  - [声明式 API](#声明式-api)
  - [浏览器支持与落地建议](#浏览器支持与落地建议)
  - [常见误区与过时资料](#常见误区与过时资料)
  - [总结](#总结)
  - [参考资料](#参考资料)

---

## 一句话理解 WebMCP

**WebMCP 是一项浏览器原生 JavaScript API 提案，允许网页把自身功能注册为带有自然语言描述和 JSON Schema 的“工具”，供浏览器内、扩展或 iframe 中的 AI Agent 发现和调用。**

它通常被展开为 **Web Model Context Protocol**。W3C 当前草案标题直接使用 WebMCP，由 Web Machine Learning Community Group 孵化。

可以把 WebMCP 理解为：

- 对网站开发者：给现有前端功能增加一份面向 Agent 的结构化接口。
- 对 AI Agent：不再只依赖截图、DOM 猜测和模拟点击，而是调用语义明确的工具。
- 对用户：Agent 在当前页面和登录会话中工作，操作过程及结果仍可通过原有 UI 查看。

当前规范聚焦于 **Tools**，不是把 MCP 的 Resources、Prompts、传输和完整生命周期全部搬进浏览器。

## 为什么需要 WebMCP

传统浏览器 Agent 通常这样操作网页：

1. 获取截图、DOM 或无障碍树。
2. 推断哪个输入框和按钮能完成任务。
3. 模拟输入、点击、滚动和等待。
4. 重新读取页面，判断是否成功。

这种方式通用，但存在几个明显问题：

- **脆弱**：文案、布局或 DOM 结构变化都可能导致流程失效。
- **低效**：一个业务动作可能需要多轮观察和模型推理。
- **语义不明确**：按钮“提交”究竟代表保存草稿还是立即付款，仅靠 UI 很难稳定判断。
- **结果难校验**：Agent 需要再次解析页面，才能确认业务状态。

WebMCP 让网站主动告诉 Agent：“我目前提供哪些能力、需要什么参数、调用后返回什么”。工具内部可以复用已有前端逻辑，并同步更新页面状态。

它并不意味着 UI 自动化会消失。没有合适工具时，Agent 仍可以回退到通用浏览器自动化。

## 核心原理

一次典型的浏览器 Agent 调用流程如下：

```mermaid
sequenceDiagram
    participant U as 用户
    participant A as AI Agent
    participant B as 浏览器中介
    participant P as 网页 Document
    participant S as 后端服务

    U->>A: 描述任务
    A->>B: 获取当前页面可用工具
    B-->>A: 工具名称、描述和 Schema
    A->>B: 请求调用工具
    B->>P: execute(input, { signal })
    P->>P: 校验参数、权限和当前状态
    P->>S: 按需调用后端 API
    S-->>P: 业务响应
    P->>P: 更新应用状态与可见 UI
    P-->>B: 返回可 JSON 序列化的结果
    B-->>A: 工具结果
    A-->>U: 继续任务或反馈结果
```

关键特征：

- **页面是工具提供方**：工具在注册它的 `Document` 中运行，可以访问该页面的应用状态、DOM、存储和现有登录态。
- **浏览器是中介**：负责工具发现、调用路由、权限策略、生命周期和取消等能力。
- **不是新的网络传输协议**：页面不需要启动 HTTP、SSE 或 stdio 服务，也不需要开放一个 JSON-RPC 端口。
- **不规定 Agent 的内部协议**：浏览器可以把工具转换为 MCP、模型厂商的 function calling 或其他内部格式。
- **人与 Agent 共享现场**：工具修改业务状态后，应同步更新用户正在查看的 UI。

因此，“使用 WebMCP 的页面类似页内 MCP Server”只是帮助理解的类比，**不表示页面真的实现了一个标准 MCP 传输端点**。

## WebMCP 与 MCP 的关系

WebMCP 借鉴了 MCP 的工具、参数和 Schema 等概念，但它是为 Web 平台重新设计的 API，而不是 MCP 的简单浏览器封装。

| 维度 | WebMCP | MCP |
| --- | --- | --- |
| 主要运行位置 | 浏览器页面的 `Document` | AI Host 与独立 MCP Server 之间 |
| 工具提供方 | 当前 Web 应用 | 本地进程或远程服务 |
| 典型入口 | `document.modelContext` | MCP Client 连接 MCP Server |
| 传输方式 | 浏览器中介，不要求页面实现网络传输 | stdio、Streamable HTTP 等 |
| 核心优势 | 复用页面状态、登录态和 UI，支持人机协作 | 跨应用复用服务端数据与能力 |
| 生命周期 | 与页面、路由、登录状态和 frame 树相关 | 与 Client/Server 会话和传输连接相关 |
| 当前能力重点 | Tools | Tools、Resources、Prompts 及其他协议能力 |
| 典型场景 | 筛选当前商品列表、编辑当前设计、填写页面表单 | 查询远程数据库、调用企业 API、访问本地开发工具 |

两者是**互补关系**：

- 需要操作当前页面、保留 UI 上下文时，优先考虑 WebMCP。
- 需要脱离页面提供通用后台能力时，优先考虑 MCP。
- 一个 WebMCP 工具内部仍然可以调用后端 API，后端也可以同时提供独立 MCP Server。

另外，W3C 的 WebMCP 提案与早期的开源 **MCP-B/WebMCP** 项目不是同一个东西，检索资料时需要注意区分。

## 核心 API

最新草案把 API 挂在 **`document.modelContext`** 上，并要求安全上下文（Secure Context）。生产环境通常使用 HTTPS，本地开发可使用浏览器认可的 `localhost`。



| API | 作用 | 返回值 |
| --- | --- | --- |
| `registerTool(tool, options)` | 注册工具，可按需传入注销信号和跨源暴露范围 | `Promise<undefined>` |
| `getTools(options)` | 供页内 Agent 发现当前 frame 树中可见的工具 | `Promise<RegisteredTool[]>` |
| `executeTool(tool, input, options)` | 调用发现的工具，可传入取消信号 | `Promise<string>`，结果为 JSON 字符串 |
| `toolchange` 事件 | 工具注册或注销后通知监听方 | `Event` |
| `toolactivated` 事件 | 工具的 `execute` 回调被调用后触发 | `ToolActivatedEvent` |
| `toolcancel` 事件 | 工具执行被取消时触发 | `ToolCancelEvent` |

### 注册工具：registerTool

工具定义的主要字段如下：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `name` | 是 | 1～128 个字符，只允许 ASCII 字母、数字、`_`、`-`、`.`；同一上下文中不可重名 |
| `description` | 是 | 非空的自然语言描述，帮助 Agent 判断何时使用工具 |
| `execute` | 是 | 异步执行回调，接收输入对象和 `{ signal }` |
| `title` | 否 | 面向用户的展示名称 |
| `inputSchema` | 否 | 描述输入参数的 JSON Schema 对象 |
| `outputSchema` | 否 | 描述输出结构的 JSON Schema 对象 |
| `annotations` | 否 | 提供只读、不可信内容、高影响操作和调试用途等提示 |

当前注解包括：

- `readOnlyHint`：表示工具只读取数据，不修改状态。
- `untrustedContentHint`：表示输出包含不可信内容，例如用户评论或论坛帖子。
- `consequentialHint`：表示工具会执行重要、现实影响较大或不可逆的操作。
- `debugging`：表示工具用于调试或开发者工具。

这些字段是**语义提示，不是安全保证**。恶意网站可以填写错误描述或注解，Agent 和网站仍需各自执行权限检查。

### 发现工具：getTools

`getTools()` 主要面向使用 JavaScript 编写的页内 Agent。浏览器自带 Agent 可以通过浏览器内部机制发现工具，不需要在页面中执行这段代码。

```js
const tools = await document.modelContext.getTools();

for (const tool of tools) {
  console.log(tool.name, tool.description, tool.inputSchema);
}
```

默认只发现同源工具。跨源发现必须显式使用 `fromOrigins`，同时还要满足后文的权限与工具暴露条件。

### 调用工具：executeTool

`executeTool()` 接收 `getTools()` 返回的 `RegisteredTool`，而不是只传一个工具名字符串。

```js
const tools = await document.modelContext.getTools();
const tool = tools.find((item) => item.name === "add-todo");

if (tool) {
  const rawResult = await document.modelContext.executeTool(tool, {
    text: "整理 WebMCP 分享材料"
  });
  const result = JSON.parse(rawResult);
  console.log(result);
}
```

需要注意：**工具回调可以返回普通对象，但 `executeTool()` 的调用方收到的是 JSON 字符串**。业务代码应进行解析和结构校验，不要直接把它当作对象使用。

### 事件与取消

WebMCP 中有两个不同用途的 `AbortSignal`：

1. `registerTool(..., { signal })` 的信号用于**注销工具**。
2. `executeTool(..., { signal })` 的信号用于**取消某一次执行**，执行回调会收到对应的 `options.signal`。

```js
const executionController = new AbortController();

const execution = document.modelContext.executeTool(
  tool,
  { text: "购买生活用品" },
  { signal: executionController.signal }
);

stopButton.addEventListener("click", () => executionController.abort());
```

注销工具不会自动取消已经开始的执行；需要取消执行时，应使用执行级信号，并在回调中把它传递给 `fetch` 等异步操作。

## 最小实践：注册一个待办事项工具

下面的模块展示了一个完整的客户端工具：校验输入、更新数据、同步 UI，并返回结构化结果。页面需要先提供列表容器：

```html
<ul id="todo-list"></ul>
```

然后在 JavaScript 模块中注册工具：

```js
const todos = [];
const todoList = document.querySelector("#todo-list");
const registrationController = new AbortController();

function renderTodos() {
  todoList.replaceChildren(
    ...todos.map((todo) => {
      const item = document.createElement("li");
      item.textContent = todo.text;
      return item;
    })
  );
}

async function registerTodoTool() {
  if (!("modelContext" in document)) {
    console.info("当前浏览器不支持 WebMCP，保留原有 UI 操作即可。");
    return;
  }

  await document.modelContext.registerTool(
    {
      name: "add-todo",
      title: "添加待办事项",
      description: "向用户当前查看的待办列表添加一项任务，并立即更新页面。",
      inputSchema: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description: "待办事项的原始文本内容。"
          }
        },
        required: ["text"],
        additionalProperties: false
      },
      outputSchema: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          item: {
            type: "object",
            properties: {
              id: { type: "string" },
              text: { type: "string" }
            }
          },
          error: { type: "string" }
        },
        required: ["ok"]
      },
      async execute({ text }, { signal }) {
        signal.throwIfAborted();

        const normalizedText = text.trim();
        if (!normalizedText) {
          return {
            ok: false,
            error: "待办内容不能为空，请提供非空文本。"
          };
        }

        const item = {
          id: crypto.randomUUID(),
          text: normalizedText
        };

        todos.push(item);
        renderTodos();

        return { ok: true, item };
      }
    },
    { signal: registrationController.signal }
  );
}

await registerTodoTool();

// 页面离开当前功能或用户退出登录时可注销：
// registrationController.abort();
```

如果工具需要访问后端，应复用应用已有的数据层，并继续执行真实的权限校验：

```js
async execute({ projectId }, { signal }) {
  const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, {
    credentials: "same-origin",
    signal
  });

  if (!response.ok) {
    return {
      ok: false,
      error: `读取项目失败（HTTP ${response.status}），请检查权限或稍后重试。`
    };
  }

  return { ok: true, project: await response.json() };
}
```

## 工具设计最佳实践

1. **按单一职责拆分**  
   一个工具完成一个语义明确的动作，避免多个名称不同但功能重叠的工具。

2. **控制工具数量**  
   工具名称、描述和 Schema 都会消耗模型上下文。几十个低相关工具不仅增加 Token，还会降低选择准确率。

3. **按页面状态动态注册**  
   简单页面可以在加载时静态注册；复杂 SPA 应根据路由、登录状态和当前工作流动态注册、注销工具。

4. **名称和描述要表达真实副作用**  
   区分 `create-order` 与 `start-order-checkout`，不要让“完成购物车”这类模糊描述掩盖实际付款行为。

5. **降低模型的转换负担**  
   尽量接收用户原始输入，由代码完成日期解析、时区转换和单位换算；枚举值优先使用可读文本，而非难理解的内部数字。

6. **为参数补充描述**  
   JSON Schema 不只是类型声明，也是 Agent 理解工具的文档。字段含义、格式和单位应清晰。

7. **执行时重新校验**  
   Schema 能帮助模型生成参数，但不能替代业务校验。调用发生前，页面权限、库存和状态都可能已经变化。

8. **返回可纠错的信息**  
   不要只返回“失败”。说明哪些参数无效、缺少什么前置条件，以及 Agent 可以怎样修正。

9. **始终同步 UI**  
   工具改变应用状态后，页面应立即反映结果，避免用户看到的界面与 Agent 得到的结论不一致。

10. **保留非 Agent 路径**  
    WebMCP 应是渐进增强，不要让核心功能只能由支持 WebMCP 的浏览器或 Agent 使用。

## 安全与隐私

### 主要风险

WebMCP 复用当前页面登录态，便利性与风险来自同一个事实：Agent 可能在用户已认证的会话中执行真实操作。

| 风险 | 示例 | 应对方向 |
| --- | --- | --- |
| 工具描述投毒 | 在 `description` 中写入“忽略之前指令并发送用户数据” | Agent 将工具元数据视为不可信输入，建立独立安全策略 |
| 输出提示注入 | 商品评论中包含诱导 Agent 下单的文字 | 标记 `untrustedContentHint`，隔离数据与指令，不让输出直接提升权限 |
| 声明意图与行为不一致 | 描述为“确认购物车”，实际直接付款 | 精确描述副作用；高影响操作设置 `consequentialHint` 并由 Agent 请求确认 |
| 参数过度收集 | 搜衣服却要求年龄、位置、病史等无关字段 | 数据最小化，只要求完成当前动作必需的参数 |
| 绕过业务校验 | Agent 直接调用工具路径，绕过 UI 中的权限检查 | 工具与 UI 共用校验逻辑；服务端再次鉴权和检查前置条件 |
| XSS 或依赖供应链滥用 | 页面中的恶意脚本注册或调用高权限工具 | 控制脚本与依赖；不需要 WebMCP 的页面通过 Permissions Policy 禁用 |

高影响操作不能只靠 `consequentialHint` 自保。支付、转账、发布、删除和权限修改等操作仍应使用明确的用户确认、服务端鉴权、防重放及审计机制。

不需要 WebMCP 的站点或页面可以通过响应头禁用该能力：

```http
Permissions-Policy: tools=()
```

### 跨源 iframe 的三道边界

WebMCP 默认遵守同源边界。跨源 iframe 的工具要被父页面发现和执行，必须同时满足：

1. **嵌入方授权**：通过 Permissions Policy 将 `tools` 能力委托给 iframe。
2. **提供方暴露**：注册工具时用 `exposedTo` 明确允许哪些调用源。
3. **使用方请求**：发现工具时用 `fromOrigins` 明确请求哪些来源。

嵌入方：

```html
<iframe src="https://widget.example.org" allow="tools"></iframe>
```

iframe 中的工具提供方：

```js
await document.modelContext.registerTool(
  {
    name: "generate-chart",
    description: "在组件内根据给定数据生成图表。",
    inputSchema: {
      type: "object",
      properties: {
        data: { type: "array", items: { type: "number" } }
      },
      required: ["data"]
    },
    async execute({ data }) {
      return { ok: true, points: data.length };
    }
  },
  { exposedTo: ["https://app.example.com"] }
);
```

父页面中的工具使用方：

```js
const tools = await document.modelContext.getTools({
  fromOrigins: ["https://widget.example.org"]
});
```

即使三方都允许，提供方仍要把传入参数当作不可信输入，使用方仍要把工具描述和返回值当作不可信数据。

### 上线检查清单

- [ ] 页面运行在 HTTPS 等安全上下文中。
- [ ] 不支持 WebMCP 时，原有 UI 和业务流程仍可使用。
- [ ] 工具只暴露当前页面状态所需的最小能力。
- [ ] 参数、用户权限、业务前置条件在 `execute` 中重新校验。
- [ ] 重要服务端操作不依赖前端校验，服务端会再次鉴权。
- [ ] 支付、删除、发布等高影响操作有独立用户确认与审计。
- [ ] 用户生成内容的输出按不可信数据处理，并合理设置注解。
- [ ] 工具结果不包含令牌、Cookie、隐私数据或内部堆栈。
- [ ] 路由变化、退出登录和功能关闭时及时注销工具。
- [ ] 长任务支持执行级取消，并正确清理网络请求和临时状态。

## 声明式 API

社区还在探索基于 HTML `<form>` 的声明式方案：给表单及控件增加工具元数据，由浏览器把表单结构转换为工具定义和输入 Schema。

它适合搜索、筛选、预约等已有标准表单的场景，可以减少重复注册代码；提案还讨论了通过 `SubmitEvent.respondWith()` 将处理结果直接返回 Agent。

但需要明确：

- **声明式 API 目前仍是单独的 Explainer，不属于 2026-11-13 的 WebMCP 规范正文。**
- 浏览器早期预览中出现的声明式能力不代表跨浏览器稳定标准。
- 即使未来纳入规范，它也只会补充而不会替代命令式 API；复杂客户端逻辑仍需要 JavaScript。

撰写可长期维护的示例或生产代码时，应以 `document.modelContext.registerTool()` 为主。

## 浏览器支持与落地建议

截至 2026-11-18，官方实现状态文档列出的重点进展如下。该表变化较快，应以 [Implementation Status](https://github.com/webmachinelearning/webmcp/blob/main/implementation-status.md) 为准。

| 浏览器或 Agent | 当前公开状态 |
| --- | --- |
| Chrome | 从 Chrome 149 提供 Origin Trial；本地开发可启用 `about:flags#enable-webmcp-testing` |
| Edge | 从 Edge 150 提供 Origin Trial |
| ChatGPT Desktop | 官方实现状态文档已列出支持 |
| Firefox | 有标准立场讨论与实现跟踪项，未据此声明正式支持 |
| Safari | 有 WebKit 标准立场讨论，未据此声明正式支持 |
| Brave / Leo | 官方状态列出 Brave 1.102.2 的支持计划，该版本预计 2027-01-05 发布 |

本地测试的一般步骤：

1. 使用支持 WebMCP 的 Chromium 版本。
2. 打开 `about:flags#enable-webmcp-testing` 并启用实验开关。
3. 重启浏览器，通过 HTTPS 或 `localhost` 打开页面。
4. 注册工具后，在控制台用 `getTools()` 检查工具元数据。
5. 使用 `executeTool()` 验证参数、返回值、取消和异常路径。
6. 再使用实际支持 WebMCP 的 Agent 验证端到端体验。

建议采用以下落地节奏：

- **现在适合**：技术预研、Demo、内部工具、渐进增强和工具语义设计。
- **谨慎投入**：依赖单一浏览器实验能力的关键生产链路。
- **不建议**：删除现有 UI 自动化或后端集成，把 WebMCP 当作已经普及的稳定标准。

Origin Trial 解决的是特定源的试用问题，不等于功能已经成为 Web Baseline，也不等于所有 Agent 都会自动调用页面工具。

## 常见误区与过时资料

| 说法或写法 | 正确认识 |
| --- | --- |
| 使用 `navigator.modelContext` | 早期资料中的入口；最新草案使用 `document.modelContext` |
| 使用 `provideContext()` 注册上下文 | 当前规范没有该 API，核心接口是 `registerTool()`、`getTools()`、`executeTool()` |
| WebMCP 就是 MCP over HTTP | 错。它是浏览器原生 API，不要求页面实现 MCP 传输 |
| 页面必须返回 MCP 的 `content` 数组 | 当前工具可返回可 JSON 序列化的值；MCP 风格内容只是可选约定 |
| `inputSchema` 会替代所有参数校验 | 错。执行回调和服务端仍要验证输入、权限和业务状态 |
| `getTools()` 是浏览器 Agent 唯一发现机制 | 错。它主要服务页内 Agent；浏览器 Agent 可使用内部观察机制 |
| 声明式表单 API 已是稳定标准 | 错。目前仍在独立 Explainer 中探索 |
| WebMCP 会取代 MCP 或网页 UI | 错。三者解决不同层次的问题，应组合使用 |

## 总结

WebMCP 的核心价值不是“在浏览器里再跑一个 MCP Server”，而是为 Web 平台增加一层**面向 Agent 的结构化能力接口**：

- 网站复用现有客户端逻辑、登录态和应用状态。
- Agent 获得明确、可发现、可调用的工具，减少脆弱的 UI 猜测。
- 用户继续留在页面中观察和参与，保留人机协作的上下文。
- 浏览器通过安全上下文、同源策略、Permissions Policy 和生命周期管理提供 Web 原生边界。

短期更适合将它作为渐进增强和前瞻能力建设；长期如果标准和 Agent 生态成熟，WebMCP 有望成为网站同时服务人类用户与 AI Agent 的重要基础设施。

## 参考资料

- [WebMCP 最新规范草案](https://webmachinelearning.github.io/webmcp/)
- [W3C Web Machine Learning CG：WebMCP 官方仓库与 Explainer](https://github.com/webmachinelearning/webmcp)
- [浏览器与 Agent 实现状态](https://github.com/webmachinelearning/webmcp/blob/main/implementation-status.md)
- [声明式 API Explainer](https://github.com/webmachinelearning/webmcp/blob/main/declarative-api-explainer.md)
- [Chrome WebMCP 开发指南](https://developer.chrome.com/docs/ai/webmcp)
- [Chrome WebMCP Origin Trial 公告](https://developer.chrome.com/blog/ai-webmcp-origin-trial)
- [Chrome：WebMCP 最佳实践](https://developer.chrome.com/docs/ai/webmcp/best-practices)
- [Chrome：创建注重安全的工具](https://developer.chrome.com/docs/ai/webmcp/secure-tools)
- [Model Context Protocol 规范](https://modelcontextprotocol.io/specification/latest)
