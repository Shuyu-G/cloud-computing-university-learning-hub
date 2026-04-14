# University Learning Hub Docs

This folder is the main handover entry for teammates.

If someone in the group needs to understand the project quickly, this is the best place to start. The documents here are organized by purpose: using the website, writing the report, preparing the presentation, and collecting screenshots.

## Quick Access

- Public website: [http://ec2-3-123-16-253.eu-central-1.compute.amazonaws.com:3000/](http://ec2-3-123-16-253.eu-central-1.compute.amazonaws.com:3000/)
- GitHub repository: [https://github.com/Shuyu-G/cloud-computing-university-learning-hub](https://github.com/Shuyu-G/cloud-computing-university-learning-hub)

## Start Here

1. [HANDOVER_MESSAGE.md](./HANDOVER_MESSAGE.md)
   Ready-to-send message for teammates with links, what is finished, and what each file is for.
2. [TEAMMATE_GUIDE.md](./TEAMMATE_GUIDE.md)
   Best first reading file. Explains what the platform does, how to log in, and how each role uses the system.
3. [SCREENSHOT_CHECKLIST.md](./SCREENSHOT_CHECKLIST.md)
   Practical screenshot list for both the report writer and the presentation owner.

## Main Project Documents

4. [REPORT_DRAFT.md](./REPORT_DRAFT.md)
   Detailed report draft with architecture, AWS usage, workflows, and screenshot suggestions.
5. [PRESENTATION_SCRIPT.md](./PRESENTATION_SCRIPT.md)
   A 15-minute presentation script with slide order, speaking points, and demo advice.
6. [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)
   Short project overview and local run summary.
7. [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
   AWS deployment guide and infrastructure setup notes.
8. [PROJECT_EXECUTION_LOG.md](./PROJECT_EXECUTION_LOG.md)
   Internal long-form build record.

## Recommended Division of Work

- Report writer:
  Start with [REPORT_DRAFT.md](./REPORT_DRAFT.md), then use [SCREENSHOT_CHECKLIST.md](./SCREENSHOT_CHECKLIST.md) and [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).
- Presentation owner:
  Start with [PRESENTATION_SCRIPT.md](./PRESENTATION_SCRIPT.md), then use [SCREENSHOT_CHECKLIST.md](./SCREENSHOT_CHECKLIST.md) and [TEAMMATE_GUIDE.md](./TEAMMATE_GUIDE.md).
- Any teammate who just wants to understand the website:
  Read [TEAMMATE_GUIDE.md](./TEAMMATE_GUIDE.md) first.

## Core AWS Story

The most important summary of the whole project is:

- `EC2` runs the Node.js application
- `RDS` stores structured teaching and platform data
- `S3` stores course files, assignment submissions, and chat attachments
- `VPC`, `Security Groups`, and `IAM` support the deployment and access control

If teammates remember that summary, they understand the main cloud-computing value of the project.
