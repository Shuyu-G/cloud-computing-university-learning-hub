# University Learning Hub

## Teammate Guide

This file is written for teammates who need to understand the final website quickly without reading the full technical implementation documents first.

It explains:

- what the website is
- where to access it
- which demo accounts exist
- what each role can do
- how to explore the system
- which features are especially important for the Cloud Computing course

---

## 1. Website Access

### Public website

- Main site: [http://ec2-3-123-16-253.eu-central-1.compute.amazonaws.com:3000/](http://ec2-3-123-16-253.eu-central-1.compute.amazonaws.com:3000/)

If the page looks old or incomplete, refresh once or do a hard refresh.

---

## 2. What This Website Is

University Learning Hub is a role-based university teaching platform built for our Cloud Computing project.

It is not just a static website. It is a working cloud-backed system with:

- role-based login
- course management
- announcements
- downloadable course materials
- quizzes
- grades
- assignment submission
- public course discussion
- private messaging

The project is deployed on AWS and uses:

- `EC2` for the application server
- `RDS` for the database
- `S3` for document and attachment storage

---

## 3. Demo Accounts

The platform includes three main demo roles:

### Admin

- Email: `admin@example.com`
- Password: `Admin123!`

### Teacher

- Email: `amelia.hart@universityhub.edu`
- Password: `Teacher123!`

### Student

- Email: `mia.thompson@universityhub.edu`
- Password: `Student123!`

There are also many additional teacher and student accounts inside the platform, but for normal exploration these three are enough.

---

## 4. Language Bar

At the top of the website there is a language bar with flag buttons.

Supported languages:

- `🇬🇧 English`
- `🇨🇳 中文`
- `🇩🇪 Deutsch`
- `🇫🇷 Français`

This changes the main interface language for easier navigation.

---

## 5. What Each Role Can Do

## 5.1 Admin

The admin role is the system manager.

Admin can:

- view all accounts
- see usernames and demo passwords
- see whether teachers and students are online
- force users to log out
- create users
- import and export users by CSV
- create courses
- view platform-level logs
- access courses and see their content

### Best way to explore the admin side

1. Log in as admin
2. Open the `People` tab
3. View the teacher and student directory
4. Open the `Curriculum` tab
5. Open one course
6. Look at:
   - `Overview`
   - `Students & Grades`
   - `Content`
   - `Assignments`
   - `Messages`

---

## 5.2 Teacher

The teacher role is the main academic manager.

Teacher can:

- create courses
- set schedule and course description
- upload course materials
- publish announcements
- create quizzes
- review student activity
- enter or update grades
- create assignments
- review submissions
- grade assignments
- post public messages
- send private messages
- import and export CSV data

### Best way to explore the teacher side

1. Log in as teacher
2. Open the `Courses` tab
3. Open a course
4. In the course page, switch through:
   - `Overview`
   - `Manage`
   - `Students & Grades`
   - `Content`
   - `Assignments`
   - `Messages`

The teacher course page is one of the most important parts of the whole system.

---

## 5.3 Student

The student role is the learner view.

Student can:

- open enrolled courses
- download files
- read announcements
- take quizzes
- view grades
- open assignments
- upload assignment files
- see assignment feedback
- join public course discussion
- send private messages to teachers

### Best way to explore the student side

1. Log in as student
2. Open a course
3. Check:
   - `Content`
   - `Assignments`
   - `Messages`
   - `Grade`

This role is useful for showing the learner experience.

---

## 6. Main Features to Know

This section explains the most important features in simple terms.

## 6.1 Course creation

Teachers and admin users can create courses with:

- title
- course code
- study level
- program name
- schedule
- description

## 6.2 Course materials

Teachers upload learning materials and students download them.

These files are stored in `Amazon S3`.

## 6.3 Announcements

Teachers can post class announcements. Students can read them in the course page and dashboard.

## 6.4 Quizzes

Teachers can build quizzes and students can submit answers.

Quiz results and attempts are stored in the database.

## 6.5 Grades

Teachers can enter grades and feedback. Students can see the recorded results.

## 6.6 Assignment submission

This is one of the most important features in the project.

Teacher:

- creates an assignment
- sets description and due date

Student:

- opens the assignment
- uploads a submission file

Teacher:

- reviews the submission
- saves grade and feedback

This feature is important because:

- the uploaded file goes to `S3`
- the metadata, grade, and feedback go to `RDS`

## 6.7 Course chat

Each course has:

- a public discussion area
- private direct messaging

Messages are stored in the database, while attachments go to S3.

---

## 7. Why This Project Matters for the Cloud Computing Course

From a course perspective, the most important thing is not only that the website works, but that it uses AWS services in meaningful ways.

### 7.1 EC2

The application itself runs on an AWS EC2 instance.

That means:

- the website is hosted in the cloud
- the server is not just running locally on a laptop

### 7.2 RDS

Amazon RDS stores the structured teaching data, including:

- users
- roles
- courses
- enrollments
- announcements
- quizzes
- grades
- assignments
- assignment records
- course messages

### 7.3 S3

Amazon S3 stores the file-based content, including:

- course materials
- assignment submission files
- public chat attachments
- private chat attachments

### 7.4 Why assignment and messaging are especially important

These two features are the clearest examples of cloud integration:

- `Assignment system`
  - file in `S3`
  - grading and metadata in `RDS`
- `Messaging system`
  - text in `RDS`
  - attachments in `S3`

If someone asks what the strongest cloud features are, these are the best answers.

---

## 8. Suggested Exploration Order for Teammates

If a teammate wants to understand the system quickly, the best order is:

1. Open the website
2. Try the language bar
3. Log in as `admin`
4. Look at `People` and `Curriculum`
5. Log out
6. Log in as `teacher`
7. Open a course
8. Look at:
   - `Content`
   - `Assignments`
   - `Messages`
9. Log out
10. Log in as `student`
11. Open the same course
12. Check:
   - downloaded materials
   - assignment page
   - messages
   - grade tab

This is the fastest way to understand the whole project.

---

## 9. Best Features for Screenshots

If someone needs screenshots for report or presentation, these are the best ones to capture:

### General product screenshots

- login page
- admin dashboard
- teacher dashboard
- student dashboard

### Best cloud-related screenshots

- teacher uploads course material
- student downloads course material
- teacher creates assignment
- student uploads assignment
- teacher grades assignment
- public course chat with attachment
- private direct message with attachment
- `/health` showing app, database, and S3 all working

These screenshots are especially useful because they help explain how `RDS` and `S3` are used.

---

## 10. Short Summary for Teammates

If you only remember one summary, remember this:

`EC2 runs the platform, RDS stores the structured teaching data, and S3 stores the files and attachments.`

That is the main cloud-computing story of the whole project.
