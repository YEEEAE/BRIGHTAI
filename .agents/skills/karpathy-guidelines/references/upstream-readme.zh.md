# Upstream `README.zh.md`

المصدر: `forrestchang/andrej-karpathy-skills`

```md
# 受 Karpathy 启发的 Claude Code 指南

> 查看我的新项目 [Multica](https://github.com/multica-ai/multica) —— 一个用于运行和管理编码智能体的开源平台，支持可复用的技能。
>
> 在 X 上关注我：[https://x.com/jiayuan_jy](https://x.com/jiayuan_jy)

一个单一的 `CLAUDE.md` 文件，用于改善 Claude Code 的行为，源自 [Andrej Karpathy 的观察](https://x.com/karpathy/status/2015883857489522876) 关于 LLM 编码陷阱的总结。

[English](./README.md) | 简体中文

## 问题所在

来自 Andrej 的推文：

> "模型会代你做错误假设，然后不假思索地执行。它们不管理自身的困惑，不寻求澄清，不呈现矛盾，不展示权衡，在应该提出异议时也不反驳。"
>
> "它们真的很喜欢把代码和 API 搞复杂，堆砌抽象概念，不清理死代码……明明 100 行能搞定的事情，非要实现成 1000 行的臃肿架构。"
>
> "它们有时仍会改动或删除自己理解不足的代码和注释，即使这些内容与任务本身无关。"

## 解决方案

四个原则，集中在一个文件中，直接解决这些问题：

- 编码前思考
- 简洁优先
- 精准修改
- 目标驱动执行

## 安装

```text
/plugin marketplace add forrestchang/andrej-karpathy-skills
/plugin install andrej-karpathy-skills@karpathy-skills
```

## 在 Cursor 中使用

仓库中提供了 `.cursor/rules/karpathy-guidelines.mdc`。

## 如何判断它在起作用

- diff 中不必要的改动更少
- 因过度复杂导致的重写更少
- 澄清问题在实现之前提出
- PR 更干净、更精简

## 许可

MIT
```
