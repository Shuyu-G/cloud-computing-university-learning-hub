# University Learning Hub

## Screenshot Checklist

This file is for teammates who need to collect screenshots for the final report and presentation.

The goal is to avoid random screenshots. Instead, this checklist focuses on the images that best explain:

- what the platform does
- which AWS services were used
- how `EC2`, `RDS`, and `S3` support the final workflows

---

## 1. General Advice

Before taking screenshots:

1. Use the public site:
   - [http://ec2-3-123-16-253.eu-central-1.compute.amazonaws.com:3000/](http://ec2-3-123-16-253.eu-central-1.compute.amazonaws.com:3000/)
2. Refresh the page once to make sure the newest UI is loaded.
3. Use full browser width when possible so the layout looks cleaner.
4. Avoid screenshots with accidental personal browser tabs visible.
5. If a screenshot contains too much content, prefer one clean focused screenshot over one giant page capture.

---

## 2. Demo Accounts

Use these accounts for screenshots:

### Admin

- `admin@example.com`
- `Admin123!`

### Teacher

- `amelia.hart@universityhub.edu`
- `Teacher123!`

### Student

- `mia.thompson@universityhub.edu`
- `Student123!`

---

## 3. Best Screenshot Strategy

The best screenshots are not necessarily the most beautiful ones. They are the ones that support the cloud story clearly.

The strongest cloud screenshots are:

1. teacher uploads material
2. student downloads material
3. teacher creates assignment
4. student uploads assignment file
5. teacher grades assignment
6. public chat with attachment
7. private message with attachment
8. `/health` showing `app`, `database`, and `s3`
9. AWS console views for VPC, EC2, RDS, S3

These are the most important because they show:

- `EC2` hosting the app
- `RDS` storing academic/business data
- `S3` storing files and attachments

---

## 4. Report Screenshots

This section lists the screenshots that are most suitable for the written report.

## 4.1 Infrastructure Screenshots

These are important for the AWS deployment and architecture sections.

### Screenshot R1

- What to capture: EC2 instance summary
- Why: proves the app is deployed on AWS
- Suggested filename: `R1-ec2-instance-summary.png`

### Screenshot R2

- What to capture: RDS database overview or connectivity section
- Why: proves relational database deployment
- Suggested filename: `R2-rds-overview.png`

### Screenshot R3

- What to capture: S3 bucket overview
- Why: proves object storage deployment
- Suggested filename: `R3-s3-bucket-overview.png`

### Screenshot R4

- What to capture: VPC overview or subnet/security layout
- Why: supports networking and security discussion
- Suggested filename: `R4-vpc-network-layout.png`

### Screenshot R5

- What to capture: EC2 security group inbound rules
- Why: shows public app access design
- Suggested filename: `R5-ec2-security-group.png`

### Screenshot R6

- What to capture: RDS security group inbound rules
- Why: shows database isolation
- Suggested filename: `R6-rds-security-group.png`

### Screenshot R7

- What to capture: IAM role attached to EC2
- Why: shows secure S3 access without hardcoded keys
- Suggested filename: `R7-iam-role-ec2.png`

---

## 4.2 Application Overview Screenshots

These are useful for explaining the product itself before discussing the cloud integration.

### Screenshot R8

- What to capture: login page
- Why: clean project opening image
- Suggested filename: `R8-login-page.png`

### Screenshot R9

- What to capture: admin dashboard
- Why: shows system-wide control
- Suggested filename: `R9-admin-dashboard.png`

### Screenshot R10

- What to capture: teacher dashboard
- Why: shows academic management view
- Suggested filename: `R10-teacher-dashboard.png`

### Screenshot R11

- What to capture: student dashboard
- Why: shows learner view
- Suggested filename: `R11-student-dashboard.png`

---

## 4.3 Course Management Screenshots

These support the functional design part of the report.

### Screenshot R12

- What to capture: teacher course page `Overview`
- Why: shows course metadata and structure
- Suggested filename: `R12-course-overview.png`

### Screenshot R13

- What to capture: teacher course page `Manage`
- Why: shows course settings and enrollment tools
- Suggested filename: `R13-course-manage.png`

### Screenshot R14

- What to capture: teacher course page `Students & Grades`
- Why: shows gradebook and student activity
- Suggested filename: `R14-course-students-grades.png`

### Screenshot R15

- What to capture: teacher course page `Content`
- Why: shows materials, announcements, and quizzes
- Suggested filename: `R15-course-content.png`

---

## 4.4 Best RDS + S3 Workflow Screenshots

These are the most important screenshots in the whole project.

### Screenshot R16

- What to capture: teacher creates an assignment
- Why: shows assignment metadata workflow
- Suggested filename: `R16-create-assignment.png`

### Screenshot R17

- What to capture: student assignment page with upload form
- Why: shows S3 submission workflow
- Suggested filename: `R17-student-assignment-upload.png`

### Screenshot R18

- What to capture: teacher assignment review and grading page
- Why: shows grading stored in RDS
- Suggested filename: `R18-assignment-grading.png`

### Screenshot R19

- What to capture: student assignment page showing grade and feedback
- Why: shows end-to-end assignment result
- Suggested filename: `R19-assignment-feedback.png`

### Screenshot R20

- What to capture: teacher uploads a course file or a materials panel with uploaded files
- Why: shows course files stored in S3
- Suggested filename: `R20-course-materials.png`

### Screenshot R21

- What to capture: public course chat with attachment
- Why: shows `RDS + S3` combined in messaging
- Suggested filename: `R21-public-chat-attachment.png`

### Screenshot R22

- What to capture: direct private conversation with attachment
- Why: shows private messaging with S3-backed attachment
- Suggested filename: `R22-direct-message-attachment.png`

### Screenshot R23

- What to capture: `/health` endpoint in browser
- Why: shows application, database, and S3 connectivity all working
- Suggested filename: `R23-health-endpoint.png`

---

## 5. Presentation Screenshots

The presentation does not need as many screenshots as the report. It should use fewer, stronger images.

Recommended presentation screenshot set:

### Screenshot P1

- Login page
- Suggested filename: `P1-login-page.png`

### Screenshot P2

- AWS architecture support image
- This can be either:
  - a VPC/EC2/RDS/S3 screenshot set
  - or a clean custom diagram
- Suggested filename: `P2-aws-architecture.png`

### Screenshot P3

- Admin dashboard
- Suggested filename: `P3-admin-dashboard.png`

### Screenshot P4

- Teacher course page
- Suggested filename: `P4-teacher-course-page.png`

### Screenshot P5

- Assignment submission page or grading page
- Suggested filename: `P5-assignment-workflow.png`

### Screenshot P6

- Public chat or private chat with attachment
- Suggested filename: `P6-messaging-workflow.png`

### Screenshot P7

- `/health` endpoint
- Suggested filename: `P7-health-endpoint.png`

These 7 screenshots are enough for a strong 15-minute presentation.

---

## 6. Suggested Screenshot Order for the Report Writer

If the report writer wants the fastest path, take screenshots in this order:

1. login page
2. admin dashboard
3. teacher dashboard
4. student dashboard
5. teacher course overview
6. teacher content tab
7. assignment create page
8. student assignment upload page
9. teacher assignment grading page
10. public chat with attachment
11. private direct message with attachment
12. `/health`
13. EC2 summary
14. RDS overview
15. S3 bucket overview
16. VPC view
17. security groups
18. IAM role

This order gives enough material for both the report and the presentation.

---

## 7. Suggested Screenshot Order for the Presentation Owner

If the presentation owner only needs a short set, use this order:

1. login page
2. AWS architecture image
3. teacher course page
4. assignment upload/grading workflow
5. chat with attachment
6. `/health`

This is enough for a clean 15-minute talk.

---

## 8. Best Captions to Use in the Report

Below are simple caption examples that can be reused.

### Example caption 1

`Figure X. Login page of the University Learning Hub platform.`

### Example caption 2

`Figure X. Admin dashboard showing account directory and platform oversight tools.`

### Example caption 3

`Figure X. Teacher course interface with content, grading, assignments, and messaging modules.`

### Example caption 4

`Figure X. Assignment submission workflow, where files are uploaded to Amazon S3 and grading metadata is stored in Amazon RDS.`

### Example caption 5

`Figure X. Public course messaging with attachment support, combining relational records in RDS and file storage in S3.`

### Example caption 6

`Figure X. Health endpoint confirming connectivity between the EC2-hosted application, Amazon RDS, and Amazon S3.`

### Example caption 7

`Figure X. AWS deployment resources including EC2, RDS, and S3.`

---

## 9. Final Advice

If there is not enough time to take many screenshots, do not try to capture everything.

The most valuable images are the ones that support this message:

`The application runs on EC2, stores structured teaching data in RDS, and stores files and attachments in S3.`

If the screenshots help explain that clearly, they are the right screenshots.
