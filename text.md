# Web Animation API 技术分享

## 目录

- [Web Animation API 技术分享](#web-animation-api-技术分享)
  - [目录](#目录)
  - [前言：前端动画实现方式](#前言前端动画实现方式)
  - [1. 简介](#1-简介)
  - [2. 基本概念](#2-基本概念)
    - [2.1 Animation（动画对象）](#21-animation动画对象)
    - [2.2 KeyframeEffect（关键帧效果）](#22-keyframeeffect关键帧效果)
    - [2.3 AnimationTimeline（动画时间线）](#23-animationtimeline动画时间线)
  - [3. 核心 API](#3-核心-api)
    - [3.1 Element.animate() 方法](#31-elementanimate-方法)
    - [3.2 Animation 构造函数](#32-animation-构造函数)
    - [3.3 Animation 对象控制](#33-animation-对象控制)
    - [3.4 动画事件](#34-动画事件)
  - [4. 实际应用示例](#4-实际应用示例)
    - [4.1 基础动画示例](#41-基础动画示例)
  - [5. 与 CSS 动画对比](#5-与-css-动画对比)
  - [6. 浏览器兼容性](#6-浏览器兼容性)
  - [7. 性能优化](#7-性能优化)
  - [8. 总结](#8-总结)
  - [demo 网站](#demo-网站)
  - [参考资源](#参考资源)

## 前言：前端动画实现方式

在现代前端开发中，动画已经成为提升用户体验的重要手段。随着技术的发展，前端实现动画的方式也变得多种多样，主要包括以下几种技术：

1. **CSS 过渡（Transitions）**：最简单的动画实现方式，通过定义属性的初始值和结束值，以及过渡时间来实现简单的状态变化动画。
   
2. **CSS 动画（Animations）**：通过 `@keyframes` 规则定义动画的关键帧，可以实现更复杂的动画效果，支持循环、延迟等控制。

3. **JavaScript 定时器动画**：使用 `setTimeout` 或 `setInterval` 来手动更新元素样式，实现动画效果。这是早期常用的方式，但性能较差。

4. **requestAnimationFrame**：浏览器提供的专门用于动画的 API，与屏幕刷新率同步，提供更平滑的动画体验和更好的性能。

5. **Canvas/WebGL 动画**：通过 JavaScript 在 Canvas 或使用 WebGL 绘制和更新图形，适合复杂的图形动画和游戏开发。

6. **SVG 动画**：利用 SVG 的特性实现矢量图形动画，可以通过 CSS 或 SMIL 来控制。

7. **JavaScript 动画库**：如 GSAP、Anime.js、Velocity.js 等，提供了丰富的 API 和便捷的动画控制能力。

8. **Web Animation API**：浏览器原生提供的 JavaScript 动画 API，结合了 CSS 动画的性能和 JavaScript 动画的灵活性。

在这些技术中，Web Animation API 作为一种相对较新的技术，正逐渐获得开发者的关注。它既保留了 CSS 动画的高性能特性，又提供了 JavaScript 的灵活控制能力，是一种值得深入了解的动画实现方案。

## 1. 简介

Web Animation API (WAAPI) 是一个相对较新的 JavaScript API，它提供了一种在 Web 页面上创建和控制动画的强大方式。它结合了 CSS 动画和 JavaScript 动画库的优点，使开发者能够以更灵活、更高效的方式创建复杂的动画效果。


## 2. 基本概念

Web Animation API 主要包含以下几个核心概念：

### 2.1 Animation（动画对象）

Animation 是 Web Animation API 的核心对象，代表一个独立的动画实例。它连接了动画效果（KeyframeEffect）和时间线（AnimationTimeline），负责控制动画的播放状态。

Animation 对象具有以下特点：

- **可控性**：提供了播放、暂停、反向播放、取消等控制方法
- **状态查询**：可以查询动画的当前状态（如播放中、暂停、已完成等）
- **时间控制**：可以设置和获取动画的当前时间、开始时间、播放速率等
- **事件通知**：提供了动画完成、取消等事件的回调机制

创建 Animation 对象的方式有两种：
1. 通过 `Element.animate()` 方法隐式创建
2. 通过 `new Animation()` 构造函数显式创建

```javascript
// 方式1：使用 Element.animate()
const animation1 = element.animate(keyframes, options);

// 方式2：使用 Animation 构造函数
const effect = new KeyframeEffect(element, keyframes, options);
const animation2 = new Animation(effect, document.timeline);
```

### 2.2 KeyframeEffect（关键帧效果）

KeyframeEffect 定义了动画的视觉效果，包括要改变的 CSS 属性、关键帧和时间参数。它描述了"动画做什么"，而不涉及"何时做"或"如何控制"。

KeyframeEffect 包含三个主要组成部分：

1. **目标元素**：要应用动画效果的 DOM 元素
2. **关键帧**：描述动画在不同时间点的状态
3. **时间参数**：如持续时间、迭代次数、缓动函数等

关键帧可以用数组形式定义，每个对象代表一个关键帧：

```javascript
const keyframes = [
  { opacity: 0, transform: 'scale(0.8)' },  // 起始关键帧
  { opacity: 1, transform: 'scale(1)' }     // 结束关键帧
];
```

也可以使用对象形式，明确指定每个属性在各个时间点的值：

```javascript
const keyframes = {
  opacity: [0, 0.7, 1],                    // 三个时间点的透明度
  transform: ['scale(0.8)', 'scale(1.2)', 'scale(1)']  // 三个时间点的缩放
};
```

时间参数通过一个选项对象指定：

```javascript
const options = {
  duration: 1000,           // 持续时间（毫秒）
  iterations: 2,            // 迭代次数
  delay: 500,               // 延迟开始时间
  endDelay: 0,              // 结束后延迟时间
  easing: 'ease-in-out',    // 缓动函数
  direction: 'alternate',   // 方向（正向、反向、交替等）
  fill: 'forwards'          // 填充模式（动画结束后保持最终状态）
};
```

### 2.3 AnimationTimeline（动画时间线）

AnimationTimeline 为动画提供时间参考系统，决定了动画何时开始、如何进行以及如何与其他动画同步。时间线是连接动画与实际时间或其他进度指标（如滚动位置）的桥梁。

目前，Web Animation API 主要实现了 DocumentTimeline，它与文档的加载时间相关联：

```javascript
// 获取文档的默认时间线
const timeline = document.timeline;
```

每个文档都有一个默认的时间线，可以通过 `document.timeline` 访问。当使用 `Element.animate()` 方法时，会自动使用文档的默认时间线。

时间线的主要特性：

- **时间原点**：定义时间为0的参考点
- **当前时间**：提供动画系统的当前时间
- **时间缩放**：某些时间线可能支持时间缩放（如加速或减速）

未来的 Web Animation API 规范可能会引入更多类型的时间线，如：

- **ScrollTimeline**：基于滚动位置的时间线
- **ViewTimeline**：基于元素可见性的时间线

这三个核心概念共同构成了 Web Animation API 的基础架构：KeyframeEffect 定义动画效果，AnimationTimeline 提供时间参考，Animation 将两者连接并提供控制接口。


## 3. 核心 API

### 3.1 Element.animate() 方法

最简单的创建动画的方式是使用 `Element.animate()` 方法：

```javascript
const element = document.querySelector('.box');
const animation = element.animate(
  [
    // 关键帧
    { transform: 'translateX(0px)' },
    { transform: 'translateX(300px)' }
  ], 
  {
    // 时间选项
    duration: 1000,
    iterations: Infinity,
    direction: 'alternate',
    easing: 'ease-in-out'
  }
);
```

### 3.2 Animation 构造函数

除了使用 `Element.animate()` 方法外，还可以使用 `Animation` 构造函数来创建更灵活的动画：

```javascript
// 1. 创建关键帧效果
const element = document.querySelector('.box');
const keyframeEffect = new KeyframeEffect(
  element,                      // 目标元素
  [                             // 关键帧
    { transform: 'scale(1)', opacity: 1 },
    { transform: 'scale(1.5)', opacity: 0.5, offset: 0.7 },
    { transform: 'scale(1)', opacity: 1 }
  ],
  {                             // 时间选项
    duration: 2000,
    iterations: 3,
    easing: 'cubic-bezier(0.42, 0, 0.58, 1)',
    fill: 'forwards'
  }
);

// 2. 创建动画实例
const animation = new Animation(
  keyframeEffect,               // 关键帧效果
  document.timeline             // 时间线
);

// 3. 播放动画
animation.play();
```

使用 `Animation` 构造函数的优势：

- 可以先定义关键帧效果，稍后再播放动画
- 可以在多个动画之间重用相同的关键帧效果
- 可以使用不同的时间线（如 `document.timeline` 或自定义时间线）
- 提供更精细的动画控制和组合能力

### 3.3 Animation 对象控制

一旦创建了动画，我们可以通过返回的 Animation 对象来控制它：

```javascript
// 暂停动画
animation.pause();

// 播放动画
animation.play();

// 反向播放
animation.reverse();

// 取消动画
animation.cancel();

// 完成动画
animation.finish();

// 设置播放速率
animation.updatePlaybackRate(2);

// 将动画当前样式的计算值写入其目标元素的 style 属性中
animation.commitStyles();

// 设置当前时间
animation.currentTime = 500; // 单位为毫秒
```

### 3.4 动画事件

Animation 对象提供了多种事件，可以用来监听动画的状态变化：

```javascript
animation.onfinish = () => {
  console.log('动画完成');
};

animation.oncancel = () => {
  console.log('动画被取消');
};


```

## 4. 实际应用示例

### 4.1 基础动画示例
一个卡片翻转动画：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>卡片翻转动画</title>
  <style>
    .card-container {
      width: 200px;
      height: 300px;
      perspective: 1000px;
      margin: 50px auto;
    }
    .card {
      width: 100%;
      height: 100%;
      position: relative;
      transform-style: preserve-3d;
    }
    .front, .back {
      position: absolute;
      width: 100%;
      height: 100%;
      backface-visibility: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      border-radius: 10px;
    }
    .front {
      background-color: #3498db;
      color: white;
    }
    .back {
      background-color: #e74c3c;
      color: white;
      transform: rotateY(180deg);
    }
    button {
      display: block;
      margin: 20px auto;
      padding: 10px 20px;
    }
  </style>
</head>
<body>
  <div class="card-container">
    <div class="card">
      <div class="front">正面</div>
      <div class="back">背面</div>
    </div>
  </div>
  
  <button id="flip">翻转卡片</button>

  <script>
    const card = document.querySelector('.card');
    let flipped = false;
    
    // 创建动画但不立即播放
    const flipAnimation = card.animate(
      [
        { transform: 'rotateY(0deg)' },
        { transform: 'rotateY(180deg)' }
      ],
      {
        duration: 600,
        easing: 'ease-in-out',
        fill: 'forwards'
      }
    );
    
    // 初始状态为暂停
    flipAnimation.pause();
    
    document.getElementById('flip').addEventListener('click', () => {
      if (flipped) {
        flipAnimation.playbackRate = -1; // 反向播放
      } else {
        flipAnimation.playbackRate = 1; // 正向播放
      }
      
      flipAnimation.play();
      flipped = !flipped;
    });
  </script>
</body>
</html>
```

## 5. 与 CSS 动画对比

Web Animation API 与 CSS 动画相比有以下优势：

| 特性 | Web Animation API | CSS 动画 |
|------|-------------------|----------|
| 动态控制 | 可以通过 JS 完全控制动画状态 | 有限的控制能力 |
| 性能 | 与 CSS 动画相当 | 优秀 |
| 复杂度 | 可以创建更复杂的动画序列 | 复杂动画需要大量代码 |
| 事件处理 | 提供丰富的事件回调 | 有限的事件支持 |
| 关键帧生成 | 可以动态生成关键帧 | 关键帧需要预定义 |

## 6. 浏览器兼容性

Web Animation API 在现代浏览器中的支持情况：

https://caniuse.com/?search=web%20animation%20api

对于不支持的浏览器，可以使用 [web-animations-js](https://github.com/web-animations/web-animations-js) polyfill：

```html
<script src="https://cdn.jsdelivr.net/npm/web-animations-js@2.3.2/web-animations.min.js"></script>
```

## 7. 性能优化

使用 Web Animation API 时的性能优化建议：

1. **使用 transform 和 opacity 属性**：这些属性可以由 GPU 加速
   
   ```javascript
   // 好的做法
   element.animate([
     { transform: 'translateX(0)' },
     { transform: 'translateX(100px)' }
   ], 1000);
   
   // 避免这样做
   element.animate([
     { left: '0px' },
     { left: '100px' }
   ], 1000);
   ```

2. **避免同时动画过多元素**：这可能导致性能问题

3. **使用 will-change 属性**：创建独立的图层

   ```css
   .animated-element {
     will-change: transform, opacity;
   }
   ```

## 8. 总结

Web Animation API 为前端开发者提供了一种强大的创建和控制动画的方式，它结合了 CSS 动画的性能和 JavaScript 的灵活性。通过本次分享，我们了解了：

- Web Animation API 的基本概念和核心 API
- 如何创建和控制动画
- 实际应用示例
- 与 CSS 动画的对比
- 浏览器兼容性和性能优化

随着浏览器支持的不断完善，Web Animation API 将成为前端动画开发的重要工具。


## demo 网站

1. **Web Animations API Demos**：
   - https://web-animations.github.io/web-animations-demos/
   - 这是官方提供的一系列演示，展示了 Web Animation API 的各种功能和用例。

2. **CodePen 上的 WAAPI 示例**：
   - https://codepen.io/Kevin-Loeng/pen/GvBgbr
   - 使用 animation api 实现的轮播图效果

3. **Animista**：
   - https://animista.net/
   - 提供了丰富的 CSS 动画效果，可以作为 Web Animation API 的参考。

## 参考资源

- [MDN Web Animation API 文档](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API)
- [CSS-Tricks 上的 Web Animation API 介绍](https://css-tricks.com/css-animations-vs-web-animations-api/)
- [Web Animation API 规范](https://www.w3.org/TR/web-animations-1/)
- [CSS3 动画 animation学习笔记 之 属性详解简单介绍 - 掘金](https://juejin.cn/post/7299671709476094004)
- [Web 动画技术概览](https://zhangqiang.work/notes/n2202_web_animation)
