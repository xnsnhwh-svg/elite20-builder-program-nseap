# Elite20 / AI+X 实验班一期背景与经验整理

## 1. 文档目的

本文基于以下两个群聊资料整理：

- `实验班1群`：选拔前后的开放群与挑战试炼过程
- `精英班群`：正式入选后的 Elite20 / AI+X 实验班学习、项目、协作与成果推进过程

本文不是逐条聊天记录摘录，而是用于二期 NSEAP / Elite20 Builder Program 设计的背景材料，重点回答：

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

