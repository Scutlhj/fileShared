# 《Clean Code》读书笔记（第7-13章）

## 第7章 错误处理

### 我的理解
+ 错误处理是代码质量的重要组成部分，尤其在前端开发中，错误处理不仅影响用户体验，还直接关系到系统的稳定性。前端开发中常见的错误包括网络请求失败、用户输入无效、组件状态异常等。整洁的错误处理代码应避免混乱，做到清晰、简洁，并能快速定位问题。
+ 之前就遇到过一个很棘手的错误，在路由真机中能复现，但是Proxy模式下没问题，目前真机的代码都是经过混淆的，调试起来非常困难。组里目前有请求解密插件，可以应对大部分的异常情况。

### 最佳实践
1. **使用异常而非返回错误码**：在前端中，推荐使用`try-catch`捕获异常，而不是通过返回值判断错误。
2. **封装错误处理逻辑**：将错误处理逻辑抽离到统一的模块中，避免重复代码。
3. **避免传播null**：使用默认值或空对象模式，减少`null`检查的复杂性。
4. **避免掩盖错误**：不要将异常在`catch`中直接不管，否则后期代码出现问题时不好debug

### 示例代码
```typescript
// 封装错误处理
async function fetchData(url: string): Promise<any> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("数据获取失败:", error);
        return { error: "数据加载失败，请稍后重试" };
    }
}

// 使用空对象模式
function getUserName(user: { name?: string } = {}): string {
    return user.name || "匿名用户";
}
```

---

## 第8章 边界

### 我的理解
+ 系统与第三方代码（开源库、商业组件、跨团队模块）的交互区域称为边界，需通过设计隔离技术细节与业务逻辑‌
+ 第三方接口追求通用性 vs 业务需求要求针对性，导致集成复杂度上升‌
+ 前端开发中，边界问题主要体现在与后端接口的交互、第三方库的使用等方面。通过隔离外部依赖，可以降低耦合度，提高代码的灵活性和可维护性。
+ 项目中有一些服用的第三方库，如`axios`、`vue-router`、`pina`等等，目前都是有进行封装的，封装之后方便了开发人员调用。
+ 之前做 IPC Web 时也有对夏令时进行封装，业务越复杂就越需要进行抽取封装，方便后期进行维护

### 最佳实践
1. **使用适配器模式**：为后端接口或第三方库创建适配器，避免直接依赖具体实现。
2. **定义接口文档**：通过TypeScript的接口定义，明确输入输出，减少边界问题。
3. **模拟边界测试**：使用Mock工具（如`jest.mock`）模拟外部依赖，确保边界代码的可靠性。

### 示例代码
```typescript
// Bad: 直接依赖ECharts实例
mounted() {
  const chart = echarts.init(this.$refs.chart);
  chart.setOption({/* 复杂配置项 */});
}

// Good: 创建图表适配器层
class ChartAdapter {
  private instance: ECharts;
  
  constructor(dom: HTMLElement) {
    this.instance = echarts.init(dom);
  }

  updateOptions(options: EChartsOption) {
    this.instance.setOption(options);
  }
}
```

---

## 第9章 单元测试

### 我的理解
+ 单元测试是前端开发中不可或缺的一部分。通过单元测试，可以验证组件、函数的正确性，避免因代码变更引入的潜在问题。整洁的单元测试应遵循FIRST原则（快速、独立、可重复、自验证、及时）。
+ 好的单元测试会减少后期维护的成本，根据单元测试的结果很容易发现哪里的逻辑有问题
+ 单元测试最好拆分的足够细，但是一些非常简单的函数一般不需要编写测试，减少编写测试代码的时间（可以用AI帮忙编写测试代码）

### 最佳实践
1. **测试核心逻辑**：优先测试核心业务逻辑，而非实现细节。
2. **编写有意义的测试名称**：测试名称应清晰描述测试目的。
3. **使用Mock和Stub**：隔离外部依赖，专注于测试目标。
4. **基于TDD开发**：先编写测试，后进行开发

### 示例代码
```typescript
// 自定义hook测试
describe('usePagination', () => {
  test('should reset page when filter changes', () => {
    const { page, applyFilter } = usePagination()
    applyFilter({ type: 'new' })
    expect(page.value).toBe(1)
  })
})

// 组件测试
test('emits submit event', async () => {
  const wrapper = mount(LoginForm)
  await wrapper.find('button').trigger('click')
  expect(wrapper.emitted('submit')).toBeTruthy()
})
```

---

## 第10章 类

### 我的理解
+ 在前端开发中，类的设计应遵循单一职责原则（SRP），即一个类只负责一件事。过于复杂的类会导致代码难以维护，而小而专注的类则更易于扩展和测试。

### 最佳实践
1. **拆分职责**：将复杂的类拆分为多个小类，每个类只负责一个职责。
2. **使用依赖注入**：通过构造函数注入依赖，减少类之间的耦合。
3. **避免过度设计**：在前端开发中，尽量避免不必要的类设计，优先使用函数式编程。

### 示例代码
```typescript
// 单一职责原则
class AuthService {
    login(username: string, password: string): boolean {
        // 登录逻辑
        return true;
    }
}

class UserService {
    getUserDetails(userId: string): object {
        // 获取用户信息逻辑
        return { id: userId, name: "John Doe" };
    }
}

// 使用依赖注入
class UserController {
    constructor(private authService: AuthService, private userService: UserService) {}

    handleLogin(username: string, password: string): object {
        if (this.authService.login(username, password)) {
            return this.userService.getUserDetails("123");
        }
        return { error: "登录失败" };
    }
}
```

---

## 第11章 系统

### 我的理解
+ 系统设计是前端开发中的高级话题，涉及到组件架构、状态管理、模块化等内容。通过分层架构和高层次抽象，可以设计出灵活、可扩展的系统。

### 最佳实践
1. **分层架构**：将系统分为UI层、业务逻辑层和数据层，降低耦合度。
2. **状态管理**：使用Vuex、Pinia等工具集中管理状态，避免组件间的状态混乱。
3. **高层次抽象**：通过抽象接口和通用组件，减少重复代码。
4. **模块化设计**：使用前端脚手架快速搭建标准目录结构

### 示例代码
```typescript
// 问题实现：直接依赖Pinia
// components/UserForm.vue
import { useStore } from '~/store';

export default {
  setup() {
    const store = useStore();
    
    const submit = () => {
      store.commit('SUBMIT_FORM');
    };
  }
}

// 优化方案：抽象存储接口
// interfaces/AuthRepository.ts
export interface AuthRepository {
  submitForm(data: FormData): Promise<void>;
}

// 实现Pinia存储
// repositories/PiniaAuthRepo.ts
export class PiniaAuthRepo implements AuthRepository {
  constructor(private store: Store) {}
  
  async submitForm(data: FormData) {
    await this.store.dispatch('auth/submit', data);
  }
}

// 依赖注入
// main.ts
const app = createApp(App);
const authRepo = new PiniaAuthRepo(useStore());
app.provide('authRepo', authRepo);

// 组件调用
export default defineComponent({
  inject: ['authRepo'],
  
  setup() {
    const submit = (data: FormData) => {
      authRepo.submitForm(data);
    };
    
    return { submit };
  }
});
```

---

## 第12章 迭代

### 我的理解
+ 迭代是代码优化的核心思想。在前端开发中，迭代体现在持续重构、优化性能、改进用户体验等方面。通过小步快跑的方式，可以降低重构风险，同时保持代码的可用性。

### 最佳实践
1. **持续重构**：定期审查代码，发现并修复技术债务。
2. **小步快跑**：每次只修改一小部分代码，确保功能正常。
3. **自动化测试**：在重构前后运行测试，确保代码行为一致。
4. **通过Sonar扫描监控代码坏味道**

### 示例代码
```typescript
// 阶段1：松散类型
function parse(data: any) { return data.map(item => item.name) }

// 阶段2：基础接口
interface RawData { name: string }
function parse(data: RawData[]) { ... }

// 阶段3：严格校验
function isValidData(data: unknown): data is RawData[] {
  return Array.isArray(data) && data.every(item => 'name' in item);
}
```

---

## 第13章 并发编程

### 我的理解
+ 异步编程在前端中十分常见，网络请求（fetch）、定时器（setTimeout）、事件处理（click）等
+ JavaScript是一种单线程语言，意味着它在执行一段代码时只能运行一个任务。这就需要借助事件循环（Event Loop）的机制来实现并发。前端开发人员应对事件循环机制足够理解，才能更好进行开发
+ 当需要处理大量数据或进行复杂的计算时，可以使用Web Worker将这些耗时的操作放到后台线程中，以防止主线程的阻塞。


### 最佳实践
1. **避免回调地狱**：使用Promise和async/await可以大幅度提高代码的可读性，避免回调地狱的问题。
2. **防抖（Debounce）与节流（Throttle）**：控制高频事件触发（如搜索框输入、滚动事件），提升页面整体性能
3. **错误处理**：在并发编程中，处理错误变得更加复杂。Promise中的.catch()可以捕获错误，但在使用async/await时需要通过try/catch来显式处理。

### 示例代码
```typescript
async function loadData() {
  try {
    const data1 = await fetchApi1();
    const data2 = await fetchApi2(data1.id);
    return { data1, data2 };
  } catch (error) {
    showErrorToast(error.message);
  }
}
```

---

通过学习《Clean Code》第七到第十三章，我深刻体会到编写整洁代码的重要性。无论是错误处理、边界设计，还是单元测试、系统架构，并发编程，每一个环节都对代码质量有着深远的影响。结合前端开发的实际场景，我将这些原则应用到日常工作中，提升代码的可读性和可维护性的同时也让团队协作更加高效。