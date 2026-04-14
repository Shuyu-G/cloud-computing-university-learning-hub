# Handover Message

You can copy and send the message below to teammates.

---

大家好，

网页部分我这边已经基本完成了，项目也已经上传到 GitHub 了，你们现在可以直接看网站和文档。

## 网站链接

- 网站公网地址：
  [http://ec2-3-123-16-253.eu-central-1.compute.amazonaws.com:3000/](http://ec2-3-123-16-253.eu-central-1.compute.amazonaws.com:3000/)

## GitHub

- 项目仓库：
  [https://github.com/Shuyu-G/cloud-computing-university-learning-hub](https://github.com/Shuyu-G/cloud-computing-university-learning-hub)

## Admin 账号

- Email: `admin@example.com`
- Password: `Admin123!`

你们也可以在网站里切换语言，顶部有语言栏：

- 英语
- 中文
- 德语
- 法语

## 文档位置

所有主要文档都在仓库里的 `docs/` 文件夹。

最重要的几个文件是：

1. `docs/TEAMMATE_GUIDE.md`
   - 给大家快速看懂这个网站是做什么的
   - 包括网站链接、账号、不同角色能做什么

2. `docs/REPORT_DRAFT.md`
   - 给写 report 的同学用
   - 里面已经整理好了项目背景、AWS 架构、VPC/EC2/RDS/S3 的用途、系统功能、工作流、验证结果等内容

3. `docs/PRESENTATION_SCRIPT.md`
   - 给做 presentation 的同学用
   - 里面已经写了一个大约 15 分钟的讲稿结构，包括每一页讲什么、重点说什么

4. `docs/SCREENSHOT_CHECKLIST.md`
   - 给 report 和 presentation 截图用
   - 已经列好了哪些页面最值得截、为什么要截、建议按什么顺序截

5. `docs/README.md`
   - 文档总入口
   - 不知道先看哪个文件的话，就从这个开始

## 这个项目现在实现了什么

现在网站已经不只是一个简单 demo，而是一个完整的教学平台原型，主要包括：

- admin / teacher / student 三种角色登录
- 课程创建和管理
- 课程资料上传与下载
- 公告
- quiz
- 成绩管理
- assignment 提交和评分
- public chat
- private message

最重要的是，这个项目明确用了 AWS 的几个关键服务：

- `EC2`：跑整个网站
- `RDS`：存用户、课程、成绩、消息、assignment 这些结构化数据
- `S3`：存课程文件、assignment 提交文件、聊天附件

所以后面写 report 和 presentation 的时候，重点可以放在：

- 我们怎么部署在 AWS 上
- `RDS` 和 `S3` 分别做了什么
- assignment 和 messaging 这两个功能最能体现云平台价值

如果你们打开网站看到旧页面，先刷新一下就行。

---

Short English version if needed:

The website part is finished and the project has been uploaded to GitHub. Please start with `docs/README.md`, then use `docs/REPORT_DRAFT.md` for the report, `docs/PRESENTATION_SCRIPT.md` for the presentation, and `docs/SCREENSHOT_CHECKLIST.md` for screenshots. The admin login is `admin@example.com / Admin123!`.
