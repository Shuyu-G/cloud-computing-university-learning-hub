# University Learning Hub Docs

This folder contains the main project documents for teammates.

## Website

- Public website: [http://ec2-3-123-16-253.eu-central-1.compute.amazonaws.com:3000/](http://ec2-3-123-16-253.eu-central-1.compute.amazonaws.com:3000/)

## GitHub Repository

- Source code: [https://github.com/Shuyu-G/cloud-computing-university-learning-hub](https://github.com/Shuyu-G/cloud-computing-university-learning-hub)

## Recommended reading order

1. [TEAMMATE_GUIDE.md](./TEAMMATE_GUIDE.md)
   What the website does, how to log in, and how each role should use it.
2. [REPORT_DRAFT.md](./REPORT_DRAFT.md)
   Main report draft with architecture, AWS services, workflows, and screenshot suggestions.
3. [PRESENTATION_SCRIPT.md](./PRESENTATION_SCRIPT.md)
   A 15-minute presentation script with slide order and speaking notes.
4. [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)
   Short project overview and local run summary.
5. [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
   AWS deployment guide and infrastructure setup notes.
6. [PROJECT_EXECUTION_LOG.md](./PROJECT_EXECUTION_LOG.md)
   Internal long-form build record.

## Suggested teammate split

- Report writer:
  Focus on [REPORT_DRAFT.md](./REPORT_DRAFT.md), then use [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) and [PROJECT_EXECUTION_LOG.md](./PROJECT_EXECUTION_LOG.md) as support.
- Presentation owner:
  Start with [PRESENTATION_SCRIPT.md](./PRESENTATION_SCRIPT.md), then use [TEAMMATE_GUIDE.md](./TEAMMATE_GUIDE.md) to understand the live product flow.

## Main AWS story to remember

- `EC2` runs the Node.js application
- `RDS` stores structured teaching data
- `S3` stores course files, assignment submissions, and chat attachments
- `VPC`, `Security Groups`, and `IAM` make the system secure and deployable
