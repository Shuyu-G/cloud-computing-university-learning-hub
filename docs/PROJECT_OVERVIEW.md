# University E-Learning Platform

This workspace turns the PDF guide in [AWS_Guide_ELearning_1.pdf](/Users/guishuyu/cloud%20computing%20project/AWS_Guide_ELearning_1.pdf) into a role-based university learning platform that you can deploy on AWS.

## What is included

- `app.js`: Express app for login, role-based dashboards, courses, materials, announcements, quizzes, grades, and health checks.
- `.env.example`: Environment variable template for EC2 or local development.
- `sql/schema.sql`: MySQL schema for the `enrolments` table.
- `DEPLOYMENT_GUIDE.md`: Repo-specific steps mapped to the PDF phases.

## Features

- Admin, teacher, and student logins with different dashboards.
- Admin online-user monitor with force logout.
- Course creation, scheduling, announcements, and file uploads to S3.
- Teacher-built quizzes and grade entry.
- Student access to materials, announcements, quiz results, and grades.
- AWS health endpoint at `/health`.

## Local development

1. Install Node.js 18 or later.
2. Install dependencies:

```bash
npm install
```

3. Copy `.env.example` to `.env` and set your values. The app loads `.env` automatically through `dotenv`.
4. Create the database schema:

```bash
mysql -h your-rds-endpoint -u admin -p < sql/schema.sql
```

5. Start the app:

```bash
npm start
```

6. Open [http://localhost:3000](http://localhost:3000).

## Default accounts

The app seeds these demo accounts automatically if they do not already exist:

- `admin@example.com` / `Admin123!`
- `amelia.hart@universityhub.edu` / `Teacher123!`
- `mia.thompson@universityhub.edu` / `Student123!`

## AWS deployment

Use [`DEPLOYMENT_GUIDE.md`](/Users/guishuyu/cloud%20computing%20project/DEPLOYMENT_GUIDE.md) for the step-by-step mapping to the PDF guide.

## Notes

- The original PDF uses `#` comments inside JavaScript. Those are invalid in Node.js, so this repo replaces them with working code.
- The app now uses MySQL / RDS for users, courses, memberships, announcements, quizzes, quiz attempts, and grades.
- Course files are stored in S3 and delivered through signed download links.
