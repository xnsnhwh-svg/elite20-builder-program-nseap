# Elite20 / NSEAP 二期建设任务与分工说明

## 0. 结论先行

二期要做的不是重新上一遍 Elite20 课程，也不是简单整理课件或提交作业。

二期的核心任务是：

> 把一期 Elite20 / AI+X 实验班探索出来的课程、Challenge、Agent、项目、知识和协作机制，重构成一套可复用、可部署、可持续演化的 NSEAP AI Learning Operating System MVP。

更直白地说，二期要交付的是一套系统，而不是一组零散材料。

这套系统至少包含七类核心模块：

1. Curriculum / Course：课程体系
2. Challenge Library：挑战库
3. Learning Platform：学习平台
4. Agent Library：智能体库
5. Ontology Structure：本体结构
6. Knowledge Base：知识库
7. Demo / Presentation：展示与传播

当前 GitHub 主仓库：

https://github.com/a976xw7td/elite20-builder-program-nseap

主仓库是二期 Builder Program 的统一协作、提交、评审和沉淀入口。

## 1. 二期到底要做什么

根据 Richard 的要求，二期项目的目标可以概括为：

```text
重新构建一门 AI Native 课程
并把它产品化、系统化、可复制化
```

项目结束后，希望任何学校、企业或培训机构只需要部署这套系统，就可以运行类似课程。

因此，二期不是单纯产出：

- PPT
- 作业
- 课堂笔记
- 零散代码

而是要沉淀：

- 课程体系
- Challenge Catalog
- Agent Library
- Ontology
- Knowledge Base
- GitHub 协作流程
- 评审机制
- 部署与演示材料

## 2. 二期包含哪些内容

### 2.1 Course / Curriculum

目标：重构课程本身。

包括：

- Syllabus
- Learning Objectives
- Weekly Plan
- Lecture Notes
- Slides
- Labs
- Assignments

### 2.2 Challenge Library

目标：把一期的挑战式学习机制系统化。

包括：

- Challenge Catalog
- Challenge Template
- Rubrics
- Evaluation
- Builder Edition Challenge

每个 Challenge 不只是“完成作业”，而是要尽量沉淀成：

- Skill
- Task Agent
- Knowledge Base 条目
- Ontology 更新
- 可复用示例

### 2.3 Learning Platform

目标：搭建课程运行和协作平台。

包括：

- GitHub Organization / Repository
- Website
- LMS
- Documentation Portal
- Deployment
- Dashboard

现阶段不急于先做完整 LMS，优先把 GitHub 协作流程跑通。

### 2.4 Agent Library

目标：为课程开发可复用 Agent。

包括：

- Student Companion
- Instructor / Tutor
- Reviewer
- Project Manager
- Evaluation Agent
- Coding Coach
- Knowledge Librarian

第一阶段优先：

- Project Manager Agent
- Coding Coach Agent
- Evaluation Agent

### 2.5 Ontology Structure

目标：建立课程、技能、挑战、项目、评估之间的语义结构。

包括：

- Course Ontology
- Skill Ontology
- Challenge Ontology
- Project Ontology
- Assessment Ontology
- Learning Ontology
- Knowledge Graph

### 2.6 Knowledge Base

目标：把课程资料、优秀代码、最佳实践、Prompt、FAQ、项目案例沉淀为统一知识库。

包括：

- Documentation
- Tutorial
- Prompt Library
- Video
- Best Practice
- FAQ
- Project Cases

### 2.7 Demo / Presentation

目标：让二期成果可以被展示、传播和复用。

包括：

- Demo Website
- Demo Video
- Presentation
- Promotion Materials
- Showcase

## 3. 七个 Builder Team 分工

根据 Richard 的原始设计，二期建议分为七个 Builder Team。

| Team | 负责内容 | 主要输出 | GitHub 目录 |
|---|---|---|---|
| Team 1 Curriculum Team | 重新设计课程 | Syllabus、Lecture、Slides、Labs、Assignments | `teams/curriculum-team/` |
| Team 2 Challenge Team | 设计所有 Challenge | Challenge Catalog、Rubrics、Evaluation | `teams/challenge-team/` |
| Team 3 Agent Team | 开发课程 Agent | Companion、Tutor、Reviewer、Project Manager、Evaluation | `teams/agent-team/` |
| Team 4 Ontology Team | 建立本体和知识图谱 | Skill Ontology、Learning Ontology、Knowledge Graph | `teams/ontology-team/` |
| Team 5 Platform Team | 平台与部署 | GitHub、Website、LMS、Deployment | `teams/platform-team/` |
| Team 6 Knowledge Team | 知识沉淀 | Documentation、Tutorial、Prompt Library、Video、Best Practice | `teams/knowledge-team/` |
| Team 7 Demo Team | 演示与传播 | Website Demo、Demo Video、Presentation、Promotion | `teams/demo-team/` |

## 4. 当前接龙任务归类

根据当前接龙信息，任务可以先按七个 Builder Team 归类如下。

### Team 1 Curriculum Team

| 成员 | 模块 | 时间 |
|---|---|---|
| 张浩 | Team 1 Curriculum | 7/1 |

### Team 2 Challenge Team

| 成员 | 模块 | 时间 |
|---|---|---|
| 刘婷婷 | Challenge Library | 7/1 |
| 史雨萱 | Challenge Library | 7/4 |

### Team 3 Agent Team

| 成员 | 模块 | 时间 |
|---|---|---|
| 冯静雯 | Agent Library | 7/1 |
| 张照航 | Agent Library | 7/3 |
| 陈万康 | Agent Library | 7/1 |

### Team 4 Ontology Team

| 成员 | 模块 | 时间 |
|---|---|---|
| Richard | Ontology Structure | 6/30 |

### Team 5 Platform Team

| 成员 | 模块 | 时间 |
|---|---|---|
| 吴嘉宇 | Learning Platform | 7/1 |
| 牛保康 | Learning Platform | 7/1 |

### Team 6 Knowledge Team

| 成员 | 模块 | 时间 |
|---|---|---|
| 尹镇宇 | Knowledge Base Building | 7/1 |

### Team 7 Demo Team

| 成员 | 模块 | 时间 |
|---|---|---|
| 张浩 | Demo / Presentation | 7/1 |

## 5. GitHub 提交方式

当前建议：

```text
一个共享主仓库
+ 七个 Team 工作区
+ 可选个人/小组工作仓库
+ 最终必须登记回主仓库
```

### 5.1 文档、模板、方案类内容

如果模块主要是：

- 文档
- 模板
- 方案
- Prompt
- Ontology
- Rubric
- Agent 说明
- Challenge 设计

建议直接提交到主仓库对应 Team 文件夹。

例如：

```text
teams/challenge-team/challenge-catalog/
teams/ontology-team/skill-ontology/
teams/knowledge-team/prompt-library/
```

### 5.2 独立可运行项目

如果模块是：

- 网站
- Agent 服务
- LMS 原型
- 可运行工具
- 独立代码项目

可以自己建工作仓库。

但必须在主仓库对应 Team 目录下登记：

```text
项目名称
负责人 / 成员
仓库链接
Demo 链接
当前状态
和 NSEAP 的关系
Review 状态
下一步计划
```

### 5.3 推荐统一说法

```text
主仓库作为统一提交和沉淀入口。

文档、模板、方案、Prompt、Ontology、Rubric 等内容，可以直接提交到对应 team 文件夹。

独立可运行项目可以自己建工作仓库，但需要回到主仓库登记链接、说明、状态和下一步。

也就是说：可以自己建仓库干活，但最终要回到主仓库登记和接受 Review。
```

## 6. 每个组本周最小交付建议

### Team 1 Curriculum Team

本周最小交付：

- `syllabus/README.md`
- `weekly-plan/week-01.md`
- `learning-objectives.md`

重点回答：

- 课程要培养什么能力？
- Week 1 如何让老师能直接授课？
- 每周如何连接 Challenge？

### Team 2 Challenge Team

本周最小交付：

- `challenge-catalog/README.md`
- `challenge-catalog/C01.md`
- `rubrics/default-rubric.md`

重点回答：

- 一期 C1-C10 如何整理成二期 Challenge Catalog？
- 每个 Challenge 如何成为 Skill / Agent 的生产单元？
- Rubric 如何统一？

### Team 3 Agent Team

本周最小交付：

- `evaluation-agent/README.md`
- `coding-coach-agent/README.md`
- `project-manager-agent/README.md`

重点回答：

- Agent 服务什么 Situation？
- 输入输出是什么？
- 能力边界是什么？
- 和 Challenge / Rubric / GitHub 如何连接？

### Team 4 Ontology Team

本周最小交付：

- `skill-ontology/README.md`
- `learning-ontology/README.md`
- `knowledge-graph/README.md`

重点回答：

- Course、Skill、Challenge、Project、Assessment 如何关联？
- 哪些字段需要结构化？
- 后续如何形成 JSON Schema / Knowledge Graph？

### Team 5 Platform Team

本周最小交付：

- `github/README.md`
- `website/README.md`
- `deployment/README.md`

重点回答：

- GitHub 如何作为正式提交入口？
- Website / LMS / Docs Portal 的最小版本是什么？
- 可运行项目如何登记和部署？

### Team 6 Knowledge Team

本周最小交付：

- `documentation/README.md`
- `prompt-library/README.md`
- `best-practices/README.md`

重点回答：

- 一期资料如何分类？
- AI 日志、Prompt、踩坑、优秀作业如何沉淀？
- Knowledge Base 如何为 Agent 提供上下文？

### Team 7 Demo Team

本周最小交付：

- `presentation/README.md`
- `demo-video/README.md`
- `promotion/README.md`

重点回答：

- 二期成果如何展示？
- 谁是观众？
- Demo 如何体现 NSEAP 而不只是展示网页？

## 7. 当前仓库对应入口

GitHub 主仓库：

https://github.com/a976xw7td/elite20-builder-program-nseap

七个 Team 目录：

```text
teams/curriculum-team/
teams/challenge-team/
teams/agent-team/
teams/ontology-team/
teams/platform-team/
teams/knowledge-team/
teams/demo-team/
```

团队分工说明：

```text
teams/team-roadmap.md
```

提交方式说明：

```text
teams/github-submission-guide.md
```

一期背景与经验分析：

```text
docs/phase1-background-summary.md
```

## 8. 附录：一期经验为什么重要

一期 `实验班1群` 和 `精英班群` 说明：

- Challenge 驱动学习是有效的
- GitHub 作为正式 artifact 入口是必要的
- AI 日志、AAR、Prompt、Skill、Agent 都应成为交付物
- Peer Review 和 Agent Review 应成为学习机制
- 真实项目是课程后半段的自然延伸
- 班级自治、项目协同、成果传播需要明确团队分工

因此，二期不是另起炉灶，而是把一期已经探索出来的机制系统化、标准化、产品化。



---

# Elite20 / AI+X 实验班一期背景与经验整理

## 1. 文档目的

本文基于以下两个群聊资料整理：

- `实验班1群`：选拔前后的开放群与挑战试炼过程
- `精英班群`：正式入选后的 Elite20 / AI+X 实验班学习、项目、协作与成果推进过程

本文是 `phase2-builder-task-plan.md` 的背景附录，不是逐条聊天记录摘录。

它用于支撑二期 NSEAP / Elite20 Builder Program 设计，重点回答：

- 一期是如何从宣传、选拔、挑战走向正式实验班的？
- 一期实际形成了哪些有效机制？
- 哪些经验应该进入二期 Builder Operating System？
- 当前 GitHub 仓库为什么要按 Challenge、Agent、Ontology、Knowledge Base、Team 分工来组织？

## 2. 一期整体发展脉络

一期大致经历了以下阶段：

```text
全校宣传 / 项目需求征集
-> 建立选拔群
-> 发布先修课与开放挑战
-> 通过 Challenge、分享、提交和面试筛选成员
-> 建立精英班群
-> 正式开班
-> Challenge 驱动学习
-> GitHub / Skill / Agent 工程化
-> 班级自治与工具环境建设
-> 真实项目报名与推进
-> 红队挑战 / 阶段展示 / 路演
-> 实习、就业、竞赛与成果传播
```

从这个过程可以看出，一期并不是传统课程，而是一个以挑战、项目、工具、互评和真实交付为核心的 AI Native 学习实验。

## 3. 实验班1群：选拔与挑战试炼阶段

实验班1群主要承担了“发现人、激活人、筛选人”的作用。

### 3.1 选拔不是考试，而是开放挑战

群中早期发布了多个挑战，例如：

- C1：课程资料翻译与整理
- C2：AI4Math 论文冲刺
- C2A：提案生成 / Kaggle 类挑战
- C3C：双人协作与技能迁移
- C4 系列：Skill / Agent / 工具链相关挑战
- C4A：技能提交自动评审器
- C4B：公众号文章生成技能
- C4C：作业自动求解与排版
- C4D：本地大模型 Agent 技能
- C5 / C6 / C7 / C8 / C9 / C10 等后续挑战

这些挑战共同构成了“以真实行动筛选 Builder”的机制。

### 3.2 选拔看重的不是单一成绩

从群聊内容看，选拔标准强调：

- 执行力：能否快速做出东西
- 自驱力：能否自己安装、探索、解决问题
- AI 协作能力：是否会使用 prompt、skill、agent、model
- 反思能力：是否记录 AI 日志、成本、幻觉、迭代过程
- 共享能力：是否在群里分享流程、踩坑、经验
- 质疑与改进能力：是否能指出材料过时、提出改进建议
- 真实交付能力：是否能把结果做成别人可复用的材料

这说明一期的选拔机制本质上已经接近 Builder Program，而不是普通课程报名。

### 3.3 Challenge 已经天然具备 Task Skill / Task Agent 雏形

例如 C4A 的任务是：

```text
扫描群文件夹
-> 识别 C4 提交
-> 检查必须文件
-> 按条件评审质量
-> 生成报告
```

这已经非常接近一个 Evaluation Agent 或 Review Skill。

再如 C4B、C4C、C4D，分别对应：

- 内容发布 Skill
- 作业求解与排版 Skill
- 本地模型 Agent Skill

这说明一期很多 Challenge 本身已经不只是“作业”，而是在生产可复用 Skill。

## 4. 精英班群：正式学习与项目化阶段

精英班群标志着从“选拔试炼”进入“正式 Builder 学习与共建”。

### 4.1 正式阶段强化 GitHub

精英班群中明确出现了多个关键要求：

- 所有人需要设置 GitHub
- 后续 Challenge 提交需要 GitHub repo
- Skill、CLI、微信/飞书集成能力应放到 GitHub 仓库
- LaTeX 论文可通过 Overleaf 与 GitHub 同步
- GitHub 不只是代码存放处，而是项目交付和作品集的一部分

这直接支持二期将 GitHub 作为正式提交、评审和沉淀入口。

### 4.2 学习方式从“听课”转向“互评、复现、改进”

群里反复强调：

- 抄作业、被别人抄作业、帮别人抄作业都有价值
- 批评别人的作业、邀请别人批评自己的作业，是更高阶能力
- 不是只完成项目，更重要的是评审与优化
- 对标高水平成果，复现后再改进

这说明二期系统必须支持：

```text
Peer Review
Agent Review
优秀作业复用
Best Practice 沉淀
Knowledge Base 更新
```

### 4.3 Challenge 成为正式课程主线

正式阶段明确提出：

- 所有挑战作业必须完成
- C1-C7 中每项至少要完成一个方向
- C8 或 C9 必做一个
- C10 必做
- C4、C5 需要独立作品
- C7 需要公共平台发布

这说明二期需要的不只是零散 Challenge，而是 Challenge Catalog、Rubric、提交规范、进度追踪和评审机制。

### 4.4 工具环境成为学习基础设施

精英班群中反复出现：

- GitHub
- 飞书
- 微信
- Mac mini / 云端环境
- OpenAI / 硅基流动 token
- Hermes Agent
- OpenClaw
- 火山引擎 Coding Plan
- Agent 工具和 Skill

这说明二期平台不应只考虑 LMS，而应把 GitHub、飞书/微信、Agent 工具、算力/模型资源纳入整体协作环境。

## 5. 真实项目阶段：从 Challenge 到真实交付

5 月后，精英班逐渐进入真实项目阶段。

关键机制包括：

- 发布真实项目材料
- 项目报名
- 每位同学担任一个项目负责人
- 可作为协作者参与其他项目
- 项目负责人需要与项目方对接
- 需要填写项目任务书
- 需要老师和学生背书才能做自选项目
- 项目需要控制在可完成范围内
- 项目推进中强调需求调研、分工、接口、测试和交付

这说明一期后半段已经从“课程挑战”转向“真实项目交付”。

因此二期系统应覆盖：

```text
Challenge
-> Project
-> Team
-> Requirement
-> Milestone
-> Deliverable
-> Demo
-> Evaluation
```

这也是当前仓库中加入 `project-ontology.md` 和 `teams/` 分工结构的原因。

## 6. 班级自治与组织机制

精英班群中出现了班级自治机制：

- 班级轮值负责人
- 学习推进组
- 项目协同组
- 成果沉淀组
- 文化传播组
- 教室值班与设备管理
- 项目推进协同
- 成果展示与传播

这说明二期不应只设计“老师发布任务，学生提交作业”的单向流程，而要设计 Builder Community。

对应到二期系统，需要：

- Project Manager Agent
- Team workspace
- Review queue
- Progress report
- Knowledge capture
- Demo / Promotion 入口

## 7. 一期沉淀出的核心模式

综合两个群，至少可以抽取出以下核心模式。

### 7.1 Challenge-driven Learning

学习不是先讲完理论再做练习，而是通过真实 Challenge 牵引。

### 7.2 AI-assisted Building

学生不是独立手写所有内容，而是与 AI 一起完成：

- 翻译
- 论文
- 代码
- Skill
- Agent
- 文档
- 调试
- 复盘

### 7.3 GitHub-based Artifact

正式成果需要进入 GitHub，形成可查看、可复用、可评审的 artifact。

### 7.4 Peer Review + Agent Review

互评和自动评审都是学习的一部分。

### 7.5 Skill / Agent as Reusable Output

很多挑战产物本身就是 Skill 或 Agent，不只是报告。

### 7.6 Knowledge Capture

踩坑、流程、Prompt、AI日志、优秀案例都应沉淀到 Knowledge Base。

### 7.7 Project-based Transition

课程后半段自然过渡到真实项目、企业需求、竞赛、实习和路演。

## 8. 对二期系统设计的直接启示

一期经验说明，二期不应先做一个完整 LMS，而应先做 Builder Operating System。

二期系统的优先级应是：

```text
1. Challenge 标准化
2. GitHub 提交规范
3. Rubric / Evaluation 标准化
4. Peer Review / Agent Review 工作流
5. Skill / Agent 产物沉淀
6. Ontology / Knowledge Base 结构化
7. Team 分工协作
8. Demo / Project / Deployment 扩展
```

这与当前仓库结构对应：

```text
challenges/      Challenge 模板与样例
reviews/         Evaluation Report 模板
agents/          Agent 说明与 Manifest
ontology/        Course / Skill / Challenge / Project / Assessment Ontology
knowledge-base/  FAQ / Prompt / Best Practice / Examples
teams/           七个 Builder Team 工作区
examples/        Challenge -> Cognitive Cell 端到端示例
```

## 9. 七个 Builder Team 的来源依据

Richard 的文件中建议分为七个 Builder Team：

- Curriculum Team
- Challenge Team
- Agent Team
- Ontology Team
- Platform Team
- Knowledge Team
- Demo Team

从一期群聊看，这七个方向并不是空设，而是在一期已经自然出现：

| Team | 一期对应现象 |
|---|---|
| Curriculum Team | C1 翻译课程资料、课程范式理解、Week 内容学习 |
| Challenge Team | C1-C10、C2A、C3C、C4A-D 等挑战体系 |
| Agent Team | C4 Skill、C4A 评审器、C8 班级管理、Hermes/OpenClaw 等 |
| Ontology Team | NEOLAF、KSTAR、Skill/Ontology 讨论、知识图谱重要性 |
| Platform Team | GitHub、飞书、学习通、Mac mini、云端环境、部署问题 |
| Knowledge Team | AI 日志、作业流程分享、Prompt、FAQ、踩坑记录 |
| Demo Team | 公众号、小红书、抖音、展示视频、红队挑战、路演 |

因此二期按七个 Team 分工是对一期自然机制的工程化延续。

## 10. 推荐用于二期的主流程

建议二期采用以下主流程：

```text
发现问题 / 真实场景
-> 定义 Situation
-> 设计 Challenge
-> AI 辅助构建
-> GitHub 提交
-> Peer Review
-> Agent Review
-> Merge / Register
-> Documentation
-> Knowledge Capture
-> Release
```

对于可运行项目：

```text
可以自建工作仓库
但必须回主仓库登记
并进入统一 Review 和 Knowledge Capture 流程
```

## 11. 对当前 GitHub 仓库的意义

当前仓库不是凭空设计，而是对一期真实运行模式的抽象和标准化。

它试图把一期已经出现但分散在微信群、飞书、压缩包、PDF、GitHub 链接中的机制，统一沉淀为：

- 标准模板
- 标准提交
- 标准评审
- 标准 Agent
- 标准 Ontology
- 标准 Team workspace
- 标准 Knowledge Base

最终目标是让二期不只是“再跑一次课程”，而是把一期探索出来的模式升级成可复制、可部署、可演化的 NSEAP AI Learning Operating System 参考实现。
