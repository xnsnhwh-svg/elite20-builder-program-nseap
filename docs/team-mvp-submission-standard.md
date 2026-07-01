# Team MVP Submission Standard

本标准用于 Elite20 Builder Program / NSEAP 二期各小组提交 MVP 成果。

核心要求很简单：每个小组不要只提交一个零散文件，而是提交一份能被别人看懂、评审、合并、继续迭代的模块成果。

## 结论先行

每个 Builder Team 至少提交两类内容：

1. 模块说明文档
2. 可展示成果

模块说明文档用于讲清楚“这个模块为什么存在、解决什么问题、怎么服务 NSEAP 整体系统”。可展示成果用于证明“这个模块已经有 MVP，不只是想法”。

推荐提交形式：

```text
README.md / PRODUCT-SPEC.md / PRODUCT-SPEC.docx
prototype.html / demo link / GitHub repo / template files / schema files
```

## 每组必须说明的内容

每个小组提交时，建议至少回答下面 8 个问题。

```text
1. 模块定位
这个模块属于七个 Builder Team 中的哪一组？在 NSEAP AI Learning Operating System 里负责哪一层？

2. 解决的问题
它解决什么具体问题？为什么二期需要它？

3. 目标用户
谁会用它？学生、老师、Builder、Agent、管理员，还是企业/学校部署方？

4. 当前 MVP
现在已经做出了什么？是文档、模板、Demo、Schema、Agent Prompt、流程图，还是可运行代码？

5. 可展示成果
别人能打开看什么？HTML、截图、GitHub 链接、Demo 页面、样例文件都可以。

6. 和其他组的接口
它需要其他组提供什么？它又能给其他组提供什么？

7. 下一步计划
v0.1 之后准备补什么？哪些是必须补，哪些是以后再做？

8. GitHub 提交信息
PR 链接、提交路径、负责人、当前状态。
```

## 方向校验模板

每个小组都建议在提交文档里加一个“方向校验”小节。

可以直接复制下面模板填写：

```text
## 方向校验

- 对应小组：
- 对应模块：
- 服务目标：
- 当前 MVP：
- 可复用对象：
- 与其他组接口：
  - Curriculum Team：
  - Challenge Team：
  - Agent Team：
  - Ontology Team：
  - Platform Team：
  - Knowledge Team：
  - Demo Team：
- 当前状态：
- 下一步：
```

## 推荐目录结构

每个小组可以按下面方式组织文件：

```text
team-name/
  README.md
  PRODUCT-SPEC.md
  prototype.html
  templates/
  schemas/
  examples/
  docs/
```

不一定每组都需要全部目录，但至少要有一个入口文件，让别人知道从哪里开始看。

## GitHub 提交流程

每个小组提交时，建议走统一流程：

```text
发现问题
-> 提出方案
-> AI 辅助开发
-> GitHub 提交
-> Peer Review
-> Agent Review
-> Merge
-> Documentation
-> Release
```

PR 标题建议使用：

```text
Team X: Add/Update 模块名称 MVP
```

例如：

```text
Team 6: Add Knowledge Cognitive Cell MVP
Team 2: Add Challenge Library MVP
Team 4: Add Agent Library MVP
```

PR 描述建议包含：

```text
## Summary
本次提交完成了什么。

## Deliverables
- 交付物 1
- 交付物 2
- 交付物 3

## Direction Check
说明它如何服务 NSEAP 整体系统，以及如何和其他组配合。

## Next Step
下一步准备补什么。
```

## 群里可直接发送的版本

```text
各位同学，后续每个 Builder Team 提交 MVP 时，建议统一按“模块说明文档 + 可展示成果”的格式提交。

模块说明文档要讲清楚：
1. 这个模块是什么
2. 解决什么问题
3. 给谁用
4. 当前 MVP 做到了什么
5. 和 NSEAP 整体系统的关系
6. 和其他组怎么配合
7. 下一步计划
8. GitHub PR 或提交路径

可展示成果可以是：
HTML 原型、Demo 页面、GitHub Repo、模板库、Schema、Agent Prompt、流程图、样例文件等。

重点不是做得多漂亮，而是别人能打开、能看懂、能评审、能继续迭代。

以后每组提交时，请尽量加一个“方向校验”小节，说明这个模块属于哪一组、服务 NSEAP 哪一层、能给其他组提供什么、下一步怎么接入整体系统。

这样我们最后才能把七个组的成果拼成一个完整的 NSEAP AI Learning Operating System，而不是七个分散的小作业。
```
