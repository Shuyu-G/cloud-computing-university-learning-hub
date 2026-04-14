# Project Execution Log

## 1. 文档目的

这份文档用于完整记录本项目从开始到当前阶段的实际工作内容，方便后续：

- 编写课程 `report`
- 准备 `presentation`
- 给组员解释我们具体做了什么
- 让后续继续开发时快速恢复上下文

这不是面对老师的最终成稿，而是一份“内部全过程记录”。内容会比最终报告更细，重点是可追溯、可复现、可解释。

## 2. 项目背景

项目最开始来自工作区里的 PDF：

- `AWS_Guide_ELearning_1.pdf`

PDF 原始目标是：

- 在 AWS 上部署一个大学在线学习平台
- 使用 `EC2 + RDS + S3 + VPC + IAM`
- 演示课程报名、查看学生、简单 quiz、文件存储等基础能力

PDF 里的原始 Node.js 示例非常简单，只能算“演示级样例”，不是真正的教学平台。

后续项目需求被进一步提高，要求系统更像一个正常的学生网站，支持：

- `admin`、`teacher`、`student` 三种角色
- 不同角色登录后看到不同界面
- `admin` 可以看在线状态、强制用户下线
- `admin` 和 `teacher` 可以创建课程
- 教师可以设置上课日期和时间
- 教师可以上传课件，学生可以下载
- 教师可以发课程公告，学生可以查看
- 教师可以创建课程小测
- 学生可以提交小测
- 教师可以登记成绩
- 学生可以查看成绩

因此，项目从“PDF 里的简单演示应用”升级成了一个“角色化教学平台原型”。

## 3. 项目路径与当前关键文件

本地工作目录：

- `/Users/guishuyu/cloud computing project`

当前关键文件：

- `app.js`
  - 主服务端程序
  - 包含登录、会话、角色权限、课程、公告、资料、小测、成绩、健康检查等逻辑
- `sql/schema.sql`
  - MySQL / RDS 数据库结构定义
- `README.md`
  - 项目概览与基础运行说明
- `DEPLOYMENT_GUIDE.md`
  - AWS 部署说明
- `PROJECT_EXECUTION_LOG.md`
  - 本文档，完整执行记录

## 4. 第一阶段：读取 PDF 并拆解任务

最开始先做了 PDF 内容提取和任务分析。

### 4.1 做了什么

- 定位工作区内唯一 PDF 文件
- 使用 Python 的 `pypdf` 提取 PDF 文本
- 阅读了 PDF 全部 13 页内容
- 把 PDF 里的 9 个阶段拆成可执行任务

### 4.2 从 PDF 中得到的原始系统设计

PDF 要求的 AWS 服务包括：

- `Amazon VPC`
- `Amazon EC2`
- `Amazon S3`
- `Amazon RDS`
- `Security Groups`
- `IAM`

PDF 预期的原始应用功能只有：

- 学生报名课程
- 查看报名列表
- 做一个简单 quiz

### 4.3 发现的 PDF 问题

在阅读 PDF 后，发现其示例代码存在明显问题：

1. PDF 中的 `app.js` 使用了 `#` 注释
   - 在 Node.js 里这是非法语法
   - 必须改写成可运行的 JavaScript

2. PDF 说项目要接 `S3`
   - 但示例代码并没有真正实现 S3 文件读取或上传逻辑

3. PDF 中的应用形态过于简单
   - 只能算“报名 + 列表 + quiz”演示页
   - 不满足后续更真实的教学平台需求

## 5. 第二阶段：本地先搭出初版项目

在正式连 AWS 之前，先在本地生成了初版 Node.js 项目结构。

### 5.1 新建的项目文件

创建了：

- `package.json`
- `.gitignore`
- `.env.example`
- `sql/schema.sql`
- `README.md`
- `DEPLOYMENT_GUIDE.md`
- `app.js`

### 5.2 初版功能

初版是对 PDF 的直接落地，包含：

- 首页课程报名表
- MySQL / RDS 连接
- `/students` 报名列表页
- `/quiz` 小测页
- `/files` S3 文件页
- `/health` 健康检查接口

### 5.3 本地环境准备

本机最开始没有：

- `node`
- `npm`

因此做了：

- 使用 `Homebrew` 安装 `node`
- 本地执行 `npm install`
- 本地做语法检查与简单 HTTP 验证

## 6. 第三阶段：按 AWS 实际资源把系统部署到云上

项目后面真正跑在 AWS 上，不是只停留在本地。

### 6.1 AWS 区域

虽然 PDF 原本建议 `us-east-1`，但最终真实部署统一使用：

- `Europe (Frankfurt) eu-central-1`

所有资源都保持在同一区域，避免跨区问题。

### 6.2 已创建的 AWS 资源

#### IAM

- IAM 用户：
  - `elearn-admin`
- EC2 IAM Role：
  - `ec2-elearn-s3-role`
- 该 Role 附加了：
  - `AmazonS3FullAccess`

#### 网络

- VPC：
  - `elearning-platform-vpc-vpc`
- 安全组：
  - `ec2-elearn-sg`
  - `rds-elearn-sg`
- DB Subnet Group：
  - `elearn-db-subnet-group`

#### EC2

- 实例名：
  - `elearning-server`
- 实例 ID：
  - `i-0566a3cf0bab4b17f`
- 实例类型：
  - `t3.micro`
- 系统：
  - `Amazon Linux 2023`
- 公网 IP：
  - `3.123.16.253`
- 公网 DNS：
  - `ec2-3-123-16-253.eu-central-1.compute.amazonaws.com`
- SSH 密钥：
  - `elearn-keypair.pem`

#### S3

- Bucket：
  - `elearning-platform-files-shuyugui-442426879954-eu-central-1-an`

这个名字不是手写短名字，而是控制台在 `Account Regional namespace` 模式下生成的最终完整 bucket 名。

#### RDS

- DB identifier：
  - `elearning-database`
- 数据库名：
  - `elearndb`
- Endpoint：
  - `elearning-database.ctuc0ie6sp1v.eu-central-1.rds.amazonaws.com`
- Port：
  - `3306`
- 引擎：
  - `MySQL`

## 7. 第四阶段：在 EC2 上完成应用部署

### 7.1 SSH 连接与服务器环境准备

通过 SSH 连入 EC2 后，执行了环境安装。

在 Amazon Linux 2023 上安装：

- `nodejs`
- `git`
- MySQL 客户端兼容包

注意：

- PDF 写的是安装 `mysql`
- 但在 `Amazon Linux 2023` 里这个包名不可用
- 实际改为安装 MariaDB/MySQL 兼容客户端包

这是部署过程中第一个与 PDF 不完全一致、但必须进行的修正。

### 7.2 上传项目代码

通过 `scp` 将本地项目文件传到 EC2：

- 目标目录：
  - `~/elearn-app`

在 EC2 上执行：

- `npm install`

### 7.3 写入服务器配置

在 EC2 的项目目录里创建了 `.env`，主要字段包括：

- `PORT=3000`
- `AWS_REGION=eu-central-1`
- `S3_BUCKET_NAME=...`
- `DB_HOST=...`
- `DB_PORT=3306`
- `DB_USER=admin`
- `DB_PASS=...`
- `DB_NAME=elearndb`

注意：

- 出于安全考虑，这份执行日志不写数据库密码明文
- 密码保存在 EC2 的 `.env` 中

### 7.4 初始化数据库

通过 EC2 上的 MySQL 客户端连接 RDS，执行了：

- `sql/schema.sql`

最开始的表结构只有一张简单的报名表，后面被彻底升级。

## 8. 第五阶段：把简单演示应用升级成真实教学平台

这是本项目最重要的一次结构升级。

### 8.1 为什么要升级

初版只是：

- 报名
- 报名列表
- 简单 quiz
- 文件列表

但后续需求要求系统必须更接近真实的学生网站。

因此，直接放弃“继续在原始 demo 上小修小补”，改为：

- 重新设计数据模型
- 重新设计页面结构
- 重新设计角色权限
- 重新组织应用流程

### 8.2 新系统的核心角色

系统现在有 3 种内置角色：

- `admin`
- `teacher`
- `student`

三者登录后看到不同 dashboard。

## 9. 第六阶段：重新设计数据库

新的 `sql/schema.sql` 不再是单表结构，而是完整教学平台结构。

### 9.1 已实现的数据表

当前包含这些核心表：

- `users`
  - 存用户、角色、密码哈希、session token、在线状态
- `courses`
  - 存课程基本信息
- `course_memberships`
  - 课程与教师/学生之间的关联
- `course_materials`
  - 课程资料文件及 S3 key
- `announcements`
  - 课程公告
- `quizzes`
  - 小测基本信息
- `quiz_questions`
  - 小测题目和选项
- `quiz_attempts`
  - 学生提交记录和分数
- `quiz_answers`
  - 每题作答明细
- `grades`
  - 教师登记的课程成绩

### 9.2 用户认证设计

没有使用第三方认证框架，而是直接在 Node.js 中实现：

- `scrypt` 密码哈希
- `salt + hash`
- 数据库存储 `session_token`
- 浏览器通过 Cookie 维持登录状态

这样做的优点：

- 不依赖额外框架
- 逻辑可控
- 对课程项目更容易解释原理

## 10. 第七阶段：重写主应用逻辑

`app.js` 被完整重构成新的平台后端。

### 10.1 主要模块

当前 `app.js` 包含以下主要模块：

- 环境变量加载
- MySQL 连接池
- S3 客户端
- Cookie 解析
- 会话管理
- 密码哈希与验证
- 页面模板渲染
- 权限控制中间件
- 课程访问控制
- 数据自动初始化
- 默认用户种子数据

### 10.2 页面与路由能力

系统现在包含这些主要入口：

- `/`
  - 登录页
- `/login`
  - 登录提交
- `/logout`
  - 退出登录
- `/dashboard`
  - 按角色显示不同 dashboard
- `/courses/:id`
  - 课程详情页
- `/courses/:id/settings`
  - 更新课程信息
- `/courses/:id/enrollments`
  - 课程加学生
- `/courses/:id/materials`
  - 上传课程资料
- `/materials/:id/download`
  - 学生下载资料
- `/courses/:id/announcements`
  - 发公告
- `/courses/:id/quizzes`
  - 创建 quiz
- `/quizzes/:id`
  - 查看/作答 quiz
- `/quizzes/:id/submit`
  - 提交 quiz
- `/courses/:id/grades`
  - 教师登记成绩
- `/health`
  - 检查 app / DB / S3 状态

## 11. 第八阶段：实现具体功能

### 11.1 Admin 功能

已实现并验证：

- 不同于教师和学生的独立 dashboard
- 创建用户
- 创建课程
- 查看教师和学生是否在线
- 强制某个用户下线

在线状态依据：

- 最近几分钟是否有活动
- 是否仍持有有效 session token

### 11.2 Teacher 功能

已实现并验证：

- 登录教师后台
- 创建课程
- 设置课程 code、description、schedule
- 给课程添加学生
- 上传课程资料到 S3
- 发布课程公告
- 创建 quiz
- 查看学生 quiz 提交结果
- 给学生登记成绩

### 11.3 Student 功能

已实现并验证：

- 登录学生后台
- 查看自己的课程
- 查看课程公告
- 下载课程资料
- 打开并提交 quiz
- 查看 quiz 成绩
- 查看教师登记的课程成绩

## 12. 第九阶段：默认账号与演示数据

系统启动时会自动 seed 三个默认账号：

- `admin@example.com` / `Admin123!`
- `teacher@example.com` / `Teacher123!`
- `student@example.com` / `Student123!`

这些账号是为了演示和测试而设，不是 AWS 控制台账号。

### 12.1 已创建的测试业务数据

为了验证整条业务链，系统中已经创建了这些示例内容：

- 课程：
  - `ACA-501`
  - `Advanced Cloud Architecture`
- 公告：
  - `Week 1 Update`
- 课程资料：
  - `Week 1 Slides`
- Quiz：
  - `Quiz 1`
- 已登记成绩：
  - 学生 `Grace Hopper`
  - 成绩 `A-`

这些数据不是 mock 文本，而是通过系统真实业务流程创建出来的。

## 13. 第十阶段：S3 集成

### 13.1 为什么需要 S3

S3 用来存课程文件，而不是学生成绩或课程结构化数据。

系统中的职责分工是：

- `RDS`
  - 存用户、课程、成员关系、公告、quiz、成绩
- `S3`
  - 存课程上传文件

### 13.2 已实现的 S3 功能

当前已实现：

- 教师在课程页面上传文件
- 服务器将文件写入 S3 bucket
- 数据库保存文件元数据和 S3 key
- 学生打开课程后看到文件列表
- 学生点击下载时，系统生成签名 URL

这说明系统不是“只是创建了 bucket”，而是真正把 S3 纳入了应用逻辑。

## 14. 第十一阶段：RDS 集成

### 14.1 已实现的 RDS 功能

当前所有核心业务都写入 RDS，包括：

- 用户
- 课程
- 课程成员
- 公告
- quiz
- quiz 提交
- 成绩

### 14.2 遇到的问题

最开始 EC2 无法连接到 RDS，原因是：

- `rds-elearn-sg` 没有正确的 `Inbound rule`

后面修复为：

- `Type: MySQL/Aurora`
- `Port: 3306`
- `Source: ec2-elearn-sg`

修复后，EC2 到 RDS 的 3306 端口连通恢复正常。

## 15. 第十二阶段：部署与运行过程中的关键问题

这一部分是 report 和 presentation 里非常有价值的内容，因为能体现实际工程过程，而不是只展示成功结果。

### 15.1 本机没有 Node.js

问题：

- 开始时本机没有 `node` 和 `npm`

解决：

- 用 `Homebrew` 安装 Node.js

### 15.2 Amazon Linux 2023 的 MySQL 客户端包名与 PDF 不一致

问题：

- PDF 里写 `sudo dnf install -y mysql`
- 在 Amazon Linux 2023 中找不到这个包

解决：

- 改用 MariaDB/MySQL 兼容客户端包

### 15.3 RDS 无法连接

问题：

- 数据库 endpoint 可解析
- 但 TCP 3306 不通

原因：

- `rds-elearn-sg` 缺少允许来自 `ec2-elearn-sg` 的入站规则

解决：

- 增加 `MySQL/Aurora 3306` 入站规则

### 15.4 Node 18 与 AWS SDK 的兼容警告

问题：

- EC2 上安装的是 Node 18
- 新版 AWS SDK 给出警告：未来不再支持 Node 18

当前状态：

- 只是警告，不影响当前功能运行

后续建议：

- 把 EC2 上的 Node 升级到 20+

### 15.5 SSH 失联

问题：

- 某次网络变化后，SSH 无法继续连接实例

原因：

- `SSH 22` 规则按 `My IP` 限制
- 电脑断网后公网 IP 发生变化
- 旧 IP 不再能访问实例

解决：

- 更新安全组中的 `SSH` 来源 IP

### 15.6 网站偶发打不开

问题：

- 网页一度无法访问
- 但实例本身仍在运行

原因：

- 应用不是通过稳定的进程管理器常驻运行
- 前台启动或不稳定后台启动在会话断开后容易退出

解决：

- 安装并使用 `pm2`
- 让应用以 `pm2` 进程形式常驻

## 16. 第十三阶段：把应用改为 pm2 常驻运行

为了避免网站因 SSH 断开而停止，已在 EC2 上安装：

- `pm2`

当前服务名：

- `university-learning-hub`

当前状态：

- `online`

这意味着：

- 网站不再依赖某个前台 SSH 会话
- 稳定性比之前明显更高

## 17. 当前线上地址

当前网站地址：

- `http://ec2-3-123-16-253.eu-central-1.compute.amazonaws.com:3000/`

健康检查地址：

- `http://ec2-3-123-16-253.eu-central-1.compute.amazonaws.com:3000/health`

当前 `health` 的正确返回内容应表明：

- `app.ok = true`
- `database.ok = true`
- `s3.ok = true`

## 18. 已完成的真实验证

下面这些不是“理论上支持”，而是已经实际验证过：

- 首页可访问
- admin 能登录
- teacher 能登录
- student 能登录
- admin 页面和 teacher / student 页面不同
- teacher 能创建课程
- teacher 能给课程加学生
- teacher 能发公告
- teacher 能上传文件到 S3
- student 能看到公告
- student 能下载资料
- teacher 能创建 quiz
- student 能提交 quiz
- teacher 能看到 quiz 提交结果
- teacher 能录入成绩
- student 能看到成绩
- admin 能强制学生下线
- 网站已经部署到 EC2，而不是只在本地运行

## 19. 当前系统的页面逻辑概览

### 19.1 登录页

作用：

- 统一登录入口
- 展示 3 个 seeded 账号

### 19.2 Admin Dashboard

作用：

- 平台运营视角
- 看在线状态
- 管用户
- 建课程

### 19.3 Teacher Dashboard

作用：

- 教学管理视角
- 建课
- 管课程
- 发公告
- 传课件
- 出 quiz
- 录成绩

### 19.4 Student Dashboard

作用：

- 学习视角
- 看自己的课程
- 看公告
- 下载资料
- 做 quiz
- 看成绩

### 19.5 Course Detail 页面

作用：

- 课程级别的完整操作中心
- 对教师来说是管理页
- 对学生来说是学习页

## 20. 对 report 可直接使用的内容

后续写报告时，可以直接从本项目抽取这些主线：

### 20.1 项目目标

构建一个部署在 AWS 上的大学在线学习平台原型，支持不同角色的教学与学习流程。

### 20.2 云服务使用说明

- `EC2`
  - 托管 Node.js Web 应用
- `RDS`
  - 存储用户、课程、公告、小测、成绩等结构化数据
- `S3`
  - 存储课程文件
- `VPC`
  - 提供隔离网络
- `Security Groups`
  - 控制 EC2 与 RDS 的访问边界
- `IAM`
  - 管理登录权限和 EC2 访问 S3 的角色权限

### 20.3 技术实现亮点

- 角色化权限控制
- 教学业务流程闭环
- 真实使用 AWS 服务而非本地模拟
- 数据与文件分离存储
- 具备线上部署和运行验证

### 20.4 工程实践亮点

- 从 PDF 示例升级到真实平台
- 修复部署环境差异问题
- 处理 RDS 安全组连通问题
- 处理 SSH IP 变化问题
- 用 `pm2` 解决进程稳定性问题

## 21. 对 presentation 可直接使用的结构

后续做 PPT 时，可以直接按以下顺序讲：

1. 项目背景与目标
2. 原始 PDF 要求
3. 为什么初版 demo 不够
4. 我们如何升级成真实教学平台
5. AWS 架构图
6. 三种用户角色与功能
7. 云服务各自负责什么
8. 数据库设计
9. 关键页面演示
10. 已验证的完整业务流程
11. 遇到的问题与解决方法
12. 当前成果与后续优化

## 22. 当前已知限制

目前系统已经可用，但仍然存在一些“课程项目层面可接受、工程上还可继续优化”的点：

1. 登录系统是自实现 session，不是企业级认证方案
2. 前端仍然是服务端渲染 HTML，不是前后端分离架构
3. 目前还没有“管理员创建教师后教师首次改密码”的流程
4. 没有复杂的成绩计算逻辑，只是课程级成绩登记
5. 没有做长期日志与监控体系
6. EC2 当前 Node 版本仍是 18，建议后续升到 20+

## 23. 下一步建议

如果后续还要继续完善项目，建议按优先级做：

1. 把 EC2 上 Node 升级到 20+
2. 给 `pm2` 配置 `startup`
3. 加一个更正式的 UI 导航与页面样式
4. 支持老师删除或编辑公告、资料、quiz
5. 增加学生自行修改密码
6. 增加课程筛选和搜索
7. 给 report 和 presentation 专门准备一份精简版最终说明文档

## 24. 当前结论

截至目前，本项目已经完成从“阅读 PDF 指南”到“在 AWS 上部署并运行角色化教学平台原型”的全过程，且已经验证了核心教学业务链路。

可以明确说：

- 这不是只停留在设计图上的方案
- 也不是只在本地跑通的演示代码
- 而是一个真实部署在 AWS 上、具备 admin / teacher / student 三角色的教学平台原型

后续 report 和 presentation 可以直接围绕本记录中的内容展开整理。

## 25. 2026-04-13 晚些时候的界面简化更新

在系统已经跑通以后，又根据最新要求做了一轮偏“展示层”和“管理员可见信息”的调整，这一轮改动已经同步到本地代码和 EC2 线上环境。

### 本轮改动内容

1. 页面顶部标题下方原来的说明文字 `EC2 + RDS + S3 teaching platform` 已删除
2. 首页 hero 区、admin dashboard、teacher dashboard、student dashboard、course detail 页中多余的解释性副标题已去掉
3. 登录页右侧原本展示 demo account 的整块面板已删除
4. 登录页改成更简洁的单卡片登录布局，只保留 `Email`、`Password` 和登录按钮
5. admin dashboard 新增一个账户总表，直接显示当前系统中所有用户的：
   - 姓名
   - 用户名（email）
   - 密码
   - 角色
6. 为了让 admin 页面能够稳定展示密码，数据库 `users` 表新增了 `display_password` 字段
7. 默认种子账号会自动补齐这个字段；之后 admin 新建的用户也会同时写入这个字段

### 本轮涉及的核心代码位置

- `app.js`
  - `renderPage()`：删除标题下方副说明，并改成只有存在 `subhead` 时才渲染说明段落
  - `/`：首页登录页改成单卡片布局
  - `/dashboard`：admin 页面加入 `All usernames and passwords` 表格
  - `/admin/users`：新增用户时同步写入 `display_password`
  - `ensureSchema()` / `ensureUserColumns()` / `seedDefaultUsers()`：自动补库表字段和默认账号显示密码
- `sql/schema.sql`
  - `users` 表新增 `display_password VARCHAR(255) NULL`

### 本轮验证结果

这一轮改动完成后，已经再次完成以下验证：

1. 本地 `node --check app.js` 通过
2. 新版 `app.js` 和 `sql/schema.sql` 已重新同步到 EC2
3. EC2 上 `pm2 restart university-learning-hub` 成功
4. 首页已确认不再显示 demo account 面板，只保留登录框
5. 使用 `admin@example.com / Admin123!` 登录后，admin dashboard 已能看到用户名和密码总表
6. `/health` 仍然返回正常，说明本轮界面调整没有破坏：
   - 应用服务
   - RDS 连接
   - S3 连接

## 26. 2026-04-13 课程目录与批量学生扩充

在前一轮完成“简化首页和补管理员账号表”之后，又继续按最新要求，把系统从一个偏 demo 的课程平台，扩充成了一个带完整本科/研究生目录、教师账号和大批量学生账号的数据版本。

### 这轮新增目标

本轮主要是为了满足以下展示目标：

1. 首页标题 `University Learning Hub` 不换行
2. 首页不再只是一个登录框，而是直接展示真实一点的课程目录结构
3. 增加本科与研究生两个层级
4. 每个层级下增加多个专业/项目
5. 每个专业下增加多门课程
6. 每个专业绑定教师账号
7. 系统里批量创建 150 个学生
8. 学生按专业平均分布，并按课程随机选课

### 这轮实际实现的目录结构

最终在系统中加入了以下 10 个项目：

本科（Undergraduate）：

1. Computer Science and Engineering
2. Computer Science, Economics, and Data Science
3. Management Science and Engineering
4. Bioengineering
5. Urban Science and Planning with Computer Science

研究生（Graduate）：

1. MSc in Advanced Computer Science
2. MSc in Software and Systems Security
3. Master of Business Analytics
4. MS in Management Science and Engineering
5. MS in Bioengineering

每个项目下新增了 4 门课程，因此本轮共自动生成了：

- 40 门正式目录课程
- 再加上系统里原有的 1 门课程
- 当前数据库总课程数为 41

### 新增教师账号

系统当前共存在 10 个 teacher 账号：

1. `teacher@example.com` / `Teacher123!` / Dr. Ada Lovelace
2. `liam.carter@universityhub.edu` / `TeacherLiam01!`
3. `maya.chen@universityhub.edu` / `TeacherMaya01!`
4. `sofia.alvarez@universityhub.edu` / `TeacherSofia01!`
5. `nora.kim@universityhub.edu` / `TeacherNora01!`
6. `arjun.mehta@universityhub.edu` / `TeacherArjun01!`
7. `claire.bennett@universityhub.edu` / `TeacherClaire01!`
8. `omar.haddad@universityhub.edu` / `TeacherOmar01!`
9. `benjamin.zhou@universityhub.edu` / `TeacherBen01!`
10. `isabella.rossi@universityhub.edu` / `TeacherIsabella01!`

这些教师账号会自动与对应专业的课程建立 teacher membership。

### 新增学生账号与分布策略

本轮自动生成了总计 150 个 student 账号。

分布策略不是“纯随机乱塞”，而是“平均分配到各专业，再在专业内随机选课”，这样兼顾：

1. 专业之间分布均衡
2. 课程之间又不是完全一样
3. 演示时能看出系统里确实有大量真实感数据

当前数据库验证结果显示：

- 每个专业正好分配了 15 名学生
- 本科 5 个专业，共 75 名学生
- 研究生 5 个项目，共 75 名学生

也就是说总计：

- 150 名学生
- 10 个专业/项目
- 每个专业 15 人

### 课程选课随机化策略

每个学生会：

1. 先归属到一个主专业
2. 在该专业的 4 门课程中随机选 3 到 4 门
3. 部分学生还会额外随机拿一门同层级的跨专业选修

这使得课程报名人数不会完全一样。

数据库验证结果：

- 单门课最少学生数：`1`
- 单门课最多学生数：`17`
- 所有课程平均学生数：`12.98`

这里最少值之所以是 `1`，是因为系统里保留了之前人工创建的旧课程；新批量目录课程的分布是均匀且正常的。

### 本轮数据库字段扩展

为了支撑“专业/层级/目录课程”，本轮增加了以下数据库字段：

- `users.study_level`
- `users.program_name`
- `courses.study_level`
- `courses.program_name`

同时保留了之前已经加过的：

- `users.display_password`

这样现在系统既能在 admin 页显示账号密码，也能在课程和学生层面记录学段与专业信息。

### 首页展示层变化

首页不再只显示登录框，现在会额外显示两大目录区域：

1. `Undergraduate Programmes`
2. `Graduate Programmes`

每个项目卡片里会展示：

- 专业名称
- 简短说明
- 负责教师
- 4 门课程的课程代码、课程名与简介

### 线上验证结果

这一轮已经在 EC2 + RDS 线上环境完成验证：

1. 新版 `app.js` 和 `sql/schema.sql` 已同步到 EC2
2. `pm2 restart university-learning-hub` 成功
3. 首页已出现本科与研究生目录区块
4. 首页标题 `University Learning Hub` 已验证不换行
5. 数据库统计确认：
   - `admin = 1`
   - `teacher = 10`
   - `student = 150`
   - `courses = 41`
6. 课程层级统计确认：
   - `undergraduate = 20`
   - `graduate = 20`
   - 另有历史旧课程 `NULL = 1`

### 后续界面收敛补充

在这轮目录扩充之后，又按最新要求做了两项收敛调整：

1. 登录页下方的本科/研究生目录展示已移除，首页重新回到只保留登录框
2. 早期 demo 风格的默认教师/学生账号已更名为：
   - `Dr. Amelia Hart` / `amelia.hart@universityhub.edu`
   - `Mia Thompson` / `mia.thompson@universityhub.edu`

这个调整使用了“迁移老账号”的方式处理，因此不会额外产生重复 teacher/student 账号，只会把原先的默认账号改名并保留已有关联数据。

### 后续账号格式与 admin 页面收敛补充

再往后又继续按要求做了两项后台可用性调整：

1. 批量学生账号不再使用 `student001@...` 这种序号邮箱
2. 所有自动生成的 teacher/student 账号统一改成 `first.last@universityhub.edu` 风格
3. admin 后台的“账号总表”和“在线状态表”加入了：
   - 搜索框
   - 角色筛选
   - 在线状态筛选
   - 固定高度滚动区域

#### 本轮验证结果

数据库验证确认：

- 旧格式邮箱 `student%@universityhub.edu` 数量：`0`
- 当前 student 账号中，使用 `名字.姓氏@universityhub.edu` 格式的数量：`150`

页面验证确认：

- admin 后台账户区已经出现搜索框和角色筛选
- session control 区已经出现搜索、角色筛选、状态筛选
- 这两个大表已经改成滚动区域，不会再把页面无限拉长

### 后续 admin tabs 与课程筛选补充

再往后又继续做了两项后台交互增强：

1. admin 页面新增 `Teachers / Students` tabs
2. 这组 tabs 会同时联动：
   - 账号密码总表
   - 在线状态表
3. 课程列表区域改成统一的可筛选卡片区
4. admin / teacher / student 三种 dashboard 的课程区都加入了：
   - 搜索
   - 学段筛选（Undergraduate / Graduate）
   - 专业筛选
   - 固定高度滚动容器

#### 本轮验证结果

已经在线验证：

- admin dashboard 中出现 `Teachers (10)` / `Students (150)` tabs
- admin 课程区出现：
  - `Search course, code, teacher`
  - `All levels`
  - `All programmes`
- teacher dashboard 的课程区也已出现同样筛选控件
- student dashboard 的课程区也已出现同样筛选控件

### 后续老师扩充与课程 tabs 补充

再往后又继续做了两项数据与交互增强：

1. 每个专业额外补充 1 名老师
2. 这样总 teacher 数量从 `10` 增加到 `20`
3. 新增老师统一使用 `first.last@universityhub.edu` 格式
4. 这些新增老师会作为 co-teacher 挂到对应专业课程上
5. 课程区原来的 level 下拉筛选改成了更直观的：
   - `Undergraduate`
   - `Graduate`
   两个 tabs

#### 本轮验证结果

已经在线验证：

- 数据库中的账号数量变为：
  - `admin = 1`
  - `teacher = 20`
  - `student = 150`
- admin 页面显示：
  - `Teachers (20)`
  - `Students (150)`
- admin 课程区已经显示：
  - `Undergraduate (20)`
  - `Graduate (20)`
- 新老师账号已经出现在 admin 页，例如：
  - `ethan.brooks@universityhub.edu`
  - `priya.nair@universityhub.edu`
- teacher dashboard 的课程区已显示 `Undergraduate / Graduate` tabs
- student dashboard 的课程区也已显示 `Undergraduate / Graduate` tabs

### 后续标题与英文时间格式补充

再之后又继续做了两项界面细节修正：

1. teacher 页面顶部原本较长的标题文案被替换为简洁的 `Teacher Dashboard`
2. student 页面顶部原本较长的标题文案被替换为简洁的 `Student Dashboard`
3. 站内统一时间显示格式改为明确英文格式，避免出现中文年月日

#### 本轮验证结果

已经在线验证：

- teacher dashboard 顶部标题为 `Teacher Dashboard`
- student dashboard 顶部标题为 `Student Dashboard`
- 课程时间、公告时间、上传时间、测验时间等内容已显示为英文格式，例如：
  - `April 20, 2026 at 12:00`
  - `September 14, 2026 at 10:00`

### 后续 admin 分页与课程详情折叠补充

再之后又继续做了两项后台与课程页可用性增强：

1. admin 的 teacher / student 两张大表加入了前端分页
2. 分页会和现有搜索、tab、状态筛选一起联动
3. course detail 页把以下三块改成了默认展开的折叠区：
   - Materials
   - Announcements
   - Quizzes

#### 本轮验证结果

已经在线验证：

- admin dashboard 中两张大表都出现了：
  - `Previous`
  - `Next`
  分页按钮
- course detail 页面中已经出现三块 `<details>` 折叠面板
- 折叠标题分别为：
  - `Materials and downloadable courseware`
  - `Latest notices`
  - `Assessments for this course`

### 本轮参考来源

本轮课程命名与项目结构不是凭空乱写，而是参考了几类真实大学项目方向，再做了适合本项目演示的重组与本地化命名。使用的是官方大学项目/课程方向作为灵感来源，主要包括：

1. MIT 的跨学科计算与商业分析方向
2. Stanford 的 Management Science and Engineering / Bioengineering 方向
3. Oxford 的 Advanced Computer Science / Software and Systems Security 方向

注意：

- 当前平台中的课程文案和具体课程组合是为了教学平台演示而重写的
- 不是对某一所大学目录的逐字复制
- 但结构与命名方向参考了真实高校项目，因此展示效果会更像一个正常大学课程平台

### 后续 admin 数字分页与课程详情一键展开补充

再之后又继续做了两项交互层增强：

1. admin 页两张大表不再只有 `Previous / Next`
2. `Directory credentials` 和 `Teacher and student activity` 现在都会显示真实页码数字按钮
3. 数字页码会继续跟现有：
   - `Teachers / Students` tabs
   - 搜索框
   - 在线状态筛选
   一起联动
4. course detail 页面在三块折叠区上方新增：
   - `Expand all`
   - `Collapse all`
   两个按钮
5. 这两个按钮会同时控制：
   - `Materials and downloadable courseware`
   - `Latest notices`
   - `Assessments for this course`

#### 本轮涉及的核心代码位置

- `app.js`
  - `renderDashboardScripts()`：为 admin 表格分页补充数字页码按钮的生成与点击切换逻辑
  - admin dashboard 两张表的分页区域：加入 `data-page-numbers`
  - course detail 页面：加入 `section-controls` 和 `Expand all / Collapse all` 按钮
  - course detail 页面内联脚本：统一控制所有 `.collapsible-panel` 的打开与收起

#### 本轮验证目标

这一轮完成后，计划在线验证以下几点：

1. admin dashboard 的两张大表都出现数字页码按钮
2. 切换 `Teachers / Students` 或执行搜索后，页码仍然正常刷新
3. course detail 页面出现：
   - `Expand all`
   - `Collapse all`
4. 点击后，三个折叠区会同步展开或收起

### 后续课程详情学生活动与成绩册筛选补充

再之后又继续做了两项课程页可用性增强，目标是让 teacher 和 admin 在课程详情里查看大量学生时不再把页面无限拉长：

1. `Student activity` 现在加入了课程内筛选区
2. 可以按学生姓名 / 邮箱搜索
3. 可以按 `Online / Offline` 状态筛选
4. 学生活动表改成固定高度滚动表格
5. `Course grades` 也加入了独立筛选区
6. 可以按学生 / 邮箱 / 成绩内容搜索
7. 可以按 `Graded / Not graded` 状态筛选
8. 成绩册同样改成固定高度滚动表格

#### 本轮涉及的核心代码位置

- `app.js`
  - course detail 页面里的 `Student activity`：加入搜索、状态筛选和滚动表格
  - course detail 页面里的 `Course grades`：加入搜索、评分状态筛选和滚动表格
  - course detail 内联脚本：新增课程页专用表格筛选逻辑
  - 公共样式：补充 `section-meta` 说明文案样式

#### 本轮验证目标

这一轮完成后，计划在线验证以下几点：

1. teacher / admin 打开课程详情时，`Student activity` 出现搜索框和状态筛选
2. `Student activity` 表格改成固定高度滚动区
3. `Course grades` 出现搜索框和 `Graded / Not graded` 筛选
4. `Course grades` 表格改成固定高度滚动区

### 后续 CSV 工具与在线状态自动刷新补充

再之后又继续做了两类更偏“真实教务平台”的增强：

1. `admin` 新增 CSV 工具区
2. 可以下载用户导入模板 CSV
3. 可以批量导入用户 CSV
4. 可以导出全站用户 CSV
5. CSV 导入支持按 email 批量更新已有账号，不会只做单纯新增
6. `teacher / admin` 在课程详情页新增：
   - `Export roster CSV`
   - `Export grades CSV`
7. `admin` 页的 `Teacher and student activity` 改成自动轮询刷新
8. 顶部 `Online now` 数字也会随在线状态一起更新
9. 课程详情页里的 `Student activity` 也改成自动轮询刷新
10. 在线状态刷新不再依赖手动刷新整页

#### 本轮涉及的核心代码位置

- `app.js`
  - CSV 工具：
    - `parseCsvObjects()`
    - `buildCsv()`
    - `sendCsvDownload()`
  - admin CSV 路由：
    - `/admin/users/import-template.csv`
    - `/admin/users/import`
    - `/admin/users/export.csv`
  - 课程 CSV 路由：
    - `/courses/:id/students.csv`
    - `/courses/:id/grades.csv`
  - 在线状态 JSON 接口：
    - `/api/admin/activity`
    - `/api/courses/:id/activity`
  - 前端自动刷新：
    - admin dashboard 的 `renderDashboardScripts()`
    - course detail 页内联脚本

#### 本轮验证目标

这一轮完成后，计划在线验证以下几点：

1. admin 页出现 `Download template`、`Import users CSV`、`Export all users`
2. `/admin/users/import-template.csv` 能下载
3. `/admin/users/export.csv` 能下载
4. teacher / admin 的课程详情页出现：
   - `Export roster CSV`
   - `Export grades CSV`
5. `Teacher and student activity` 不刷新整页也会自动更新在线状态
6. 课程详情页里的 `Student activity` 不刷新整页也会自动更新在线状态

### 后续课程 CSV 导入与课程内容编辑补充

再之后又继续把课程管理补了一大块，重点是“批量导入课程数据”和“真正可维护课程内容”：

1. 课程详情页新增 `enrollments CSV import`
2. 课程详情页新增 `grades CSV import`
3. 现在 teacher / admin 可以给单门课下载：
   - 选课导入模板
   - 成绩导入模板
4. 现在 teacher / admin 可以批量导入：
   - 学生选课 email 列表
   - 学生成绩表
5. `Materials` 现在支持：
   - edit
   - delete
6. `Announcements` 现在支持：
   - edit
   - delete
7. `Quizzes` 现在支持：
   - edit
   - delete
8. quiz 编辑页支持修改：
   - 标题
   - 描述
   - due date
   - 题目与选项
9. 如果 quiz 已经有学生提交记录，编辑题目时会重置旧提交，避免题库和成绩不一致

#### 本轮涉及的核心代码位置

- `app.js`
  - 课程 CSV 路由新增：
    - `/courses/:id/enrollments-template.csv`
    - `/courses/:id/enrollments/import`
    - `/courses/:id/grades-template.csv`
    - `/courses/:id/grades/import`
  - 课程文件管理新增：
    - `/courses/:courseId/materials/:materialId/edit`
    - `/courses/:courseId/materials/:materialId/delete`
  - 公告管理新增：
    - `/courses/:courseId/announcements/:announcementId/edit`
    - `/courses/:courseId/announcements/:announcementId/delete`
  - quiz 管理新增：
    - `/courses/:courseId/quizzes/:quizId/edit`
    - `/courses/:courseId/quizzes/:quizId/delete`
  - quiz 解析与保存逻辑抽成：
    - `parseQuizForm()`
    - `validateQuizPayload()`
    - `replaceQuizContents()`
  - 课程详情渲染函数升级：
    - `renderMaterials()`
    - `renderAnnouncements()`
    - `renderQuizCards()`

#### 本轮验证目标

这一轮完成后，计划在线验证以下几点：

1. 课程详情页出现：
   - `Download roster template`
   - `Import enrollments CSV`
   - `Download grade template`
   - `Import grades CSV`
2. 课程详情里的 materials / announcements / quizzes 出现 edit / delete 操作
3. 课程文件编辑页可打开并保存标题
4. 公告编辑页可打开并保存内容
5. quiz 编辑页可打开并保存题目内容

### 后续课程退课管理与内容区分页搜索补充

再之后又继续做了两类课程详情增强：

1. `Student activity` 里现在支持单个学生移出课程
2. enrollment 面板新增批量退课 CSV 工具
3. 现在 teacher / admin 可以下载：
   - `unenrollment template`
4. 现在 teacher / admin 可以上传：
   - `unenrollments CSV`
5. 批量退课时会同时清理该学生在该课程下的：
   - membership
   - grade
   - quiz attempts
6. `Materials` 现在加入：
   - 搜索
   - 前端分页
7. `Announcements` 现在加入：
   - 搜索
   - 前端分页
8. `Quizzes` 现在加入：
   - 搜索
   - 前端分页
9. 三块内容区都统一成数字页码分页，不再只是一长串内容往下堆

#### 本轮涉及的核心代码位置

- `app.js`
  - 退课逻辑：
    - `removeStudentFromCourse()`
    - `/courses/:id/enrollments/:studentId/delete`
    - `/courses/:id/unenrollments-template.csv`
    - `/courses/:id/unenrollments/import`
  - 内容区搜索分页：
    - `renderMaterials()`
    - `renderAnnouncements()`
    - `renderQuizCards()`
    - course detail 内联脚本里的 `setupContentPagination()`

#### 本轮验证目标

这一轮完成后，计划在线验证以下几点：

1. `Student activity` 表里出现单个 `Remove` 按钮
2. enrollment 面板里出现：
   - `Download unenrollment template`
   - `Import unenrollments CSV`
3. teacher 实际上传 `unenrollments CSV` 后，课程人数减少
4. `Materials` 出现搜索框和页码按钮
5. `Announcements` 出现搜索框和页码按钮
6. `Quizzes` 出现搜索框和页码按钮

### 课程排序与操作日志补充

在最新这一轮里，又继续补了两块更像正式教务系统的能力：

1. 课程详情页里的 `Student activity` 现在加入了排序
2. 课程详情页里的 `Materials` 现在加入了排序
3. 课程详情页里的 `Announcements` 现在加入了排序
4. 课程详情页里的 `Quizzes` 现在加入了排序
5. `Student activity` 可按：
   - 姓名 A-Z
   - 姓名 Z-A
   - 在线优先
   - 最近活跃
   - 最久未活跃
6. `Materials` 可按：
   - 最新上传
   - 最早上传
   - 标题 A-Z
   - 上传者 A-Z
7. `Announcements` 可按：
   - 最新发布
   - 最早发布
   - 标题 A-Z
   - 作者 A-Z
8. `Quizzes` 可按：
   - 最新创建
   - 最早截止
   - 最晚截止
   - 标题 A-Z
   - 提交次数最多

除此之外，这一轮还加入了持久化操作日志：

1. 新增数据库表：
   - `operation_logs`
2. admin dashboard 现在能看到：
   - 最近 admin / teacher 操作日志
3. teacher dashboard 现在能看到：
   - 当前教师自己的最近操作日志
4. 目前已经记录的动作包括：
   - 新建用户
   - CSV 导入用户
   - 强制下线
   - 新建课程
   - 更新课程信息
   - 单个学生加课
   - 单个学生退课
   - CSV 批量加课
   - CSV 批量退课
   - 上传文件
   - 编辑文件
   - 删除文件
   - 发布公告
   - 编辑公告
   - 删除公告
   - 创建 quiz
   - 编辑 quiz
   - 删除 quiz
   - 手动录入成绩
   - CSV 批量导入成绩

#### 本轮涉及的核心代码位置

- `sql/schema.sql`
  - 新增 `operation_logs`
- `app.js`
  - 排序数据属性：
    - `renderMaterials()`
    - `renderAnnouncements()`
    - `renderQuizCards()`
  - 课程详情排序逻辑：
    - course detail 内联脚本里的 `setupCourseTableFilters()`
    - course detail 内联脚本里的 `setupContentPagination()`
  - 操作日志能力：
    - `logOperation()`
    - `getRecentOperationLogs()`
    - admin dashboard 的 `Recent admin and teacher actions`
    - teacher dashboard 的 `My recent actions`
  - 路由打点：
    - `/admin/users`
    - `/admin/users/import`
    - `/admin/users/:id/force-logout`
    - `/courses`
    - `/courses/:id/settings`
    - `/courses/:id/enrollments`
    - `/courses/:id/enrollments/:studentId/delete`
    - `/courses/:id/enrollments/import`
    - `/courses/:id/unenrollments/import`
    - `/courses/:id/materials`
    - `/courses/:courseId/materials/:materialId/edit`
    - `/courses/:courseId/materials/:materialId/delete`
    - `/courses/:id/announcements`
    - `/courses/:courseId/announcements/:announcementId/edit`
    - `/courses/:courseId/announcements/:announcementId/delete`
    - `/courses/:id/quizzes`
    - `/courses/:courseId/quizzes/:quizId/edit`
    - `/courses/:courseId/quizzes/:quizId/delete`
    - `/courses/:id/grades`
    - `/courses/:id/grades/import`

#### 本轮验证目标

这一轮完成后，需要验证：

1. teacher / admin 打开课程详情时，`Student activity` 有排序下拉框
2. `Materials` 有排序下拉框
3. `Announcements` 有排序下拉框
4. `Quizzes` 有排序下拉框
5. admin dashboard 出现最近操作日志表
6. teacher dashboard 出现个人操作日志表
7. admin 或 teacher 做一次真实操作后，日志表里能看到新增记录

---

## 第 19 轮：把 admin / teacher / course detail 长页面改成顶部 Menu Bar 导航

### 本轮目标

把下面这些页面从“一个很长的滚动页”改成“顶部菜单栏切换内容区”的结构，减少来回下拉：

1. admin dashboard
2. teacher dashboard
3. admin / teacher 的课程详情页

本轮明确不改 student dashboard 的整体结构，避免把前面已经稳定的学生侧一起打乱。

### 设计决策

这轮没有拆新路由，也没有改数据库结构，而是采用同一路径下的前端 tab 切换：

- dashboard 继续保持 `/dashboard`
- 课程详情继续保持 `/courses/:id`
- 当前打开的面板通过 URL hash 表示，例如：
  - `/dashboard#people`
  - `/dashboard#curriculum`
  - `/courses/1#manage`
  - `/courses/1#students-grades`
  - `/courses/1#content`

这样做的原因是：

1. 变更范围最小，不会打乱现有权限和表单路由
2. 刷新页面后可以保持在当前菜单
3. 表单提交后也可以重定向回正确的菜单区块

### 这轮新增的通用能力

在 `app.js` 里新增了页面级菜单的通用能力：

- `withHash(pathname, hash)`
- `dashboardPath(tabId, params = {})`
- `coursePath(courseId, tabId, params = {})`
- `renderPageMenu(scopeName, defaultTab, items)`
- `renderPagePanel(scopeName, panelId, content, isDefault = false)`

同时在 `renderPage()` 里新增了：

- 页面级 menu bar 的样式
- sticky 顶部菜单条
- 移动端横向滚动支持
- 统一的前端 tab 脚本

前端脚本负责：

1. 读取当前 `window.location.hash`
2. 找到对应 `data-page-tab`
3. 只显示对应 `data-page-panel`
4. 点击菜单时用 `history.replaceState()` 更新 hash
5. 监听 `hashchange`，保证 hash 改变时页面内容同步切换

### Admin Dashboard 的结构调整

admin dashboard 现在被拆成 4 个一级菜单：

1. `People`
   - `Directory credentials`
   - `Teacher and student activity`
2. `Provisioning`
   - `Create a new user`
   - `Bulk import and export`
3. `Curriculum`
   - `Create a course`
   - `All live courses`
4. `Oversight`
   - `Recent admin and teacher actions`
   - `Recent course news`

保留在菜单之上的内容：

- hero 区
- 当前管理员信息
- 顶部统计卡片
- 全局 notice / error banner

这样 admin 打开页面后，不再需要在一个超长页面里不断往下找不同模块。

### Teacher Dashboard 的结构调整

teacher dashboard 现在被拆成 4 个一级菜单：

1. `Create`
   - `Create a course`
2. `Courses`
   - `Managed courses`
3. `Updates`
   - `Recent teacher updates`
4. `Audit`
   - `My recent actions`

同样保留在菜单之上的内容：

- hero 区
- 当前教师身份信息
- 顶部统计卡片
- 全局 notice / error banner

### Course Detail 的结构调整

teacher / admin 进入课程详情页后，现在使用 4 个一级菜单：

1. `Overview`
   - 课程总览信息卡
   - code / study level / programme / description
   - schedule
   - teacher
   - students / files / announcements / quizzes 数量
2. `Manage`
   - `Course settings`
   - `Enrollment`
3. `Students & Grades`
   - `Student activity`
   - `Record or update grades`
   - `Course grades`
4. `Content`
   - 上传材料
   - 发布公告
   - 创建 quiz
   - `Materials`
   - `Announcements`
   - `Quizzes`

之前已经做好的折叠区继续保留在 `Content` 菜单里。  
`Expand all / Collapse all` 也只保留在 `Content` 里，不再作用于整页。

### 表单和动作的回跳规则

为了让用户操作后不被扔回默认菜单，这轮把关键重定向改成了带 hash 的路径：

- admin
  - 创建用户成功 / 失败：回 `#provisioning`
  - CSV 导入用户成功 / 失败：回 `#provisioning`
  - 强制下线成功 / 失败：回 `#people`
  - 创建课程校验失败：
    - admin 回 `#curriculum`
    - teacher 回 `#create`
- course detail
  - 保存课程设置：回 `#manage`
  - 手动 enroll 学生：回 `#manage`
  - CSV 导入 enrollments：回 `#manage`
  - CSV 批量 unenroll：回 `#manage`
  - 删除课程内学生：回 `#students-grades`
  - 手动录入成绩：回 `#students-grades`
  - CSV 导入成绩：回 `#students-grades`
  - 上传文件：回 `#content`
  - 发布公告：回 `#content`
  - 创建 quiz：回 `#content`
  - 编辑 / 删除 material：回 `#content`
  - 编辑 / 删除 announcement：回 `#content`
  - 编辑 / 删除 quiz：回 `#content`

另外，material / announcement / quiz 的编辑页里，`Back to course` 也改成了回课程页的 `#content`。

### 这轮没有改动的部分

本轮刻意没有碰下面这些，避免和菜单改造交叉出新问题：

1. student dashboard 的整体布局
2. 后端 API 结构
3. 数据库 schema
4. 课程详情页里已有的搜索 / 排序 / 分页 / 自动刷新逻辑

这些既有能力仍然保留，只是被放进了新的菜单面板里。

### 本轮涉及的核心代码位置

- `app.js`
  - 页面级 hash / 路径 helper：
    - `withHash()`
    - `dashboardPath()`
    - `coursePath()`
  - 页面级菜单组件：
    - `renderPageMenu()`
    - `renderPagePanel()`
  - `renderPage()` 中新增：
    - menu bar 样式
    - sticky 行为
    - hash 驱动的 tab 脚本
  - admin dashboard：
    - `People / Provisioning / Curriculum / Oversight`
  - teacher dashboard：
    - `Create / Courses / Updates / Audit`
  - course detail：
    - `Overview / Manage / Students & Grades / Content`
  - 路由重定向：
    - `/admin/users`
    - `/admin/users/import`
    - `/admin/users/:id/force-logout`
    - `/courses`
    - `/courses/:id/settings`
    - `/courses/:id/enrollments`
    - `/courses/:id/enrollments/import`
    - `/courses/:id/unenrollments/import`
    - `/courses/:id/enrollments/:studentId/delete`
    - `/courses/:id/grades`
    - `/courses/:id/grades/import`
    - `/courses/:id/materials`
    - `/courses/:id/announcements`
    - `/courses/:id/quizzes`
    - `/courses/:courseId/materials/:materialId/edit`
    - `/courses/:courseId/materials/:materialId/delete`
    - `/courses/:courseId/announcements/:announcementId/edit`
    - `/courses/:courseId/announcements/:announcementId/delete`
    - `/courses/:courseId/quizzes/:quizId/edit`
    - `/courses/:courseId/quizzes/:quizId/delete`

### 本轮验证结果

本轮已经完成这些真实验证：

1. 本地执行 `node --check app.js`，语法通过
2. 把新 `app.js` 上传到 EC2
3. 重启 `pm2` 里的 `university-learning-hub`
4. 线上 `/health` 返回正常：
   - app ok
   - database ok
   - s3 ok
5. admin 登录后，dashboard HTML 中已经出现：
   - `data-page-menu="dashboard-tabs"`
   - `People`
   - `Provisioning`
   - `Curriculum`
   - `Oversight`
6. teacher 登录后，dashboard HTML 中已经出现：
   - `data-page-menu="dashboard-tabs"`
   - `Create`
   - `Courses`
   - `Updates`
   - `Audit`
7. teacher 进入课程详情页后，HTML 中已经出现：
   - `data-page-menu="course-tabs"`
   - `Overview`
   - `Manage`
   - `Students & Grades`
   - `Content`
   - `Expand all`
   - `Collapse all`
8. 关键回跳已经验证：
   - admin 创建课程校验失败：`#curriculum`
   - course settings 校验失败：`#manage`
   - grades 校验失败：`#students-grades`
   - materials 上传失败：`#content`

### 本轮效果总结

这一轮完成后，admin 和 teacher 两端的使用体验已经从“超长单页后台”变成了“顶部菜单切换工作区”的结构：

1. 页面更短
2. 信息分区更清晰
3. 常用操作能更快定位
4. 表单提交后仍然停留在用户正在工作的菜单里
5. 已有搜索、筛选、分页、排序、自动刷新逻辑全部保留

## 第 18 轮：补齐 Assignment Submission System 和 Course Chat System

### 本轮目标

这一轮的目标不是单纯再“加两个页面”，而是把这份 Cloud Computing 项目里最能体现 AWS `RDS + S3` 联动的两条主线真正做出来：

1. `Assignment Submission System`
   - 学生上传作业文件
   - 文件进 `S3`
   - 提交记录、截止时间、评分、反馈进 `RDS`
2. `Course Chat System`
   - 课程公聊
   - 学生和老师私聊
   - 文字消息进 `RDS`
   - 聊天附件进 `S3`

这两块是后面写 report 和 presentation 时最容易讲清楚 AWS 资源作用的部分，因为它们明确证明了：

- `S3` 不是摆设，而是真的在存文件
- `RDS` 不是摆设，而是真的在存业务数据

### 为什么要加这两个模块

从课程作业角度，老师最想看到的是：

1. 你们有没有真的用 `Amazon S3`
2. 你们有没有真的用 `Amazon RDS`
3. 这两个云服务是不是和平台业务逻辑真实结合了

如果只有普通的登录、课程列表、公告、测验、成绩，这个平台虽然已经能跑，但老师看到时很容易把重点理解成“这是一个 Node.js 网站”，而不是“这是一个真正用到了 AWS 存储和数据库的 cloud application”。

所以这一轮专门补了两个最适合云平台展示的功能：

- `作业提交`
- `课程聊天 + 附件`

### 本轮数据库结构扩展

本轮在 [sql/schema.sql](/Users/guishuyu/cloud%20computing%20project/sql/schema.sql:168) 里新增了 3 张表：

1. `assignments`
   - 保存课程作业定义
   - 字段包括：
     - `course_id`
     - `title`
     - `description`
     - `due_at`
     - `created_by`

2. `assignment_submissions`
   - 保存学生提交记录
   - 字段包括：
     - `assignment_id`
     - `student_id`
     - `s3_key`
     - `file_name`
     - `content_type`
     - `submitted_at`
     - `graded_by`
     - `grade_value`
     - `feedback`
     - `graded_at`

3. `course_messages`
   - 保存课程聊天记录
   - 同时支持公聊和私聊
   - 字段包括：
     - `course_id`
     - `sender_user_id`
     - `recipient_user_id`
     - `body`
     - `attachment_s3_key`
     - `attachment_file_name`
     - `attachment_content_type`
     - `created_at`

### S3 和 RDS 在这轮里的职责分工

这一轮我刻意把文件和业务数据分开存，方便后面 presentation 时直接解释：

#### Assignment Submission

- `S3` 保存：
  - 学生提交的作业文件
- `RDS` 保存：
  - 作业标题
  - 作业描述
  - 截止时间
  - 谁提交了
  - 什么时间提交
  - 文件名
  - S3 对象 key
  - 成绩
  - 老师反馈

#### Course Chat

- `S3` 保存：
  - 聊天中的附件
  - 比如 PDF、图片、文档
- `RDS` 保存：
  - 课程消息正文
  - 发送人
  - 接收人
  - 所属课程
  - 是否是公聊 / 私聊
  - 消息发送时间
  - 附件文件名
  - 附件 S3 key

这部分是整份项目最适合在汇报里强调的设计点之一。

### 本轮后端代码实现

主要实现集中在 [app.js](/Users/guishuyu/cloud%20computing%20project/app.js:916)、[app.js](/Users/guishuyu/cloud%20computing%20project/app.js:1510)、[app.js](/Users/guishuyu/cloud%20computing%20project/app.js:5136)、[app.js](/Users/guishuyu/cloud%20computing%20project/app.js:7022)。

#### 1. 新增路径与辅助函数

在 [app.js](/Users/guishuyu/cloud%20computing%20project/app.js:916) 附近新增了：

- `assignmentDetailPath()`
- `directMessagePath()`

并补了这一类通用能力：

- 单文件上传中间件
- S3 object key 生成
- 文件上传到 S3
- 旧文件删除
- 消息正文标准化
- 存储课程消息

#### 2. Assignment 页面渲染

在 [app.js](/Users/guishuyu/cloud%20computing%20project/app.js:1510) 附近新增了：

- `renderAssignmentCards()`

作用是：

- teacher/admin 能看到 assignment 列表和提交统计
- student 能看到 assignment 列表和自己的提交状态

#### 3. Chat 页面渲染

在 [app.js](/Users/guishuyu/cloud%20computing%20project/app.js:1620) 附近新增了：

- `renderMessageFeed()`
- direct conversation summarizer
- direct conversation card render

作用是：

- 渲染课程公聊消息流
- 渲染私聊会话入口
- 渲染单独的私聊对话页面

#### 4. 课程页新增 Assignments / Messages 两个 tab

在 [app.js](/Users/guishuyu/cloud%20computing%20project/app.js:5136) 到 [app.js](/Users/guishuyu/cloud%20computing%20project/app.js:5379)：

- manager 课程页新增：
  - `Assignments`
  - `Messages`
- student 课程页也新增：
  - `Assignments`
  - `Messages`

具体表现为：

- teacher/admin 可以在课程里直接创建 assignment
- teacher/admin 可以在课程里发公聊、发私聊
- student 可以在课程里进入 assignment 提交页面
- student 可以在课程里看公聊、私聊、以及自己的 assignment 评分

#### 5. 新增 Assignment 相关路由

在 [app.js](/Users/guishuyu/cloud%20computing%20project/app.js:7022) 开始新增了：

- `POST /courses/:id/assignments`
- `GET /assignments/:id`
- `POST /assignments/:id/submit`
- `POST /assignments/:id/grade/:studentId`
- `GET /submissions/:id/download`

这些路由实现了完整闭环：

1. teacher/admin 创建 assignment
2. student 打开 assignment
3. student 上传文件到 S3
4. teacher/admin 下载学生提交
5. teacher/admin 给分并写反馈
6. student 回看自己的 grade 和 feedback

#### 6. 新增 Chat 相关路由

在 [app.js](/Users/guishuyu/cloud%20computing%20project/app.js:7462) 开始新增了：

- `POST /courses/:id/messages/public`
- `POST /courses/:id/messages/direct`
- `GET /courses/:courseId/messages/direct/:recipientId`
- `POST /courses/:courseId/messages/direct/:recipientId`
- `GET /messages/:id/download`

这些路由实现了：

- 课程公聊
- 私聊线程
- 聊天附件下载

### 权限设计

这一轮我没有把聊天和作业做成“任何人都能操作”的开放模型，而是按角色做了权限控制。

#### Assignment 权限

- `teacher/admin`
  - 可以创建 assignment
  - 可以查看课程里所有学生的 assignment 提交情况
  - 可以下载所有学生的 submission
  - 可以评分和写反馈
- `student`
  - 只能看到自己所在课程的 assignment
  - 只能上传自己的 submission
  - 只能下载自己的 submission
  - 只能查看自己的 grade 和 feedback

#### Chat 权限

- 公聊：
  - 课程成员都能看到
  - 课程成员都能发消息
- 私聊：
  - `student` 只能私聊课程老师 / admin
  - `teacher/admin` 可以私聊当前课程参与者
  - 附件下载只允许：
    - sender
    - recipient
    - admin

### 关键业务行为

为了让系统更像真实教学平台，而不是简单 demo，我还加了这些细节：

1. `assignment` 允许学生重新提交
   - 如果 student 再次上传：
     - 旧的 S3 文件会被删除
     - 新文件重新上传
     - 旧成绩和反馈会自动清空
   - 这样避免“文件已经变了，成绩还是旧版本”的数据不一致

2. `assignment` 过期后关闭上传
   - `due_at` 已过的 assignment 不再允许 student 上传

3. `chat` 支持仅文字、仅附件、文字 + 附件
   - 不是强制必须同时有两者

4. 所有新增动作都写入 operation log
   - 包括：
     - 创建 assignment
     - public chat 发帖
     - direct message 发送
     - assignment 评分

### 本轮部署过程

本轮不仅改了本地代码，也已经把新功能真正部署到 EC2，并且让它连接当前 AWS 云资源运行。

#### 部署到 EC2 的实际过程

1. 把新的 `app.js` 上传到 EC2 的 `~/elearn-app`
2. 发现第一次只更新了应用代码，但远程 `sql/schema.sql` 没同步成功
3. 结果是：
   - `/courses/1` 出现 500
   - 原因是远程数据库里还没有 `assignments`、`assignment_submissions`、`course_messages`

#### 本轮遇到的问题

问题点很具体：

- 本地代码已经引用了新表
- 远程数据库还没有导入新 schema
- 所以课程页查询新表时直接报错

#### 本轮修复方式

我实际做了这两步：

1. 用标准输入覆盖远程 `~/elearn-app/sql/schema.sql`
2. 重新导入 RDS：
   - 把新的 schema 真正写入 `elearndb`

修完后：

- `/courses/1` 恢复 200
- `/health` 恢复全绿

### 本轮真实验证

这轮不是只做了代码层面验证，而是做了完整的线上真实业务流测试。

#### 1. 基础检查

已经完成：

1. 本地 `node --check app.js` 通过
2. 线上 `/health` 返回：
   - `app.ok = true`
   - `database.ok = true`
   - `s3.ok = true`

#### 2. Assignment 真实流程验证

我实际跑了一遍：

1. teacher 登录
2. 在课程 `ACA-501` 里创建 assignment
3. student 登录
4. 打开 assignment 详情页
5. 上传一个真实测试文件到 S3
6. teacher 打开 assignment 评分页
7. 给这个 student 保存 grade 和 feedback
8. student 再回看 assignment 页面
9. 成功看到：
   - 自己上传的文件下载入口
   - grade
   - feedback

验证结果说明：

- `S3` 上传成功
- `RDS` 写入 submission metadata 成功
- `RDS` 写入 grade / feedback 成功

#### 3. Public Chat 真实流程验证

我实际跑了一遍：

1. teacher 在课程里发一条 public chat
2. 同时上传一个附件
3. student 进入课程消息区
4. 成功看到：
   - 公聊正文
   - 公聊附件下载入口

验证结果说明：

- `RDS` 保存消息正文成功
- `S3` 保存聊天附件成功

#### 4. Direct Message 真实流程验证

我实际跑了一遍：

1. teacher 对 student 发一条 direct message
2. 同时上传一个附件
3. student 进入对应 direct conversation
4. 成功看到：
   - 私聊消息
   - 私聊附件下载入口

验证结果说明：

- 私聊权限控制生效
- `RDS` 保存私聊元数据成功
- `S3` 保存私聊附件成功

### 这轮功能对最终 report / presentation 的价值

这一轮是整份项目里最适合拿来讲 `cloud storage + relational database` 的部分。

如果后面要做 presentation，这一轮可以直接拆成这几个讲点：

1. `Assignment Submission Workflow`
   - Student uploads assignment file to S3
   - Submission metadata and grading stay in RDS

2. `Course Chat Workflow`
   - Public course discussion
   - Direct messaging between teacher and student
   - Attachments stored in S3
   - Message records stored in RDS

3. `Access Control`
   - Different permissions for admin / teacher / student

4. `AWS Resource Usage`
   - `EC2` hosts the platform
   - `RDS` stores relational learning data
   - `S3` stores documents and attachments

### 本轮总结

这一轮完成后，这个平台已经不只是一个“课程展示网站”，而是一个更完整的云端教学平台：

1. 有课程内容管理
2. 有测验和成绩
3. 有作业提交流程
4. 有课程聊天和私聊
5. 有真正的 `S3 + RDS` 分层存储设计

这两块功能非常适合老师看，也非常适合你们组员后面写 report 和做 presentation。

## 第 19 轮：整体 UI 升级与多语言切换栏

### 本轮目标

这一轮主要做的是界面层优化，不改数据库结构，也不改现有业务功能，而是从用户体验上把整个平台再往“正式产品”方向推一层。

用户这轮提出了两个很明确的要求：

1. 整体 UI 更精致一些
2. 增加语言切换栏，支持：
   - 英语
   - 中文
   - 德语
   - 法语
   - 并且用国旗来切换

### 本轮实现内容

本轮核心改动集中在 [app.js](/Users/guishuyu/cloud%20computing%20project/app.js:40)、[app.js](/Users/guishuyu/cloud%20computing%20project/app.js:1908)、[app.js](/Users/guishuyu/cloud%20computing%20project/app.js:3349)。

#### 1. 顶部语言栏

现在所有页面顶部都新增了一个 language bar，支持：

- `🇬🇧 EN`
- `🇨🇳 中文`
- `🇩🇪 DE`
- `🇫🇷 FR`

这个语言栏是全站级的，不只是首页有，而是：

- 登录页有
- admin dashboard 有
- teacher dashboard 有
- student dashboard 有
- course detail 页面也有

#### 2. 语言切换实现方式

这轮没有去把所有页面拆成多份模板，也没有新增多语言后端路由，而是采用了更适合当前项目结构的实现方式：

- 前端语言脚本统一挂在 `renderPage()`
- 页面加载后，根据用户点击的语言切换当前 UI 文本
- 语言选择保存在浏览器 `localStorage`
- 下次打开页面时自动恢复上次选择的语言

这样做的好处是：

1. 不需要重构后端路由
2. 不需要给每个页面单独做一套 `/de`、`/fr` 路径
3. 对当前这个单文件 Express 项目最省改动、最稳定

#### 3. 已覆盖的多语言内容

这轮优先覆盖了用户最常见、最明显的界面文本，包括：

- 顶部导航
- dashboard 主要标题
- page menu / tab bar
- 常用按钮
- 常见筛选器
- 搜索框占位符
- assignments / messages / course content 这类高频模块标题
- 翻页与匹配数量标签
- 常见状态词

也就是说，语言切换不是只有顶部四个按钮在变，而是页面的主要操作区会一起跟着变。

#### 4. 整体视觉升级

本轮还统一抬了一版全局视觉：

- 更清晰的顶部 glass topbar
- 更明显的语言栏与导航分组
- 更柔和但层次更强的背景光斑
- hero 区的高光层次增强
- panel、card、announcement、course card 的 hover 抬升效果
- button、page menu、卡片的过渡动画
- 自然一点的页面进入动效

#### 5. 动画策略

这轮动画不是随便堆的，而是控制在“合适、不会烦”的范围内：

- 页面区块进场时轻微上浮
- brand mark 轻微呼吸感
- 卡片和按钮 hover 时有细微 lift
- 背景光斑缓慢漂移
- 对 `prefers-reduced-motion` 做了兼容，降低动画干扰

### 为什么这样做

这个项目现在已经有很多业务模块：

- 课程
- 文件
- 公告
- quiz
- gradebook
- assignment
- public chat
- private message

如果视觉层还是太平，老师在 presentation 时很容易把它看成“功能堆起来了，但不像一个成熟系统”。  
这一轮的目的就是让整个平台在第一眼上更像正式教学平台，而不是作业 demo。

### 本轮验证

本轮已经完成这些验证：

1. 本地 `node --check app.js` 通过
2. 代码中已经存在：
   - `language-bar`
   - `topbar-controls`
   - `ulh_locale`
3. 说明这一轮的多语言和 UI 入口已经正确接入全局页面渲染层

### 本轮总结

这一轮完成后，平台除了业务功能更完整之外，界面体验也更接近可展示的成品：

1. 顶部结构更清晰
2. 页面视觉更统一
3. 卡片和内容区更有层次
4. 支持英语、中文、德语、法语快速切换
5. 更适合最后做 live demo 和 presentation
