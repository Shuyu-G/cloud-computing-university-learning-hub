require("dotenv").config();

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const express = require("express");
const multer = require("multer");
const mysql = require("mysql2/promise");
const {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

const SESSION_COOKIE_NAME = "elearn_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;
const ONLINE_WINDOW_MS = 5 * 60 * 1000;
const port = Number(process.env.PORT || 3000);

const dbConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "admin",
  password: process.env.DB_PASS,
  database: process.env.DB_NAME || "elearndb",
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: false,
};

const bucketName = process.env.S3_BUCKET_NAME || "";
const awsRegion = process.env.AWS_REGION || "eu-central-1";

const UI_LANGUAGE_OPTIONS = [
  { code: "en", flag: "🇬🇧", shortLabel: "EN", label: "English" },
  { code: "zh", flag: "🇨🇳", shortLabel: "中文", label: "中文" },
  { code: "de", flag: "🇩🇪", shortLabel: "DE", label: "Deutsch" },
  { code: "fr", flag: "🇫🇷", shortLabel: "FR", label: "Français" },
  { code: "hi", flag: "🇮🇳", shortLabel: "HI", label: "हिन्दी" },
  { code: "ar", flag: "🇸🇦", shortLabel: "AR", label: "العربية" },
];

const UI_TEXT_TRANSLATIONS = {
  zh: {
    Dashboard: "控制台",
    "Log out": "退出登录",
    Login: "登录",
    Email: "邮箱",
    Password: "密码",
    "Sign in": "登录",
    "Admin operations center": "管理员控制中心",
    "Teacher Dashboard": "教师控制台",
    "Student Dashboard": "学生控制台",
    People: "人员",
    Provisioning: "配置",
    Curriculum: "课程体系",
    Oversight: "总览",
    Create: "创建",
    Courses: "课程",
    Updates: "更新",
    Audit: "日志",
    Overview: "概览",
    Manage: "管理",
    "Students & Grades": "学生与成绩",
    Content: "内容",
    Assignments: "作业",
    Messages: "消息",
    Grade: "成绩",
    "Create a course": "创建课程",
    "Create course": "创建课程",
    "All live courses": "全部开课课程",
    "Recent course news": "最新课程公告",
    "Managed courses": "管理中的课程",
    "Your classroom spaces": "你的教学空间",
    "Recent teacher updates": "教师最新动态",
    "My recent actions": "我的最近操作",
    "My courses": "我的课程",
    "Study spaces": "学习空间",
    Announcements: "公告",
    "Latest course notices": "最新课程通知",
    "Recent quiz results": "最近测验结果",
    Grades: "成绩",
    "Recorded marks": "已记录成绩",
    "Course grades": "课程成绩册",
    "Student activity": "学生活动",
    "Course files": "课程文件",
    "Materials and downloadable courseware": "课件与可下载资料",
    "Announcement board": "公告栏",
    "Latest notices": "最新通知",
    Quizzes: "测验",
    "Assessments for this course": "本课程测验",
    "Public channel": "公共频道",
    "Course discussion board": "课程讨论区",
    "Private chat": "私聊",
    "Direct messages with teachers and students": "与教师和学生私信",
    "Private messages with teachers": "与教师私信",
    "Submission tracking and grading": "提交跟踪与评分",
    "Open assignments and my submissions": "作业与我的提交",
    "Submit coursework to cloud storage": "将作业提交到云存储",
    "Create assignment": "创建作业",
    "Open assignment": "打开作业",
    "Open course": "进入课程",
    "Open quiz": "打开测验",
    "Open conversation": "打开会话",
    Edit: "编辑",
    Delete: "删除",
    Download: "下载",
    "Download my submission": "下载我的提交",
    "Save grade": "保存成绩",
    Previous: "上一页",
    Next: "下一页",
    "Expand all": "全部展开",
    "Collapse all": "全部收起",
    "Post announcement": "发布公告",
    "Post to course chat": "发送到课程聊天",
    "Send private message": "发送私信",
    "Send message": "发送消息",
    Recipient: "收件人",
    Message: "消息",
    Attachment: "附件",
    "Submission file": "提交文件",
    "Due date": "截止时间",
    Description: "说明",
    "Course title": "课程标题",
    "Course code": "课程代码",
    "Study level": "学习层级",
    "Programme / major": "专业 / 方向",
    Schedule: "时间安排",
    "Search course, code, teacher": "搜索课程、代码或教师",
    "Search student name or email": "搜索学生姓名或邮箱",
    "Search student, email, or grade": "搜索学生、邮箱或成绩",
    "Search files, titles, or uploaders": "搜索文件、标题或上传者",
    "Search announcements": "搜索公告",
    "Search quizzes": "搜索测验",
    "Search assignments": "搜索作业",
    "Enter your password": "输入你的密码",
    "All programmes": "全部专业",
    Undergraduate: "本科",
    Graduate: "研究生",
    "Online first": "在线优先",
    "Recently seen": "最近在线",
    "Least recent": "最久未在线",
    "Newest first": "最新优先",
    "Newest uploads": "最新上传",
    "Oldest uploads": "最早上传",
    "Newest posts": "最新发布",
    "Oldest posts": "最早发布",
    "Due soonest": "最早截止",
    "Due latest": "最晚截止",
    "Title A-Z": "标题 A-Z",
    "Author A-Z": "作者 A-Z",
    "Uploader A-Z": "上传者 A-Z",
    "Most attempts": "提交次数最多",
    "Name A-Z": "姓名 A-Z",
    "Name Z-A": "姓名 Z-A",
    "All results": "全部结果",
    Graded: "已评分",
    "Not graded": "未评分",
    Online: "在线",
    Offline: "离线",
    Never: "从未",
    "No due date": "无截止时间",
    "Attachment only": "仅附件",
    "No message preview": "暂无预览",
    "Directory credentials": "目录账户信息",
    "Teacher and student activity": "教师与学生活动",
    "Create a new user": "创建新用户",
    "Bulk import and export": "批量导入与导出",
    "Recent admin and teacher actions": "管理员与教师最近操作",
    "Online now": "当前在线",
    "Course settings": "课程设置",
    Enrollment: "选课管理",
    "Record or update grades": "录入或更新成绩",
    Teachers: "教师",
    Students: "学生",
    "All statuses": "全部状态",
    "All roles": "全部角色",
    "All levels": "全部层级",
    "Download roster template": "下载名单模板",
    "Download unenrollment template": "下载退课模板",
    "Download grade template": "下载成绩模板",
    "Download import template": "下载导入模板",
    "Export users CSV": "导出用户 CSV",
    "Import users CSV": "导入用户 CSV",
    "Import enrollments CSV": "导入选课 CSV",
    "Import unenrollments CSV": "导入退课 CSV",
    "Import grades CSV": "导入成绩 CSV",
    "Latest score": "最近得分",
    "Latest result": "最近结果",
    "Not attempted yet": "尚未作答",
    "Not submitted yet": "尚未提交",
    "Not submitted": "未提交",
    "Not scheduled": "未安排",
    "No programmes configured yet.": "尚未配置专业。",
    "No courses created yet.": "尚未创建课程。",
    "Admin and teacher changes will appear here once people start managing the platform.":
      "当管理员和教师开始管理平台后，这里会显示他们的操作记录。",
    "Announcements will appear here after teachers publish them.":
      "教师发布公告后，这里会显示相关内容。",
    "Course updates, roster changes, and grading actions will appear here.":
      "课程更新、名单变动和评分操作会显示在这里。",
    "No announcements have been posted for your courses yet.": "你的课程尚未发布任何公告。",
    "Quiz submissions will appear here after you complete them.": "完成测验后，提交记录会显示在这里。",
    "No feedback yet.": "暂无反馈。",
    "No grades have been posted yet.": "尚未发布任何成绩。",
    "No students are enrolled in this course yet.": "这门课程目前还没有学生选课。",
    "No grade has been posted for this course yet.": "这门课程目前还没有发布成绩。",
    "No assignments have been posted for this course yet.": "这门课程目前还没有发布作业。",
    "No public discussion messages have been posted yet.": "公共讨论区还没有消息。",
    "No private conversations have been started yet.": "尚未开始任何私聊会话。",
    "No materials have been published for this course yet.": "这门课程尚未发布任何资料。",
    "No announcements have been posted for this course yet.": "这门课程尚未发布任何公告。",
    "No quizzes are available yet.": "目前还没有可用测验。",
    "No submission yet": "尚未提交",
    "No private messages have been sent in this conversation yet.": "该会话中尚未发送任何私信。",
    "No attempt submitted yet": "尚未提交作答",
    "No students have submitted this quiz yet.": "目前还没有学生提交这个测验。",
    "You have been signed out.": "你已退出登录。",
  },
  de: {
    Dashboard: "Dashboard",
    "Log out": "Abmelden",
    Login: "Anmelden",
    Email: "E-Mail",
    Password: "Passwort",
    "Sign in": "Einloggen",
    "Admin operations center": "Admin-Zentrale",
    "Teacher Dashboard": "Lehrenden-Dashboard",
    "Student Dashboard": "Studierenden-Dashboard",
    People: "Personen",
    Provisioning: "Verwaltung",
    Curriculum: "Curriculum",
    Oversight: "Übersicht",
    Create: "Erstellen",
    Courses: "Kurse",
    Updates: "Updates",
    Audit: "Protokoll",
    Overview: "Überblick",
    Manage: "Verwalten",
    "Students & Grades": "Studierende & Noten",
    Content: "Inhalte",
    Assignments: "Abgaben",
    Messages: "Nachrichten",
    Grade: "Note",
    "Create a course": "Kurs erstellen",
    "Create course": "Kurs erstellen",
    "All live courses": "Alle aktiven Kurse",
    "Recent course news": "Neueste Kursmeldungen",
    "Managed courses": "Verwaltete Kurse",
    "Your classroom spaces": "Ihre Kursräume",
    "Recent teacher updates": "Neueste Lehrenden-Updates",
    "My recent actions": "Meine letzten Aktionen",
    "My courses": "Meine Kurse",
    "Study spaces": "Lernräume",
    Announcements: "Ankündigungen",
    "Latest course notices": "Neueste Kursinfos",
    "Recent quiz results": "Letzte Quiz-Ergebnisse",
    Grades: "Noten",
    "Recorded marks": "Erfasste Noten",
    "Course grades": "Kursnoten",
    "Student activity": "Studierendenaktivität",
    "Course files": "Kursdateien",
    "Materials and downloadable courseware": "Materialien und Downloads",
    "Announcement board": "Anschlagbrett",
    "Latest notices": "Neueste Hinweise",
    Quizzes: "Quizze",
    "Assessments for this course": "Bewertungen für diesen Kurs",
    "Public channel": "Öffentlicher Kanal",
    "Course discussion board": "Kursdiskussion",
    "Private chat": "Privatchat",
    "Direct messages with teachers and students": "Direktnachrichten mit Lehrenden und Studierenden",
    "Private messages with teachers": "Private Nachrichten mit Lehrenden",
    "Submission tracking and grading": "Abgaben und Bewertung",
    "Open assignments and my submissions": "Abgaben und meine Einreichungen",
    "Submit coursework to cloud storage": "Arbeiten in den Cloud-Speicher hochladen",
    "Create assignment": "Abgabe erstellen",
    "Open assignment": "Abgabe öffnen",
    "Open course": "Kurs öffnen",
    "Open quiz": "Quiz öffnen",
    "Open conversation": "Konversation öffnen",
    Edit: "Bearbeiten",
    Delete: "Löschen",
    Download: "Herunterladen",
    "Download my submission": "Meine Abgabe herunterladen",
    "Save grade": "Note speichern",
    Previous: "Zurück",
    Next: "Weiter",
    "Expand all": "Alles ausklappen",
    "Collapse all": "Alles einklappen",
    "Post announcement": "Ankündigung posten",
    "Post to course chat": "Im Kurschat posten",
    "Send private message": "Private Nachricht senden",
    "Send message": "Nachricht senden",
    Recipient: "Empfänger",
    Message: "Nachricht",
    Attachment: "Anhang",
    "Submission file": "Abgabedatei",
    "Due date": "Fälligkeitsdatum",
    Description: "Beschreibung",
    "Course title": "Kurstitel",
    "Course code": "Kurscode",
    "Study level": "Studienstufe",
    "Programme / major": "Studiengang / Fach",
    Schedule: "Termin",
    "Search course, code, teacher": "Kurs, Code oder Lehrperson suchen",
    "Search student name or email": "Studierendenname oder E-Mail suchen",
    "Search student, email, or grade": "Studierende, E-Mail oder Note suchen",
    "Search files, titles, or uploaders": "Dateien, Titel oder Uploader suchen",
    "Search announcements": "Ankündigungen suchen",
    "Search quizzes": "Quizze suchen",
    "Search assignments": "Abgaben suchen",
    "Enter your password": "Passwort eingeben",
    "All programmes": "Alle Studiengänge",
    Undergraduate: "Bachelor",
    Graduate: "Master",
    "Online first": "Online zuerst",
    "Recently seen": "Zuletzt gesehen",
    "Least recent": "Am längsten her",
    "Newest first": "Neueste zuerst",
    "Newest uploads": "Neueste Uploads",
    "Oldest uploads": "Älteste Uploads",
    "Newest posts": "Neueste Beiträge",
    "Oldest posts": "Älteste Beiträge",
    "Due soonest": "Am frühesten fällig",
    "Due latest": "Am spätesten fällig",
    "Title A-Z": "Titel A-Z",
    "Author A-Z": "Autor A-Z",
    "Uploader A-Z": "Uploader A-Z",
    "Most attempts": "Meiste Versuche",
    "Name A-Z": "Name A-Z",
    "Name Z-A": "Name Z-A",
    "All results": "Alle Ergebnisse",
    Graded: "Bewertet",
    "Not graded": "Nicht bewertet",
    Online: "Online",
    Offline: "Offline",
    Never: "Nie",
    "No due date": "Kein Fälligkeitsdatum",
    "Attachment only": "Nur Anhang",
    "No message preview": "Keine Vorschau",
    "Directory credentials": "Verzeichniszugänge",
    "Teacher and student activity": "Aktivität von Lehrenden und Studierenden",
    "Create a new user": "Neuen Benutzer anlegen",
    "Bulk import and export": "Massenimport und -export",
    "Recent admin and teacher actions": "Letzte Admin- und Lehrenden-Aktionen",
    "Online now": "Jetzt online",
    "Course settings": "Kurseinstellungen",
    Enrollment: "Einschreibung",
    "Record or update grades": "Noten erfassen oder aktualisieren",
    Teachers: "Lehrende",
    Students: "Studierende",
    "All statuses": "Alle Status",
    "All roles": "Alle Rollen",
    "All levels": "Alle Ebenen",
    "Download roster template": "Vorlage für Teilnehmerliste herunterladen",
    "Download unenrollment template": "Vorlage für Abmeldungen herunterladen",
    "Download grade template": "Vorlage für Noten herunterladen",
    "Download import template": "Importvorlage herunterladen",
    "Export users CSV": "Benutzer-CSV exportieren",
    "Import users CSV": "Benutzer-CSV importieren",
    "Import enrollments CSV": "Einschreibungs-CSV importieren",
    "Import unenrollments CSV": "Abmelde-CSV importieren",
    "Import grades CSV": "Noten-CSV importieren",
    "Latest score": "Letztes Ergebnis",
    "Latest result": "Letztes Resultat",
    "Not attempted yet": "Noch nicht versucht",
    "Not submitted yet": "Noch nicht eingereicht",
    "Not submitted": "Nicht eingereicht",
    "Not scheduled": "Nicht geplant",
    "No programmes configured yet.": "Noch keine Studiengänge konfiguriert.",
    "No courses created yet.": "Noch keine Kurse erstellt.",
    "Admin and teacher changes will appear here once people start managing the platform.":
      "Hier erscheinen Änderungen von Admins und Lehrenden, sobald die Plattform aktiv genutzt wird.",
    "Announcements will appear here after teachers publish them.":
      "Hier erscheinen Ankündigungen, sobald Lehrende sie veröffentlichen.",
    "Course updates, roster changes, and grading actions will appear here.":
      "Kursupdates, Listenänderungen und Bewertungsaktionen erscheinen hier.",
    "No announcements have been posted for your courses yet.": "Für Ihre Kurse wurden noch keine Ankündigungen veröffentlicht.",
    "Quiz submissions will appear here after you complete them.": "Quiz-Einreichungen erscheinen hier, sobald Sie sie abgeschlossen haben.",
    "No feedback yet.": "Noch kein Feedback.",
    "No grades have been posted yet.": "Es wurden noch keine Noten veröffentlicht.",
    "No students are enrolled in this course yet.": "In diesen Kurs sind noch keine Studierenden eingeschrieben.",
    "No grade has been posted for this course yet.": "Für diesen Kurs wurde noch keine Note veröffentlicht.",
    "No assignments have been posted for this course yet.": "Für diesen Kurs wurden noch keine Aufgaben veröffentlicht.",
    "No public discussion messages have been posted yet.": "Es wurden noch keine öffentlichen Diskussionsnachrichten veröffentlicht.",
    "No private conversations have been started yet.": "Es wurden noch keine privaten Gespräche begonnen.",
    "No materials have been published for this course yet.": "Für diesen Kurs wurden noch keine Materialien veröffentlicht.",
    "No announcements have been posted for this course yet.": "Für diesen Kurs wurden noch keine Ankündigungen veröffentlicht.",
    "No quizzes are available yet.": "Es sind noch keine Quizze verfügbar.",
    "No submission yet": "Noch keine Einreichung",
    "No private messages have been sent in this conversation yet.": "In dieser Unterhaltung wurden noch keine privaten Nachrichten gesendet.",
    "No attempt submitted yet": "Noch kein Versuch eingereicht",
    "No students have submitted this quiz yet.": "Noch keine Studierenden haben dieses Quiz eingereicht.",
    "You have been signed out.": "Sie wurden abgemeldet.",
  },
  fr: {
    Dashboard: "Tableau de bord",
    "Log out": "Se déconnecter",
    Login: "Connexion",
    Email: "E-mail",
    Password: "Mot de passe",
    "Sign in": "Se connecter",
    "Admin operations center": "Centre d'administration",
    "Teacher Dashboard": "Tableau enseignant",
    "Student Dashboard": "Tableau étudiant",
    People: "Utilisateurs",
    Provisioning: "Gestion",
    Curriculum: "Programme",
    Oversight: "Supervision",
    Create: "Créer",
    Courses: "Cours",
    Updates: "Mises à jour",
    Audit: "Journal",
    Overview: "Vue d'ensemble",
    Manage: "Gérer",
    "Students & Grades": "Étudiants et notes",
    Content: "Contenu",
    Assignments: "Travaux",
    Messages: "Messages",
    Grade: "Note",
    "Create a course": "Créer un cours",
    "Create course": "Créer un cours",
    "All live courses": "Tous les cours actifs",
    "Recent course news": "Actualités récentes des cours",
    "Managed courses": "Cours gérés",
    "Your classroom spaces": "Vos espaces de cours",
    "Recent teacher updates": "Dernières mises à jour enseignants",
    "My recent actions": "Mes actions récentes",
    "My courses": "Mes cours",
    "Study spaces": "Espaces d'étude",
    Announcements: "Annonces",
    "Latest course notices": "Dernières annonces de cours",
    "Recent quiz results": "Résultats récents des quiz",
    Grades: "Notes",
    "Recorded marks": "Notes enregistrées",
    "Course grades": "Notes du cours",
    "Student activity": "Activité des étudiants",
    "Course files": "Fichiers du cours",
    "Materials and downloadable courseware": "Supports et documents téléchargeables",
    "Announcement board": "Tableau d'annonces",
    "Latest notices": "Derniers avis",
    Quizzes: "Quiz",
    "Assessments for this course": "Évaluations de ce cours",
    "Public channel": "Canal public",
    "Course discussion board": "Forum du cours",
    "Private chat": "Discussion privée",
    "Direct messages with teachers and students": "Messages privés avec enseignants et étudiants",
    "Private messages with teachers": "Messages privés avec les enseignants",
    "Submission tracking and grading": "Suivi des dépôts et notation",
    "Open assignments and my submissions": "Travaux et mes dépôts",
    "Submit coursework to cloud storage": "Déposer un travail dans le stockage cloud",
    "Create assignment": "Créer un travail",
    "Open assignment": "Ouvrir le travail",
    "Open course": "Ouvrir le cours",
    "Open quiz": "Ouvrir le quiz",
    "Open conversation": "Ouvrir la conversation",
    Edit: "Modifier",
    Delete: "Supprimer",
    Download: "Télécharger",
    "Download my submission": "Télécharger mon dépôt",
    "Save grade": "Enregistrer la note",
    Previous: "Précédent",
    Next: "Suivant",
    "Expand all": "Tout ouvrir",
    "Collapse all": "Tout réduire",
    "Post announcement": "Publier une annonce",
    "Post to course chat": "Publier dans le chat du cours",
    "Send private message": "Envoyer un message privé",
    "Send message": "Envoyer le message",
    Recipient: "Destinataire",
    Message: "Message",
    Attachment: "Pièce jointe",
    "Submission file": "Fichier à déposer",
    "Due date": "Date limite",
    Description: "Description",
    "Course title": "Titre du cours",
    "Course code": "Code du cours",
    "Study level": "Niveau d'étude",
    "Programme / major": "Programme / spécialité",
    Schedule: "Horaire",
    "Search course, code, teacher": "Rechercher un cours, code ou enseignant",
    "Search student name or email": "Rechercher un étudiant ou un e-mail",
    "Search student, email, or grade": "Rechercher étudiant, e-mail ou note",
    "Search files, titles, or uploaders": "Rechercher fichiers, titres ou auteurs",
    "Search announcements": "Rechercher des annonces",
    "Search quizzes": "Rechercher des quiz",
    "Search assignments": "Rechercher des travaux",
    "Enter your password": "Entrez votre mot de passe",
    "All programmes": "Tous les programmes",
    Undergraduate: "Licence",
    Graduate: "Master",
    "Online first": "En ligne d'abord",
    "Recently seen": "Vu récemment",
    "Least recent": "Le moins récent",
    "Newest first": "Plus récents d'abord",
    "Newest uploads": "Derniers dépôts",
    "Oldest uploads": "Dépôts les plus anciens",
    "Newest posts": "Publications les plus récentes",
    "Oldest posts": "Publications les plus anciennes",
    "Due soonest": "À rendre bientôt",
    "Due latest": "À rendre plus tard",
    "Title A-Z": "Titre A-Z",
    "Author A-Z": "Auteur A-Z",
    "Uploader A-Z": "Déposant A-Z",
    "Most attempts": "Le plus de tentatives",
    "Name A-Z": "Nom A-Z",
    "Name Z-A": "Nom Z-A",
    "All results": "Tous les résultats",
    Graded: "Noté",
    "Not graded": "Non noté",
    Online: "En ligne",
    Offline: "Hors ligne",
    Never: "Jamais",
    "No due date": "Aucune date limite",
    "Attachment only": "Pièce jointe uniquement",
    "No message preview": "Aucun aperçu",
    "Directory credentials": "Identifiants de l'annuaire",
    "Teacher and student activity": "Activité des enseignants et étudiants",
    "Create a new user": "Créer un nouvel utilisateur",
    "Bulk import and export": "Import et export en masse",
    "Recent admin and teacher actions": "Actions récentes des admins et enseignants",
    "Online now": "En ligne maintenant",
    "Course settings": "Paramètres du cours",
    Enrollment: "Inscriptions",
    "Record or update grades": "Saisir ou mettre à jour les notes",
    Teachers: "Enseignants",
    Students: "Étudiants",
    "All statuses": "Tous les statuts",
    "All roles": "Tous les rôles",
    "All levels": "Tous les niveaux",
    "Download roster template": "Télécharger le modèle de liste",
    "Download unenrollment template": "Télécharger le modèle de désinscription",
    "Download grade template": "Télécharger le modèle de notes",
    "Download import template": "Télécharger le modèle d'import",
    "Export users CSV": "Exporter les utilisateurs en CSV",
    "Import users CSV": "Importer les utilisateurs en CSV",
    "Import enrollments CSV": "Importer les inscriptions CSV",
    "Import unenrollments CSV": "Importer les désinscriptions CSV",
    "Import grades CSV": "Importer les notes CSV",
    "Latest score": "Dernier score",
    "Latest result": "Dernier résultat",
    "Not attempted yet": "Pas encore tenté",
    "Not submitted yet": "Pas encore remis",
    "Not submitted": "Non remis",
    "Not scheduled": "Non planifié",
    "No programmes configured yet.": "Aucun programme n'est encore configuré.",
    "No courses created yet.": "Aucun cours n'a encore été créé.",
    "Admin and teacher changes will appear here once people start managing the platform.":
      "Les changements effectués par les admins et enseignants apparaîtront ici dès que la plateforme sera utilisée.",
    "Announcements will appear here after teachers publish them.":
      "Les annonces apparaîtront ici une fois publiées par les enseignants.",
    "Course updates, roster changes, and grading actions will appear here.":
      "Les mises à jour du cours, changements d'effectif et actions de notation apparaîtront ici.",
    "No announcements have been posted for your courses yet.": "Aucune annonce n'a encore été publiée pour vos cours.",
    "Quiz submissions will appear here after you complete them.": "Les remises de quiz apparaîtront ici après leur complétion.",
    "No feedback yet.": "Aucun retour pour le moment.",
    "No grades have been posted yet.": "Aucune note n'a encore été publiée.",
    "No students are enrolled in this course yet.": "Aucun étudiant n'est encore inscrit à ce cours.",
    "No grade has been posted for this course yet.": "Aucune note n'a encore été publiée pour ce cours.",
    "No assignments have been posted for this course yet.": "Aucun travail n'a encore été publié pour ce cours.",
    "No public discussion messages have been posted yet.": "Aucun message n'a encore été publié dans la discussion publique.",
    "No private conversations have been started yet.": "Aucune conversation privée n'a encore commencé.",
    "No materials have been published for this course yet.": "Aucun document n'a encore été publié pour ce cours.",
    "No announcements have been posted for this course yet.": "Aucune annonce n'a encore été publiée pour ce cours.",
    "No quizzes are available yet.": "Aucun quiz n'est encore disponible.",
    "No submission yet": "Aucun dépôt pour le moment",
    "No private messages have been sent in this conversation yet.": "Aucun message privé n'a encore été envoyé dans cette conversation.",
    "No attempt submitted yet": "Aucune tentative soumise pour le moment",
    "No students have submitted this quiz yet.": "Aucun étudiant n'a encore soumis ce quiz.",
    "You have been signed out.": "Vous avez été déconnecté.",
  },
  hi: {
    Dashboard: "डैशबोर्ड",
    "Log out": "लॉग आउट",
    Login: "लॉगिन",
    Email: "ईमेल",
    Password: "पासवर्ड",
    "Sign in": "साइन इन",
    "Admin operations center": "एडमिन संचालन केंद्र",
    "Teacher Dashboard": "शिक्षक डैशबोर्ड",
    "Student Dashboard": "छात्र डैशबोर्ड",
    People: "लोग",
    Provisioning: "प्रबंधन",
    Curriculum: "पाठ्यक्रम",
    Oversight: "निगरानी",
    Create: "बनाएँ",
    Courses: "कोर्स",
    Updates: "अपडेट",
    Audit: "लॉग",
    Overview: "सारांश",
    Manage: "प्रबंधन",
    "Students & Grades": "छात्र और ग्रेड",
    Content: "सामग्री",
    Assignments: "असाइनमेंट",
    Messages: "संदेश",
    Grade: "ग्रेड",
    "Create a course": "कोर्स बनाएँ",
    "Create course": "कोर्स बनाएँ",
    "All live courses": "सभी सक्रिय कोर्स",
    "Recent course news": "हाल की कोर्स घोषणाएँ",
    "Managed courses": "प्रबंधित कोर्स",
    "Your classroom spaces": "आपके कक्षा क्षेत्र",
    "Recent teacher updates": "शिक्षक के हाल के अपडेट",
    "My recent actions": "मेरी हाल की गतिविधियाँ",
    "My courses": "मेरे कोर्स",
    "Study spaces": "अध्ययन क्षेत्र",
    Announcements: "घोषणाएँ",
    "Latest course notices": "नवीनतम कोर्स सूचनाएँ",
    "Recent quiz results": "हाल के क्विज़ परिणाम",
    Grades: "ग्रेड",
    "Recorded marks": "दर्ज अंक",
    "Course grades": "कोर्स ग्रेड",
    "Student activity": "छात्र गतिविधि",
    "Course files": "कोर्स फ़ाइलें",
    "Materials and downloadable courseware": "सामग्री और डाउनलोड करने योग्य पाठ्यसामग्री",
    "Announcement board": "घोषणा बोर्ड",
    "Latest notices": "नवीनतम सूचनाएँ",
    Quizzes: "क्विज़",
    "Assessments for this course": "इस कोर्स के आकलन",
    "Public channel": "सार्वजनिक चैनल",
    "Course discussion board": "कोर्स चर्चा बोर्ड",
    "Private chat": "निजी चैट",
    "Direct messages with teachers and students": "शिक्षकों और छात्रों के साथ निजी संदेश",
    "Private messages with teachers": "शिक्षकों के साथ निजी संदेश",
    "Submission tracking and grading": "सबमिशन ट्रैकिंग और ग्रेडिंग",
    "Open assignments and my submissions": "असाइनमेंट और मेरे सबमिशन",
    "Submit coursework to cloud storage": "कोर्सवर्क को क्लाउड स्टोरेज में जमा करें",
    "Create assignment": "असाइनमेंट बनाएँ",
    "Open assignment": "असाइनमेंट खोलें",
    "Open course": "कोर्स खोलें",
    "Open quiz": "क्विज़ खोलें",
    "Open conversation": "वार्तालाप खोलें",
    Edit: "संपादित करें",
    Delete: "हटाएँ",
    Download: "डाउनलोड",
    "Download my submission": "मेरा सबमिशन डाउनलोड करें",
    "Save grade": "ग्रेड सहेजें",
    Previous: "पिछला",
    Next: "अगला",
    "Expand all": "सब खोलें",
    "Collapse all": "सब समेटें",
    "Post announcement": "घोषणा पोस्ट करें",
    "Post to course chat": "कोर्स चैट में पोस्ट करें",
    "Send private message": "निजी संदेश भेजें",
    "Send message": "संदेश भेजें",
    Recipient: "प्राप्तकर्ता",
    Message: "संदेश",
    Attachment: "संलग्नक",
    "Submission file": "सबमिशन फ़ाइल",
    "Due date": "अंतिम तिथि",
    Description: "विवरण",
    "Course title": "कोर्स शीर्षक",
    "Course code": "कोर्स कोड",
    "Study level": "अध्ययन स्तर",
    "Programme / major": "प्रोग्राम / मेजर",
    Schedule: "समय-सारणी",
    "Search course, code, teacher": "कोर्स, कोड या शिक्षक खोजें",
    "Search student name or email": "छात्र का नाम या ईमेल खोजें",
    "Search student, email, or grade": "छात्र, ईमेल या ग्रेड खोजें",
    "Search files, titles, or uploaders": "फ़ाइल, शीर्षक या अपलोडर खोजें",
    "Search announcements": "घोषणाएँ खोजें",
    "Search quizzes": "क्विज़ खोजें",
    "Search assignments": "असाइनमेंट खोजें",
    "Enter your password": "अपना पासवर्ड दर्ज करें",
    "All programmes": "सभी प्रोग्राम",
    Undergraduate: "स्नातक",
    Graduate: "स्नातकोत्तर",
    "Online first": "पहले ऑनलाइन",
    "Recently seen": "हाल ही में देखा गया",
    "Least recent": "सबसे पुराना",
    "Newest first": "सबसे नया पहले",
    "Newest uploads": "नवीनतम अपलोड",
    "Oldest uploads": "सबसे पुराने अपलोड",
    "Newest posts": "नवीनतम पोस्ट",
    "Oldest posts": "सबसे पुरानी पोस्ट",
    "Due soonest": "सबसे पहले देय",
    "Due latest": "सबसे बाद में देय",
    "Title A-Z": "शीर्षक A-Z",
    "Author A-Z": "लेखक A-Z",
    "Uploader A-Z": "अपलोडर A-Z",
    "Most attempts": "सबसे अधिक प्रयास",
    "Name A-Z": "नाम A-Z",
    "Name Z-A": "नाम Z-A",
    "All results": "सभी परिणाम",
    Graded: "ग्रेडेड",
    "Not graded": "ग्रेड नहीं किया गया",
    Online: "ऑनलाइन",
    Offline: "ऑफ़लाइन",
    Never: "कभी नहीं",
    "No due date": "कोई अंतिम तिथि नहीं",
    "Attachment only": "केवल संलग्नक",
    "No message preview": "कोई संदेश पूर्वावलोकन नहीं",
    "Directory credentials": "डायरेक्टरी क्रेडेंशियल्स",
    "Teacher and student activity": "शिक्षक और छात्र गतिविधि",
    "Create a new user": "नया उपयोगकर्ता बनाएँ",
    "Bulk import and export": "थोक आयात और निर्यात",
    "Recent admin and teacher actions": "एडमिन और शिक्षक की हाल की गतिविधियाँ",
    "Online now": "अभी ऑनलाइन",
    "Course settings": "कोर्स सेटिंग्स",
    Enrollment: "नामांकन",
    "Record or update grades": "ग्रेड दर्ज या अपडेट करें",
    Teachers: "शिक्षक",
    Students: "छात्र",
    "All statuses": "सभी स्थितियाँ",
    "All roles": "सभी भूमिकाएँ",
    "All levels": "सभी स्तर",
    "Download roster template": "रोस्टर टेम्पलेट डाउनलोड करें",
    "Download unenrollment template": "अनएनरोलमेंट टेम्पलेट डाउनलोड करें",
    "Download grade template": "ग्रेड टेम्पलेट डाउनलोड करें",
    "Download import template": "आयात टेम्पलेट डाउनलोड करें",
    "Export users CSV": "उपयोगकर्ता CSV निर्यात करें",
    "Import users CSV": "उपयोगकर्ता CSV आयात करें",
    "Import enrollments CSV": "एनरोलमेंट CSV आयात करें",
    "Import unenrollments CSV": "अनएनरोलमेंट CSV आयात करें",
    "Import grades CSV": "ग्रेड CSV आयात करें",
    "Latest score": "नवीनतम स्कोर",
    "Latest result": "नवीनतम परिणाम",
    "Not attempted yet": "अभी तक प्रयास नहीं किया गया",
    "Not submitted yet": "अभी तक जमा नहीं किया गया",
    "Not submitted": "जमा नहीं किया गया",
    "Not scheduled": "निर्धारित नहीं",
    "No programmes configured yet.": "अभी तक कोई प्रोग्राम कॉन्फ़िगर नहीं किया गया है।",
    "No courses created yet.": "अभी तक कोई कोर्स नहीं बनाया गया है।",
    "Admin and teacher changes will appear here once people start managing the platform.":
      "जैसे ही लोग प्लेटफ़ॉर्म प्रबंधित करना शुरू करेंगे, एडमिन और शिक्षक के बदलाव यहाँ दिखाई देंगे।",
    "Announcements will appear here after teachers publish them.":
      "शिक्षकों द्वारा प्रकाशित करने के बाद घोषणाएँ यहाँ दिखाई देंगी।",
    "Course updates, roster changes, and grading actions will appear here.":
      "कोर्स अपडेट, रोस्टर परिवर्तन और ग्रेडिंग गतिविधियाँ यहाँ दिखाई देंगी।",
    "No announcements have been posted for your courses yet.": "आपके कोर्स के लिए अभी तक कोई घोषणा पोस्ट नहीं की गई है।",
    "Quiz submissions will appear here after you complete them.": "क्विज़ पूरा करने के बाद उसके सबमिशन यहाँ दिखाई देंगे।",
    "No feedback yet.": "अभी तक कोई फीडबैक नहीं।",
    "No grades have been posted yet.": "अभी तक कोई ग्रेड पोस्ट नहीं किया गया है।",
    "No students are enrolled in this course yet.": "इस कोर्स में अभी तक कोई छात्र नामांकित नहीं है।",
    "No grade has been posted for this course yet.": "इस कोर्स के लिए अभी तक कोई ग्रेड पोस्ट नहीं किया गया है।",
    "No assignments have been posted for this course yet.": "इस कोर्स के लिए अभी तक कोई असाइनमेंट पोस्ट नहीं किया गया है।",
    "No public discussion messages have been posted yet.": "अभी तक कोई सार्वजनिक चर्चा संदेश पोस्ट नहीं किया गया है।",
    "No private conversations have been started yet.": "अभी तक कोई निजी बातचीत शुरू नहीं हुई है।",
    "No materials have been published for this course yet.": "इस कोर्स के लिए अभी तक कोई सामग्री प्रकाशित नहीं की गई है।",
    "No announcements have been posted for this course yet.": "इस कोर्स के लिए अभी तक कोई घोषणा पोस्ट नहीं की गई है।",
    "No quizzes are available yet.": "अभी तक कोई क्विज़ उपलब्ध नहीं है।",
    "No submission yet": "अभी तक कोई सबमिशन नहीं",
    "No private messages have been sent in this conversation yet.": "इस वार्तालाप में अभी तक कोई निजी संदेश नहीं भेजा गया है।",
    "No attempt submitted yet": "अभी तक कोई प्रयास जमा नहीं किया गया है",
    "No students have submitted this quiz yet.": "अभी तक किसी छात्र ने यह क्विज़ जमा नहीं किया है।",
    "You have been signed out.": "आपको साइन आउट कर दिया गया है।",
  },
  ar: {
    Dashboard: "لوحة التحكم",
    "Log out": "تسجيل الخروج",
    Login: "تسجيل الدخول",
    Email: "البريد الإلكتروني",
    Password: "كلمة المرور",
    "Sign in": "دخول",
    "Admin operations center": "مركز إدارة المنصة",
    "Teacher Dashboard": "لوحة المعلم",
    "Student Dashboard": "لوحة الطالب",
    People: "الأشخاص",
    Provisioning: "الإعداد",
    Curriculum: "البرامج",
    Oversight: "المتابعة",
    Create: "إنشاء",
    Courses: "المقررات",
    Updates: "التحديثات",
    Audit: "السجل",
    Overview: "نظرة عامة",
    Manage: "إدارة",
    "Students & Grades": "الطلاب والدرجات",
    Content: "المحتوى",
    Assignments: "الواجبات",
    Messages: "الرسائل",
    Grade: "الدرجة",
    "Create a course": "إنشاء مقرر",
    "Create course": "إنشاء مقرر",
    "All live courses": "كل المقررات النشطة",
    "Recent course news": "أحدث أخبار المقررات",
    "Managed courses": "المقررات المُدارة",
    "Your classroom spaces": "مساحاتك الصفية",
    "Recent teacher updates": "آخر تحديثات المعلمين",
    "My recent actions": "آخر إجراءاتي",
    "My courses": "مقرراتي",
    "Study spaces": "مساحات الدراسة",
    Announcements: "الإعلانات",
    "Latest course notices": "أحدث إشعارات المقررات",
    "Recent quiz results": "أحدث نتائج الاختبارات القصيرة",
    Grades: "الدرجات",
    "Recorded marks": "الدرجات المسجلة",
    "Course grades": "درجات المقرر",
    "Student activity": "نشاط الطلاب",
    "Course files": "ملفات المقرر",
    "Materials and downloadable courseware": "المواد والملفات القابلة للتنزيل",
    "Announcement board": "لوحة الإعلانات",
    "Latest notices": "أحدث الإشعارات",
    Quizzes: "الاختبارات القصيرة",
    "Assessments for this course": "التقييمات الخاصة بهذا المقرر",
    "Public channel": "القناة العامة",
    "Course discussion board": "لوحة نقاش المقرر",
    "Private chat": "دردشة خاصة",
    "Direct messages with teachers and students": "رسائل مباشرة مع المعلمين والطلاب",
    "Private messages with teachers": "رسائل خاصة مع المعلمين",
    "Submission tracking and grading": "متابعة التسليم والتقييم",
    "Open assignments and my submissions": "الواجبات وملفاتي المسلمة",
    "Submit coursework to cloud storage": "رفع أعمال المقرر إلى التخزين السحابي",
    "Create assignment": "إنشاء واجب",
    "Open assignment": "فتح الواجب",
    "Open course": "فتح المقرر",
    "Open quiz": "فتح الاختبار القصير",
    "Open conversation": "فتح المحادثة",
    Edit: "تعديل",
    Delete: "حذف",
    Download: "تنزيل",
    "Download my submission": "تنزيل ملف التسليم الخاص بي",
    "Save grade": "حفظ الدرجة",
    Previous: "السابق",
    Next: "التالي",
    "Expand all": "توسيع الكل",
    "Collapse all": "طي الكل",
    "Post announcement": "نشر إعلان",
    "Post to course chat": "إرسال إلى دردشة المقرر",
    "Send private message": "إرسال رسالة خاصة",
    "Send message": "إرسال الرسالة",
    Recipient: "المستلم",
    Message: "الرسالة",
    Attachment: "مرفق",
    "Submission file": "ملف التسليم",
    "Due date": "تاريخ الاستحقاق",
    Description: "الوصف",
    "Course title": "عنوان المقرر",
    "Course code": "رمز المقرر",
    "Study level": "المرحلة الدراسية",
    "Programme / major": "البرنامج / التخصص",
    Schedule: "الموعد",
    "Search course, code, teacher": "ابحث عن مقرر أو رمز أو معلم",
    "Search student name or email": "ابحث عن اسم الطالب أو بريده الإلكتروني",
    "Search student, email, or grade": "ابحث عن طالب أو بريد إلكتروني أو درجة",
    "Search files, titles, or uploaders": "ابحث عن الملفات أو العناوين أو الرافعين",
    "Search announcements": "ابحث في الإعلانات",
    "Search quizzes": "ابحث في الاختبارات القصيرة",
    "Search assignments": "ابحث في الواجبات",
    "Enter your password": "أدخل كلمة المرور",
    "All programmes": "كل البرامج",
    Undergraduate: "بكالوريوس",
    Graduate: "دراسات عليا",
    "Online first": "المتصلون أولاً",
    "Recently seen": "شوهد مؤخراً",
    "Least recent": "الأقدم",
    "Newest first": "الأحدث أولاً",
    "Newest uploads": "أحدث الملفات المرفوعة",
    "Oldest uploads": "أقدم الملفات المرفوعة",
    "Newest posts": "أحدث المنشورات",
    "Oldest posts": "أقدم المنشورات",
    "Due soonest": "الأقرب استحقاقاً",
    "Due latest": "الأبعد استحقاقاً",
    "Title A-Z": "العنوان أ-ي",
    "Author A-Z": "الكاتب أ-ي",
    "Uploader A-Z": "الرافع أ-ي",
    "Most attempts": "الأكثر محاولات",
    "Name A-Z": "الاسم أ-ي",
    "Name Z-A": "الاسم ي-أ",
    "All results": "كل النتائج",
    Graded: "تم التقييم",
    "Not graded": "غير مُقيَّم",
    Online: "متصل",
    Offline: "غير متصل",
    Never: "أبداً",
    "No due date": "لا يوجد تاريخ استحقاق",
    "Attachment only": "مرفق فقط",
    "No message preview": "لا توجد معاينة للرسالة",
    "Directory credentials": "بيانات اعتماد الدليل",
    "Teacher and student activity": "نشاط المعلمين والطلاب",
    "Create a new user": "إنشاء مستخدم جديد",
    "Bulk import and export": "استيراد وتصدير جماعي",
    "Recent admin and teacher actions": "أحدث إجراءات المدير والمعلمين",
    "Online now": "المتصلون الآن",
    "Course settings": "إعدادات المقرر",
    Enrollment: "التسجيل",
    "Record or update grades": "إدخال الدرجات أو تحديثها",
    Teachers: "المعلمون",
    Students: "الطلاب",
    "All statuses": "كل الحالات",
    "All roles": "كل الأدوار",
    "All levels": "كل المراحل",
    "Download roster template": "تنزيل قالب القائمة",
    "Download unenrollment template": "تنزيل قالب إلغاء التسجيل",
    "Download grade template": "تنزيل قالب الدرجات",
    "Download import template": "تنزيل قالب الاستيراد",
    "Export users CSV": "تصدير المستخدمين CSV",
    "Import users CSV": "استيراد المستخدمين CSV",
    "Import enrollments CSV": "استيراد تسجيلات CSV",
    "Import unenrollments CSV": "استيراد إلغاء التسجيل CSV",
    "Import grades CSV": "استيراد الدرجات CSV",
    "Latest score": "أحدث نتيجة",
    "Latest result": "أحدث نتيجة",
    "Not attempted yet": "لم تتم المحاولة بعد",
    "Not submitted yet": "لم يتم التسليم بعد",
    "Not submitted": "غير مُسلَّم",
    "Not scheduled": "غير مجدول",
    "No programmes configured yet.": "لم يتم إعداد أي برامج بعد.",
    "No courses created yet.": "لم يتم إنشاء أي مقررات بعد.",
    "Admin and teacher changes will appear here once people start managing the platform.":
      "ستظهر هنا تغييرات المدير والمعلمين بمجرد بدء استخدام المنصة وإدارتها.",
    "Announcements will appear here after teachers publish them.":
      "ستظهر الإعلانات هنا بعد أن يقوم المعلمون بنشرها.",
    "Course updates, roster changes, and grading actions will appear here.":
      "ستظهر هنا تحديثات المقرر وتغييرات القوائم وإجراءات التقييم.",
    "No announcements have been posted for your courses yet.": "لم يتم نشر أي إعلانات لمقرراتك بعد.",
    "Quiz submissions will appear here after you complete them.": "ستظهر تسليمات الاختبارات القصيرة هنا بعد إكمالها.",
    "No feedback yet.": "لا توجد ملاحظات بعد.",
    "No grades have been posted yet.": "لم يتم نشر أي درجات بعد.",
    "No students are enrolled in this course yet.": "لا يوجد طلاب مسجلون في هذا المقرر بعد.",
    "No grade has been posted for this course yet.": "لم يتم نشر أي درجة لهذا المقرر بعد.",
    "No assignments have been posted for this course yet.": "لم يتم نشر أي واجبات لهذا المقرر بعد.",
    "No public discussion messages have been posted yet.": "لم يتم نشر أي رسائل في النقاش العام بعد.",
    "No private conversations have been started yet.": "لم تبدأ أي محادثات خاصة بعد.",
    "No materials have been published for this course yet.": "لم يتم نشر أي مواد لهذا المقرر بعد.",
    "No announcements have been posted for this course yet.": "لم يتم نشر أي إعلانات لهذا المقرر بعد.",
    "No quizzes are available yet.": "لا توجد اختبارات قصيرة متاحة بعد.",
    "No submission yet": "لا يوجد تسليم بعد",
    "No private messages have been sent in this conversation yet.": "لم يتم إرسال أي رسائل خاصة في هذه المحادثة بعد.",
    "No attempt submitted yet": "لم يتم إرسال أي محاولة بعد",
    "No students have submitted this quiz yet.": "لم يقم أي طالب بتسليم هذا الاختبار القصير بعد.",
    "You have been signed out.": "تم تسجيل خروجك.",
  },
};

const pool =
  dbConfig.host && dbConfig.password
    ? mysql.createPool(dbConfig)
    : null;

const s3Client = bucketName
  ? new S3Client({ region: awsRegion })
  : null;

const ACADEMIC_CATALOG = [
  {
    studyLevel: "undergraduate",
    programName: "Computer Science and Engineering",
    summary: "Core computing foundations with emphasis on programming, systems, algorithms, and applied AI.",
    teacher: {
      fullName: "Dr. Amelia Hart",
      email: "amelia.hart@universityhub.edu",
      password: "Teacher123!",
    },
    courses: [
      {
        code: "CSE101",
        title: "Programming Foundations",
        description: "Problem solving, Python workflows, debugging habits, and collaborative coding practice.",
      },
      {
        code: "CSE202",
        title: "Data Structures and Algorithms",
        description: "Lists, trees, graphs, complexity analysis, and algorithm design techniques.",
      },
      {
        code: "CSE240",
        title: "Computer Systems Studio",
        description: "Processes, memory, networks, and systems thinking for cloud-native applications.",
      },
      {
        code: "CSE315",
        title: "Applied Machine Learning",
        description: "Supervised learning, feature pipelines, evaluation, and model deployment case studies.",
      },
    ],
  },
  {
    studyLevel: "undergraduate",
    programName: "Computer Science, Economics, and Data Science",
    summary: "Interdisciplinary training across computation, data analysis, market behavior, and decision science.",
    teacher: {
      fullName: "Prof. Liam Carter",
      email: "liam.carter@universityhub.edu",
      password: "TeacherLiam01!",
    },
    courses: [
      {
        code: "CED110",
        title: "Data and Economic Reasoning",
        description: "Microeconomics, statistical inference, and responsible interpretation of market data.",
      },
      {
        code: "CED205",
        title: "Econometrics for Digital Platforms",
        description: "Regression, experimentation, causal inference, and product analytics workflows.",
      },
      {
        code: "CED240",
        title: "Computational Public Policy",
        description: "Policy simulation, incentives, and data-backed interventions for modern institutions.",
      },
      {
        code: "CED320",
        title: "Machine Learning for Markets",
        description: "Forecasting, recommendation logic, and decision models for digital marketplaces.",
      },
    ],
  },
  {
    studyLevel: "undergraduate",
    programName: "Management Science and Engineering",
    summary: "Operations, optimization, product strategy, and quantitative decision-making for modern organizations.",
    teacher: {
      fullName: "Dr. Maya Chen",
      email: "maya.chen@universityhub.edu",
      password: "TeacherMaya01!",
    },
    courses: [
      {
        code: "MSE120",
        title: "Decision Analytics",
        description: "Probability, optimization, dashboards, and model-driven business decisions.",
      },
      {
        code: "MSE210",
        title: "Operations Design",
        description: "Capacity planning, queueing, process design, and service operations analysis.",
      },
      {
        code: "MSE260",
        title: "Product Strategy and Experimentation",
        description: "A/B testing, roadmaps, metrics, and evidence-based product leadership.",
      },
      {
        code: "MSE330",
        title: "Supply Chain Modeling",
        description: "Network flows, inventory policy, fulfillment, and resilience planning.",
      },
    ],
  },
  {
    studyLevel: "undergraduate",
    programName: "Bioengineering",
    summary: "Quantitative biology, biomedical devices, computational methods, and translational design.",
    teacher: {
      fullName: "Dr. Sofia Alvarez",
      email: "sofia.alvarez@universityhub.edu",
      password: "TeacherSofia01!",
    },
    courses: [
      {
        code: "BIOE101",
        title: "Quantitative Physiology",
        description: "Systems-based modeling of physiological processes using engineering methods.",
      },
      {
        code: "BIOE205",
        title: "Biomaterials and Interfaces",
        description: "Material behavior, tissue response, and medical device design fundamentals.",
      },
      {
        code: "BIOE240",
        title: "Biomedical Signal Processing",
        description: "Filtering, signal interpretation, imaging, and wearable sensing applications.",
      },
      {
        code: "BIOE315",
        title: "Genomics Data Engineering",
        description: "Sequencing pipelines, biological datasets, and computational genomics workflows.",
      },
    ],
  },
  {
    studyLevel: "undergraduate",
    programName: "Urban Science and Planning with Computer Science",
    summary: "Cities, geospatial systems, civic technology, and data-driven urban planning.",
    teacher: {
      fullName: "Prof. Nora Kim",
      email: "nora.kim@universityhub.edu",
      password: "TeacherNora01!",
    },
    courses: [
      {
        code: "USP101",
        title: "Urban Data Fundamentals",
        description: "Spatial datasets, urban indicators, and evidence-based planning workflows.",
      },
      {
        code: "USP210",
        title: "Geospatial Analytics",
        description: "Mapping, remote sensing, and location intelligence for planning decisions.",
      },
      {
        code: "USP260",
        title: "Civic Technology Studio",
        description: "Digital public services, service design, and prototyping for community needs.",
      },
      {
        code: "USP320",
        title: "Mobility Systems Modeling",
        description: "Transit demand, traffic systems, and sustainability-oriented network design.",
      },
    ],
  },
  {
    studyLevel: "graduate",
    programName: "MSc in Advanced Computer Science",
    summary: "Research-facing study in algorithms, distributed systems, machine intelligence, and advanced software.",
    teacher: {
      fullName: "Dr. Arjun Mehta",
      email: "arjun.mehta@universityhub.edu",
      password: "TeacherArjun01!",
    },
    courses: [
      {
        code: "ACS601",
        title: "Advanced Algorithms",
        description: "Approximation, randomized methods, and algorithmic design for large-scale problems.",
      },
      {
        code: "ACS620",
        title: "Scalable Machine Learning",
        description: "Distributed training, model systems, evaluation, and reproducible ML workflows.",
      },
      {
        code: "ACS645",
        title: "Distributed Systems Research",
        description: "Consensus, fault tolerance, observability, and service reliability patterns.",
      },
      {
        code: "ACS690",
        title: "Computing Research Seminar",
        description: "Paper discussions, proposal writing, and graduate-level research communication.",
      },
    ],
  },
  {
    studyLevel: "graduate",
    programName: "MSc in Software and Systems Security",
    summary: "Secure software engineering, threat modeling, cloud security, and digital forensics.",
    teacher: {
      fullName: "Prof. Claire Bennett",
      email: "claire.bennett@universityhub.edu",
      password: "TeacherClaire01!",
    },
    courses: [
      {
        code: "SSS610",
        title: "Secure Software Engineering",
        description: "Security-by-design patterns, review workflows, and secure development lifecycles.",
      },
      {
        code: "SSS625",
        title: "Cloud Platform Security",
        description: "Identity, secrets, infrastructure hardening, and resilient cloud architectures.",
      },
      {
        code: "SSS650",
        title: "Applied Cryptography",
        description: "Modern encryption, signatures, key exchange, and protocol analysis.",
      },
      {
        code: "SSS680",
        title: "Forensics and Incident Response",
        description: "Threat investigation, evidence handling, post-incident learning, and reporting.",
      },
    ],
  },
  {
    studyLevel: "graduate",
    programName: "Master of Business Analytics",
    summary: "Applied analytics, optimization, experimentation, and decision intelligence for business contexts.",
    teacher: {
      fullName: "Dr. Omar Haddad",
      email: "omar.haddad@universityhub.edu",
      password: "TeacherOmar01!",
    },
    courses: [
      {
        code: "MBA601",
        title: "Applied Business Analytics",
        description: "Forecasting, segmentation, stakeholder framing, and analytics delivery for leaders.",
      },
      {
        code: "MBA620",
        title: "Optimization for Decision Systems",
        description: "Linear models, resource allocation, scenario planning, and decision support.",
      },
      {
        code: "MBA645",
        title: "Marketing and Product Analytics",
        description: "Funnels, pricing, experimentation, and growth measurement across digital channels.",
      },
      {
        code: "MBA690",
        title: "Analytics Capstone Lab",
        description: "End-to-end client-style projects using data products and presentation workflows.",
      },
    ],
  },
  {
    studyLevel: "graduate",
    programName: "MS in Management Science and Engineering",
    summary: "Graduate study in operations, policy modeling, venture systems, and strategic analytics.",
    teacher: {
      fullName: "Dr. Benjamin Zhou",
      email: "benjamin.zhou@universityhub.edu",
      password: "TeacherBen01!",
    },
    courses: [
      {
        code: "MSEG610",
        title: "Probabilistic Decision Models",
        description: "Uncertainty, Bayesian reasoning, simulation, and structured decision-making.",
      },
      {
        code: "MSEG640",
        title: "Operations and Supply Networks",
        description: "Resilient operations, supply systems, and data-driven service improvement.",
      },
      {
        code: "MSEG670",
        title: "Technology Venture Analytics",
        description: "Market sizing, platform economics, startup metrics, and venture experimentation.",
      },
      {
        code: "MSEG695",
        title: "Policy and Systems Design",
        description: "Institutional systems, incentives, and interventions grounded in quantitative evidence.",
      },
    ],
  },
  {
    studyLevel: "graduate",
    programName: "MS in Bioengineering",
    summary: "Advanced biomedical systems, computational biology, and translational engineering design.",
    teacher: {
      fullName: "Prof. Isabella Rossi",
      email: "isabella.rossi@universityhub.edu",
      password: "TeacherIsabella01!",
    },
    courses: [
      {
        code: "BIOEG620",
        title: "Translational Bioengineering",
        description: "Bench-to-bedside product development and clinical validation pathways.",
      },
      {
        code: "BIOEG640",
        title: "Computational Genomics",
        description: "Genome-scale models, biological inference, and reproducible computational pipelines.",
      },
      {
        code: "BIOEG660",
        title: "Biomedical Imaging Systems",
        description: "Image acquisition, reconstruction, analysis, and diagnostics workflows.",
      },
      {
        code: "BIOEG690",
        title: "Bioengineering Research Design",
        description: "Graduate proposal design, ethics, study design, and interdisciplinary collaboration.",
      },
    ],
  },
];

const EXTRA_PROGRAM_TEACHERS = {
  "Computer Science and Engineering": [
    { fullName: "Dr. Ethan Brooks", email: "ethan.brooks@universityhub.edu", password: "TeacherEthan01!" },
  ],
  "Computer Science, Economics, and Data Science": [
    { fullName: "Dr. Priya Nair", email: "priya.nair@universityhub.edu", password: "TeacherPriya01!" },
  ],
  "Management Science and Engineering": [
    { fullName: "Prof. Lucas Martin", email: "lucas.martin@universityhub.edu", password: "TeacherLucas01!" },
  ],
  Bioengineering: [
    { fullName: "Dr. Elena Petrova", email: "elena.petrova@universityhub.edu", password: "TeacherElena01!" },
  ],
  "Urban Science and Planning with Computer Science": [
    { fullName: "Prof. Daniel Foster", email: "daniel.foster@universityhub.edu", password: "TeacherDaniel01!" },
  ],
  "MSc in Advanced Computer Science": [
    { fullName: "Dr. Samuel Reed", email: "samuel.reed@universityhub.edu", password: "TeacherSamuel01!" },
  ],
  "MSc in Software and Systems Security": [
    { fullName: "Dr. Helena Ward", email: "helena.ward@universityhub.edu", password: "TeacherHelena01!" },
  ],
  "Master of Business Analytics": [
    { fullName: "Prof. Victor Singh", email: "victor.singh@universityhub.edu", password: "TeacherVictor01!" },
  ],
  "MS in Management Science and Engineering": [
    { fullName: "Dr. Grace Coleman", email: "grace.coleman@universityhub.edu", password: "TeacherGrace01!" },
  ],
  "MS in Bioengineering": [
    { fullName: "Dr. Marco Bellini", email: "marco.bellini@universityhub.edu", password: "TeacherMarco01!" },
  ],
};

const STUDENT_FIRST_NAMES = [
  "Ava",
  "Benjamin",
  "Chloe",
  "Daniel",
  "Ella",
  "Farah",
  "Gavin",
  "Hannah",
  "Iris",
  "Jason",
  "Keira",
  "Leo",
  "Mina",
  "Nathan",
  "Olivia",
];

const STUDENT_LAST_NAMES = [
  "Morgan",
  "Patel",
  "Nguyen",
  "Rivera",
  "Park",
  "Silva",
  "Rahman",
  "Thompson",
  "Okafor",
  "Klein",
];

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleList(items, rng = Math.random) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function studyLevelLabel(level) {
  return level === "graduate" ? "Graduate" : "Undergraduate";
}

function buildUniversityEmail(fullName, fallbackLocal = "user") {
  const localPart = String(fullName || fallbackLocal)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(dr|prof)\b/g, "")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .replace(/\.{2,}/g, ".");

  return `${localPart || fallbackLocal}@universityhub.edu`;
}

function buildStudentSeedList() {
  const rng = mulberry32(20260413);
  const programSlots = shuffleList(
    ACADEMIC_CATALOG.flatMap((program) => Array.from({ length: 15 }, () => program)),
    rng
  );
  const namePool = shuffleList(
    STUDENT_LAST_NAMES.flatMap((lastName) =>
      STUDENT_FIRST_NAMES.map((firstName) => `${firstName} ${lastName}`)
    ),
    rng
  );

  return Array.from({ length: 150 }, (_, index) => {
    const program = programSlots[index];
    if (index === 0) {
      return {
        fullName: "Mia Thompson",
        email: "mia.thompson@universityhub.edu",
        password: "Student123!",
        studyLevel: program.studyLevel,
        programName: program.programName,
        seedIndex: index,
      };
    }

    return {
      fullName: namePool[index],
      email: buildUniversityEmail(namePool[index], `student${String(index).padStart(3, "0")}`),
      legacyEmail: `student${String(index).padStart(3, "0")}@universityhub.edu`,
      password: `Student${String(index).padStart(3, "0")}!`,
      studyLevel: program.studyLevel,
      programName: program.programName,
      seedIndex: index,
    };
  });
}

function computeScheduleAt(programIndex, courseIndex) {
  const baseDate = new Date(Date.UTC(2026, 8, 14, 8, 0, 0));
  const dayOffset = programIndex * 2 + courseIndex;
  baseDate.setUTCDate(baseDate.getUTCDate() + dayOffset);
  baseDate.setUTCHours(8 + (courseIndex % 4) * 2, courseIndex % 2 ? 30 : 0, 0, 0);
  return baseDate.toISOString().slice(0, 19).replace("T", " ");
}

function pickStudentCourseCodes(studentSeed, programCourses, sameLevelCourses) {
  const rng = mulberry32(7000 + studentSeed.seedIndex);
  const desiredCourseCount = 3 + (rng() > 0.68 ? 1 : 0);
  const primaryCourses = shuffleList(programCourses, rng).slice(0, desiredCourseCount);
  const selectedCodes = new Set(primaryCourses.map((course) => course.code));

  if (rng() > 0.8) {
    const crossLevelElective = shuffleList(
      sameLevelCourses.filter(
        (course) =>
          course.programName !== studentSeed.programName && !selectedCodes.has(course.code)
      ),
      rng
    )[0];
    if (crossLevelElective) {
      selectedCodes.add(crossLevelElective.code);
    }
  }

  return [...selectedCodes];
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parseCookies(header) {
  return String(header || "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((cookies, part) => {
      const [key, ...rest] = part.split("=");
      cookies[key] = decodeURIComponent(rest.join("="));
      return cookies;
    }, {});
}

function setSessionCookie(res, token) {
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SECONDS}`
  );
}

function clearSessionCookie(res) {
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
}

function buildPasswordRecord(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}

function verifyPassword(user, password) {
  const derived = crypto.scryptSync(password, user.password_salt, 64).toString("hex");
  return crypto.timingSafeEqual(
    Buffer.from(derived, "hex"),
    Buffer.from(user.password_hash, "hex")
  );
}

function generateSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

function slugify(value) {
  return String(value || "file")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "file";
}

function toArray(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (value === undefined || value === null) {
    return [];
  }
  return [value];
}

function truncate(value, length = 140) {
  const text = String(value || "");
  return text.length > length ? `${text.slice(0, length - 1)}...` : text;
}

function normalizeDateTimeInput(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.length === 16
    ? `${trimmed.replace("T", " ")}:00`
    : trimmed.replace("T", " ");
}

function formatLocalDateTime(value, fallback = "Not scheduled") {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Berlin",
  }).format(date);
}

function formatDateTime(value) {
  return formatLocalDateTime(value, "Not scheduled");
}

function formatLastSeen(value) {
  return formatLocalDateTime(value, "Never");
}

function formatCsvDateTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const parts = {
    year: date.getFullYear(),
    month: String(date.getMonth() + 1).padStart(2, "0"),
    day: String(date.getDate()).padStart(2, "0"),
    hour: String(date.getHours()).padStart(2, "0"),
    minute: String(date.getMinutes()).padStart(2, "0"),
    second: String(date.getSeconds()).padStart(2, "0"),
  };

  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

function sortTextValue(value) {
  return String(value || "").trim().toLowerCase();
}

function sortTimestampValue(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return String(date.getTime());
}

function parseCsv(text) {
  const rows = [];
  let currentCell = "";
  let currentRow = [];
  let inQuotes = false;
  const input = String(text || "").replace(/^\uFEFF/, "");

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const nextChar = input[index + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentCell += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentCell += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      currentRow.push(currentCell);
      currentCell = "";
      continue;
    }

    if (char === "\n") {
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentCell = "";
      currentRow = [];
      continue;
    }

    if (char === "\r") {
      continue;
    }

    currentCell += char;
  }

  if (currentCell.length || currentRow.length) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  return rows;
}

function normalizeCsvHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function parseCsvObjects(text) {
  const rows = parseCsv(text).filter((row) => row.some((cell) => String(cell || "").trim()));
  if (!rows.length) {
    return [];
  }

  const headers = rows[0].map(normalizeCsvHeader);
  return rows.slice(1).map((row, index) => {
    const object = { __rowNumber: index + 2 };
    headers.forEach((header, cellIndex) => {
      if (!header) {
        return;
      }
      object[header] = String(row[cellIndex] || "").trim();
    });
    return object;
  });
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function buildCsv(rows) {
  if (!rows.length) {
    return "";
  }

  const headers = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((key) => set.add(key));
      return set;
    }, new Set())
  );

  const lines = [headers.map(csvEscape).join(",")];
  rows.forEach((row) => {
    lines.push(headers.map((header) => csvEscape(row[header] ?? "")).join(","));
  });
  return `${lines.join("\r\n")}\r\n`;
}

function sendCsvDownload(res, filename, rows) {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename=\"${filename}\"`);
  res.send(buildCsv(rows));
}

function parseQuizForm(body) {
  const title = String(body.title || "").trim();
  const description = String(body.description || "").trim();
  const dueAt = normalizeDateTimeInput(body.due_at);
  const questionTexts = toArray(body["question_text[]"] || body.question_text);
  const optionAs = toArray(body["option_a[]"] || body.option_a);
  const optionBs = toArray(body["option_b[]"] || body.option_b);
  const optionCs = toArray(body["option_c[]"] || body.option_c);
  const optionDs = toArray(body["option_d[]"] || body.option_d);
  const correctOptions = toArray(body["correct_option[]"] || body.correct_option);

  const questions = questionTexts
    .map((questionText, index) => ({
      questionText: String(questionText || "").trim(),
      optionA: String(optionAs[index] || "").trim(),
      optionB: String(optionBs[index] || "").trim(),
      optionC: String(optionCs[index] || "").trim(),
      optionD: String(optionDs[index] || "").trim(),
      correctOption: String(correctOptions[index] || "A").trim().toUpperCase(),
    }))
    .filter((question) => question.questionText);

  return { title, description, dueAt, questions };
}

function validateQuizPayload(quizPayload) {
  if (!quizPayload.title || !quizPayload.description || !quizPayload.questions.length) {
    return "Quiz title, description, and at least one question are required.";
  }

  for (const question of quizPayload.questions) {
    if (!question.optionA || !question.optionB || !question.optionC || !question.optionD) {
      return "Every quiz question needs four answer options.";
    }

    if (!["A", "B", "C", "D"].includes(question.correctOption)) {
      return "Every quiz question needs a valid correct option.";
    }
  }

  return null;
}

async function replaceQuizContents({ quizId, courseId, teacherId, title, description, dueAt, questions }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    if (quizId) {
      await connection.query("DELETE FROM quiz_attempts WHERE quiz_id = ?", [quizId]);
      await connection.query("DELETE FROM quiz_questions WHERE quiz_id = ?", [quizId]);
      await connection.query(
        `UPDATE quizzes
         SET title = ?, description = ?, due_at = ?, created_by = ?
         WHERE id = ? AND course_id = ?`,
        [title, description, dueAt, teacherId, quizId, courseId]
      );
    } else {
      const [quizResult] = await connection.query(
        `INSERT INTO quizzes
         (course_id, title, description, due_at, created_by)
         VALUES (?, ?, ?, ?, ?)`,
        [courseId, title, description, dueAt, teacherId]
      );
      quizId = quizResult.insertId;
    }

    for (const [index, question] of questions.entries()) {
      await connection.query(
        `INSERT INTO quiz_questions
         (quiz_id, position, question_text, option_a, option_b, option_c, option_d, correct_option)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          quizId,
          index + 1,
          question.questionText,
          question.optionA,
          question.optionB,
          question.optionC,
          question.optionD,
          question.correctOption,
        ]
      );
    }

    await connection.commit();
    return quizId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

function quizEditPath(courseId, quizId) {
  return `/courses/${courseId}/quizzes/${quizId}/edit`;
}

function assignmentDetailPath(assignmentId) {
  return `/assignments/${assignmentId}`;
}

function directMessagePath(courseId, recipientUserId) {
  return `/courses/${courseId}/messages/direct/${recipientUserId}`;
}

async function getEditableMaterial(user, courseId, materialId) {
  const context = await getAccessibleCourse(user, courseId);
  if (!context || !context.canManage) {
    return null;
  }

  const material = await dbOne(
    `SELECT m.*, u.full_name AS uploaded_by_name
     FROM course_materials m
     JOIN users u ON u.id = m.uploaded_by
     WHERE m.id = ? AND m.course_id = ?`,
    [materialId, context.course.id]
  );

  return material ? { context, material } : null;
}

async function getEditableAnnouncement(user, courseId, announcementId) {
  const context = await getAccessibleCourse(user, courseId);
  if (!context || !context.canManage) {
    return null;
  }

  const announcement = await dbOne(
    `SELECT a.*, u.full_name AS author_name
     FROM announcements a
     JOIN users u ON u.id = a.created_by
     WHERE a.id = ? AND a.course_id = ?`,
    [announcementId, context.course.id]
  );

  return announcement ? { context, announcement } : null;
}

async function getEditableQuiz(user, courseId, quizId) {
  const context = await getAccessibleCourse(user, courseId);
  if (!context || !context.canManage) {
    return null;
  }

  const quiz = await dbOne(
    `SELECT
       q.*,
       (SELECT COUNT(*) FROM quiz_attempts qa WHERE qa.quiz_id = q.id) AS attempt_count
     FROM quizzes q
     WHERE q.id = ? AND q.course_id = ?`,
    [quizId, context.course.id]
  );

  if (!quiz) {
    return null;
  }

  const questions = await dbQuery(
    `SELECT position, question_text, option_a, option_b, option_c, option_d, correct_option
     FROM quiz_questions
     WHERE quiz_id = ?
     ORDER BY position`,
    [quiz.id]
  );

  return { context, quiz, questions };
}

async function getAccessibleAssignment(user, assignmentId) {
  const assignment = await dbOne(
    `SELECT
       a.*,
       c.id AS course_id,
       c.title AS course_title,
       c.code AS course_code,
       c.created_by AS course_created_by
     FROM assignments a
     JOIN courses c ON c.id = a.course_id
     WHERE a.id = ?`,
    [assignmentId]
  );

  if (!assignment) {
    return null;
  }

  const context = await getAccessibleCourse(user, assignment.course_id);
  if (!context) {
    return null;
  }

  return { context, assignment };
}

async function getCourseMessageRecipients(user, context) {
  const members = await dbQuery(
    `SELECT DISTINCT u.id, u.full_name, u.email, u.role
     FROM users u
     LEFT JOIN course_memberships cm
       ON cm.user_id = u.id AND cm.course_id = ?
     WHERE (
       (cm.course_id = ? AND cm.role IN ('teacher', 'student'))
       OR u.id = ?
       OR u.id = ?
     )
     ORDER BY FIELD(u.role, 'teacher', 'student', 'admin'), u.full_name`,
    [context.course.id, context.course.id, context.course.created_by, user.id]
  );

  const uniqueMembers = Array.from(
    members.reduce((map, member) => {
      map.set(member.id, member);
      return map;
    }, new Map()).values()
  );

  if (user.role === "student") {
    return uniqueMembers.filter(
      (member) => member.id !== user.id && (member.role === "teacher" || member.role === "admin")
    );
  }

  return uniqueMembers.filter((member) => member.id !== user.id);
}

async function getAllowedDirectRecipient(user, context, recipientUserId) {
  const recipients = await getCourseMessageRecipients(user, context);
  return recipients.find((recipient) => recipient.id === recipientUserId) || null;
}

async function removeStudentFromCourse(courseId, studentId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(
      `DELETE qa
       FROM quiz_attempts qa
       JOIN quizzes q ON q.id = qa.quiz_id
       WHERE q.course_id = ? AND qa.student_id = ?`,
      [courseId, studentId]
    );
    await connection.query(
      `DELETE FROM grades
       WHERE course_id = ? AND student_id = ?`,
      [courseId, studentId]
    );
    await connection.query(
      `DELETE submission
       FROM assignment_submissions submission
       JOIN assignments assignment ON assignment.id = submission.assignment_id
       WHERE assignment.course_id = ? AND submission.student_id = ?`,
      [courseId, studentId]
    );
    const [membershipResult] = await connection.query(
      `DELETE FROM course_memberships
       WHERE course_id = ? AND user_id = ? AND role = 'student'`,
      [courseId, studentId]
    );
    await connection.commit();
    return membershipResult.affectedRows;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

function formatDateInputValue(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const parts = {
    year: date.getFullYear(),
    month: String(date.getMonth() + 1).padStart(2, "0"),
    day: String(date.getDate()).padStart(2, "0"),
    hour: String(date.getHours()).padStart(2, "0"),
    minute: String(date.getMinutes()).padStart(2, "0"),
  };

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function isOnline(user) {
  if (!user || !user.session_token || !user.last_seen_at) {
    return false;
  }
  return Date.now() - new Date(user.last_seen_at).getTime() <= ONLINE_WINDOW_MS;
}

function scoreLabel(attempt) {
  if (!attempt) {
    return "Not attempted yet";
  }
  return `${attempt.correct_answers}/${attempt.total_questions} (${Number(
    attempt.score
  ).toFixed(1)}%)`;
}

function roleLabel(role) {
  return {
    admin: "Admin",
    teacher: "Teacher",
    student: "Student",
  }[role] || "User";
}

function renderMessageBanner(query) {
  if (query.error) {
    return `<div class="message error">${escapeHtml(query.error)}</div>`;
  }
  if (query.notice) {
    return `<div class="message notice">${escapeHtml(query.notice)}</div>`;
  }
  return "";
}

function renderRolePill(role) {
  return `<span class="role-pill ${escapeHtml(role)}">${escapeHtml(roleLabel(role))}</span>`;
}

function renderStatsCards(cards) {
  return `<section class="grid stats-grid">
    ${cards
      .map(
        (card) => `<article class="panel stat-card">
          <p class="kicker">${escapeHtml(card.label)}</p>
          <h3${card.valueAttributes ? ` ${card.valueAttributes}` : ""}>${escapeHtml(card.value)}</h3>
          <p>${escapeHtml(card.detail)}</p>
        </article>`
      )
      .join("")}
  </section>`;
}

function renderCourseCards(courses, emptyMessage) {
  if (!courses.length) {
    return `<p class="empty">${escapeHtml(emptyMessage)}</p>`;
  }

  return `<section class="grid cards-grid">
    ${courses
      .map(
        (course) => `<article class="panel course-card">
          <div class="card-header">
            <div>
              <p class="kicker">${escapeHtml(course.code)}</p>
              <h3>${escapeHtml(course.title)}</h3>
            </div>
            <span class="inline-chip">${course.student_count || 0} students</span>
          </div>
          <p>${escapeHtml(truncate(course.description, 180))}</p>
          <div class="meta-list">
            ${
              course.study_level
                ? `<span>Level: ${escapeHtml(studyLevelLabel(course.study_level))}</span>`
                : ""
            }
            ${course.program_name ? `<span>Program: ${escapeHtml(course.program_name)}</span>` : ""}
            ${course.creator_name ? `<span>Teacher: ${escapeHtml(course.creator_name)}</span>` : ""}
            <span>Schedule: ${escapeHtml(formatDateTime(course.schedule_at))}</span>
            <span>Materials: ${course.material_count || 0}</span>
            <span>Quizzes: ${course.quiz_count || 0}</span>
          </div>
          <a class="button secondary" href="/courses/${course.id}">Open course</a>
        </article>`
      )
      .join("")}
  </section>`;
}

function renderFilterableCourseCards(courses, emptyMessage, scopeName) {
  if (!courses.length) {
    return `<p class="empty">${escapeHtml(emptyMessage)}</p>`;
  }

  const levelCounts = courses.reduce(
    (counts, course) => {
      if (course.study_level === "undergraduate") {
        counts.undergraduate += 1;
      } else if (course.study_level === "graduate") {
        counts.graduate += 1;
      }
      return counts;
    },
    { undergraduate: 0, graduate: 0 }
  );
  const programOptions = [...new Set(courses.map((course) => course.program_name).filter(Boolean))].sort(
    (left, right) => left.localeCompare(right)
  );

  return `<div data-course-scope="${escapeHtml(scopeName)}">
    <div class="tab-row">
      <button class="tab-button active" type="button" data-course-tab="undergraduate">
        Undergraduate (${levelCounts.undergraduate})
      </button>
      <button class="tab-button" type="button" data-course-tab="graduate">
        Graduate (${levelCounts.graduate})
      </button>
    </div>
    <div class="filter-row">
      <input type="search" placeholder="Search course, code, teacher" data-course-search />
      <select data-course-program>
        <option value="all">All programmes</option>
        ${programOptions
          .map(
            (programName) =>
              `<option value="${escapeHtml(programName)}">${escapeHtml(programName)}</option>`
          )
          .join("")}
      </select>
      <span class="filter-count" data-course-count></span>
    </div>
    <div class="cards-scroll">
      <section class="grid cards-grid">
        ${courses
          .map(
            (course) => `<article
              class="panel course-card"
              data-course-card
              data-level="${escapeHtml(course.study_level || "")}"
              data-program="${escapeHtml(course.program_name || "")}"
              data-search="${escapeHtml(
                `${course.code} ${course.title} ${course.description} ${course.program_name || ""} ${
                  course.creator_name || ""
                } ${course.study_level || ""}`.toLowerCase()
              )}">
              <div class="card-header">
                <div>
                  <p class="kicker">${escapeHtml(course.code)}</p>
                  <h3>${escapeHtml(course.title)}</h3>
                </div>
                <span class="inline-chip">${course.student_count || 0} students</span>
              </div>
              <p>${escapeHtml(truncate(course.description, 180))}</p>
              <div class="meta-list">
                ${
                  course.study_level
                    ? `<span>Level: ${escapeHtml(studyLevelLabel(course.study_level))}</span>`
                    : ""
                }
                ${course.program_name ? `<span>Program: ${escapeHtml(course.program_name)}</span>` : ""}
                ${course.creator_name ? `<span>Teacher: ${escapeHtml(course.creator_name)}</span>` : ""}
                <span>Schedule: ${escapeHtml(formatDateTime(course.schedule_at))}</span>
                <span>Materials: ${course.material_count || 0}</span>
                <span>Quizzes: ${course.quiz_count || 0}</span>
              </div>
              <a class="button secondary" href="/courses/${course.id}">Open course</a>
            </article>`
          )
          .join("")}
      </section>
    </div>
  </div>`;
}

function renderAnnouncements(announcements, emptyMessage, options = {}) {
  if (!announcements.length) {
    return `<p class="empty">${escapeHtml(emptyMessage)}</p>`;
  }

  const itemsHtml = announcements
    .map(
      (announcement) => `<article class="announcement" ${
        options.enableSearch
          ? `data-content-item data-search="${escapeHtml(
              `${announcement.title} ${announcement.content} ${announcement.author_name} ${announcement.course_title || ""}`.toLowerCase()
            )}" data-sort-title="${escapeHtml(sortTextValue(announcement.title))}" data-sort-created="${escapeHtml(
              sortTimestampValue(announcement.created_at)
            )}" data-sort-author="${escapeHtml(sortTextValue(announcement.author_name))}"`
          : ""
      }>
        <div class="announcement-header">
          <div>
            <h4>${escapeHtml(announcement.title)}</h4>
            <p class="helper">${escapeHtml(
              `${announcement.course_title ? `${announcement.course_title} · ` : ""}${announcement.author_name} · ${formatDateTime(
                announcement.created_at
              )}`
            )}</p>
          </div>
        </div>
        <p>${escapeHtml(announcement.content)}</p>
        ${
          options.canManage && options.courseId
            ? `<div class="actions-row">
                <a class="button secondary" href="/courses/${options.courseId}/announcements/${announcement.id}/edit">Edit</a>
                <form class="inline-form" method="post" action="/courses/${options.courseId}/announcements/${announcement.id}/delete" onsubmit="return confirm('Delete this announcement?');">
                  <button class="button danger" type="submit">Delete</button>
                </form>
              </div>`
            : ""
        }
      </article>`
    )
    .join("");

  if (!options.enableSearch) {
    return itemsHtml;
  }

  return `<div data-content-scope="${escapeHtml(options.scopeName || "announcements")}" data-content-page-size="${
    options.pageSize || 5
  }">
    <div class="filter-row">
      <input type="search" placeholder="Search announcements" data-content-search />
      <select data-content-sort>
        <option value="newest">Newest posts</option>
        <option value="oldest">Oldest posts</option>
        <option value="title-asc">Title A-Z</option>
        <option value="author-asc">Author A-Z</option>
      </select>
      <span class="filter-count" data-content-count></span>
    </div>
    <div class="stack" data-content-list>
      ${itemsHtml}
    </div>
    <div class="pagination-row">
      <button class="button secondary" type="button" data-content-page-prev>Previous</button>
      <div class="pagination-group" data-content-page-numbers></div>
      <span class="pagination-label" data-content-page-label></span>
      <button class="button secondary" type="button" data-content-page-next>Next</button>
    </div>
  </div>`;
}

function renderMaterials(materials, emptyMessage, options = {}) {
  if (!materials.length) {
    return `<p class="empty">${escapeHtml(emptyMessage)}</p>`;
  }

  const tableHtml = `<div class="table-wrap${options.enableSearch ? " scroll-panel" : ""}">
    <table>
      <thead>
        <tr>
          <th>Title</th>
          <th>Original file</th>
          <th>Uploaded by</th>
          <th>Uploaded</th>
          <th></th>
        </tr>
      </thead>
      <tbody${options.enableSearch ? ' data-content-list' : ""}>
        ${materials
          .map(
            (material) => `<tr ${
              options.enableSearch
                ? `data-content-item data-search="${escapeHtml(
                    `${material.title} ${material.file_name} ${material.uploaded_by_name}`.toLowerCase()
                  )}" data-sort-title="${escapeHtml(sortTextValue(material.title))}" data-sort-created="${escapeHtml(
                    sortTimestampValue(material.created_at)
                  )}" data-sort-uploader="${escapeHtml(sortTextValue(material.uploaded_by_name))}"`
                : ""
            }>
              <td>${escapeHtml(material.title)}</td>
              <td>${escapeHtml(material.file_name)}</td>
              <td>${escapeHtml(material.uploaded_by_name)}</td>
              <td>${escapeHtml(formatDateTime(material.created_at))}</td>
              <td>
                <div class="actions-row">
                  <a href="/materials/${material.id}/download">Download</a>
                  ${
                    options.canManage && options.courseId
                      ? `<a class="button secondary" href="/courses/${options.courseId}/materials/${material.id}/edit">Edit</a>
                         <form class="inline-form" method="post" action="/courses/${options.courseId}/materials/${material.id}/delete" onsubmit="return confirm('Delete this file?');">
                           <button class="button danger" type="submit">Delete</button>
                         </form>`
                      : ""
                  }
                </div>
              </td>
            </tr>`
          )
          .join("")}
      </tbody>
    </table>
  </div>`;

  if (!options.enableSearch) {
    return tableHtml;
  }

  return `<div data-content-scope="${escapeHtml(options.scopeName || "materials")}" data-content-page-size="${
    options.pageSize || 8
  }">
    <div class="filter-row">
      <input type="search" placeholder="Search files, titles, or uploaders" data-content-search />
      <select data-content-sort>
        <option value="newest">Newest uploads</option>
        <option value="oldest">Oldest uploads</option>
        <option value="title-asc">Title A-Z</option>
        <option value="uploader-asc">Uploader A-Z</option>
      </select>
      <span class="filter-count" data-content-count></span>
    </div>
    ${tableHtml}
    <div class="pagination-row">
      <button class="button secondary" type="button" data-content-page-prev>Previous</button>
      <div class="pagination-group" data-content-page-numbers></div>
      <span class="pagination-label" data-content-page-label></span>
      <button class="button secondary" type="button" data-content-page-next>Next</button>
    </div>
  </div>`;
}

function renderQuizCards(quizzes, attemptMap, emptyMessage, options = {}) {
  if (!quizzes.length) {
    return `<p class="empty">${escapeHtml(emptyMessage)}</p>`;
  }

  const cardsHtml = `<section class="stack" data-content-list>
    ${quizzes
      .map((quiz) => {
        const attempt = attemptMap.get(quiz.id);
        const footer = attempt
          ? `Latest score: ${scoreLabel(attempt)} · ${formatDateTime(attempt.submitted_at)}`
          : `Questions: ${quiz.question_count}`;
        return `<article class="panel compact-panel" ${
          options.enableSearch
            ? `data-content-item data-search="${escapeHtml(
                `${quiz.title} ${quiz.description} ${quiz.course_code || ""} ${footer}`.toLowerCase()
              )}" data-sort-title="${escapeHtml(sortTextValue(quiz.title))}" data-sort-created="${escapeHtml(
                sortTimestampValue(quiz.created_at)
              )}" data-sort-due="${escapeHtml(sortTimestampValue(quiz.due_at))}" data-sort-attempts="${escapeHtml(
                String(Number(quiz.attempt_count || 0))
              )}"`
            : ""
        }>
          <div class="card-header">
            <div>
              <p class="kicker">${escapeHtml(quiz.course_code || "")}</p>
              <h3>${escapeHtml(quiz.title)}</h3>
            </div>
            <span class="inline-chip">${quiz.question_count} questions</span>
          </div>
          <p>${escapeHtml(quiz.description)}</p>
          <div class="meta-list">
            <span>Due: ${escapeHtml(formatDateTime(quiz.due_at))}</span>
            <span>${escapeHtml(footer)}</span>
          </div>
          <div class="actions-row">
            <a class="button secondary" href="/quizzes/${quiz.id}">Open quiz</a>
            ${
              options.canManage && options.courseId
                ? `<a class="button secondary" href="${quizEditPath(options.courseId, quiz.id)}">Edit quiz</a>
                   <form class="inline-form" method="post" action="/courses/${options.courseId}/quizzes/${quiz.id}/delete" onsubmit="return confirm('Delete this quiz?');">
                     <button class="button danger" type="submit">Delete</button>
                   </form>`
                : ""
            }
          </div>
        </article>`;
      })
      .join("")}
  </section>`;

  if (!options.enableSearch) {
    return cardsHtml;
  }

  return `<div data-content-scope="${escapeHtml(options.scopeName || "quizzes")}" data-content-page-size="${
    options.pageSize || 5
  }">
    <div class="filter-row">
      <input type="search" placeholder="Search quizzes" data-content-search />
      <select data-content-sort>
        <option value="newest">Newest first</option>
        <option value="due-soonest">Due soonest</option>
        <option value="due-latest">Due latest</option>
        <option value="title-asc">Title A-Z</option>
        <option value="attempts-most">Most attempts</option>
      </select>
      <span class="filter-count" data-content-count></span>
    </div>
    ${cardsHtml}
    <div class="pagination-row">
      <button class="button secondary" type="button" data-content-page-prev>Previous</button>
      <div class="pagination-group" data-content-page-numbers></div>
      <span class="pagination-label" data-content-page-label></span>
      <button class="button secondary" type="button" data-content-page-next>Next</button>
    </div>
  </div>`;
}

function renderAssignmentCards(assignments, emptyMessage, options = {}) {
  if (!assignments.length) {
    return `<p class="empty">${escapeHtml(emptyMessage)}</p>`;
  }

  const cardsHtml = `<section class="stack" data-content-list>
    ${assignments
      .map((assignment) => {
        const dueLabel = assignment.due_at ? formatDateTime(assignment.due_at) : "No due date";
        const studentStatus = assignment.submitted_at
          ? `Submitted ${formatDateTime(assignment.submitted_at)}`
          : "Not submitted yet";
        const footer = options.canManage
          ? `${Number(assignment.submission_count || 0)} of ${Number(assignment.student_count || 0)} students submitted`
          : assignment.grade_value
            ? `Grade: ${assignment.grade_value}`
            : studentStatus;
        return `<article class="panel compact-panel" ${
          options.enableSearch
            ? `data-content-item data-search="${escapeHtml(
                `${assignment.title} ${assignment.description} ${assignment.course_code || ""} ${footer}`.toLowerCase()
              )}" data-sort-title="${escapeHtml(sortTextValue(assignment.title))}" data-sort-created="${escapeHtml(
                sortTimestampValue(assignment.created_at)
              )}" data-sort-due="${escapeHtml(sortTimestampValue(assignment.due_at))}"`
            : ""
        }>
          <div class="card-header">
            <div>
              <p class="kicker">${escapeHtml(assignment.course_code || "Assignment")}</p>
              <h3>${escapeHtml(assignment.title)}</h3>
            </div>
            <span class="inline-chip">${escapeHtml(options.canManage ? footer : studentStatus)}</span>
          </div>
          <p>${escapeHtml(truncate(assignment.description, 220))}</p>
          <div class="meta-list">
            <span>Due: ${escapeHtml(dueLabel)}</span>
            <span>${escapeHtml(footer)}</span>
          </div>
          <div class="actions-row">
            <a class="button secondary" href="${assignmentDetailPath(assignment.id)}">Open assignment</a>
            ${
              !options.canManage && assignment.submission_id
                ? `<a class="button secondary" href="/submissions/${assignment.submission_id}/download">Download my submission</a>`
                : ""
            }
          </div>
        </article>`;
      })
      .join("")}
  </section>`;

  if (!options.enableSearch) {
    return cardsHtml;
  }

  return `<div data-content-scope="${escapeHtml(options.scopeName || "assignments")}" data-content-page-size="${
    options.pageSize || 5
  }">
    <div class="filter-row">
      <input type="search" placeholder="Search assignments" data-content-search />
      <select data-content-sort>
        <option value="newest">Newest first</option>
        <option value="due-soonest">Due soonest</option>
        <option value="due-latest">Due latest</option>
        <option value="title-asc">Title A-Z</option>
      </select>
      <span class="filter-count" data-content-count></span>
    </div>
    ${cardsHtml}
    <div class="pagination-row">
      <button class="button secondary" type="button" data-content-page-prev>Previous</button>
      <div class="pagination-group" data-content-page-numbers></div>
      <span class="pagination-label" data-content-page-label></span>
      <button class="button secondary" type="button" data-content-page-next>Next</button>
    </div>
  </div>`;
}

function summarizeDirectMessageThreads(messages, currentUserId) {
  const summaries = new Map();

  for (const message of messages) {
    const senderId = Number(message.sender_user_id);
    const recipientId = Number(message.recipient_user_id);
    const counterpartId = senderId === currentUserId ? recipientId : senderId;
    if (!counterpartId || summaries.has(counterpartId)) {
      continue;
    }

    const counterpartName = senderId === currentUserId ? message.recipient_name : message.sender_name;
    const counterpartEmail = senderId === currentUserId ? message.recipient_email : message.sender_email;
    const counterpartRole = senderId === currentUserId ? message.recipient_role : message.sender_role;

    summaries.set(counterpartId, {
      counterpartId,
      counterpartName,
      counterpartEmail,
      counterpartRole,
      createdAt: message.created_at,
      preview:
        normalizeMessageBody(message.body) ||
        (message.attachment_file_name ? `Attachment: ${message.attachment_file_name}` : "No message preview"),
    });
  }

  return Array.from(summaries.values()).sort((left, right) => {
    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });
}

function renderMessageFeed(messages, emptyMessage, options = {}) {
  if (!messages.length) {
    return `<p class="empty">${escapeHtml(emptyMessage)}</p>`;
  }

  return `<div class="stack${options.scroll ? " scroll-panel" : ""}">
    ${messages
      .map((message) => `<article class="announcement">
        <div class="announcement-header">
          <div>
            <h4>${escapeHtml(message.sender_name || message.counterpartName || "Message")}</h4>
            <p class="helper">${escapeHtml(formatDateTime(message.created_at || message.createdAt))}</p>
          </div>
          ${
            message.recipient_name && options.showRecipient
              ? `<span class="inline-chip">${escapeHtml(`To ${message.recipient_name}`)}</span>`
              : ""
          }
        </div>
        ${
          normalizeMessageBody(message.body)
            ? `<p>${escapeHtml(message.body)}</p>`
            : `<p class="empty">Attachment only</p>`
        }
        ${
          message.attachment_file_name
            ? `<div class="actions-row">
                <a class="button secondary" href="/messages/${message.id}/download">Download ${escapeHtml(
                  message.attachment_file_name
                )}</a>
              </div>`
            : ""
        }
      </article>`)
      .join("")}
  </div>`;
}

function renderDirectConversationCards(conversations, emptyMessage, courseId) {
  if (!conversations.length) {
    return `<p class="empty">${escapeHtml(emptyMessage)}</p>`;
  }

  return `<section class="stack">
    ${conversations
      .map(
        (conversation) => `<article class="panel compact-panel">
          <div class="card-header">
            <div>
              <p class="kicker">${escapeHtml(roleLabel(conversation.counterpartRole || "teacher"))}</p>
              <h3>${escapeHtml(conversation.counterpartName)}</h3>
            </div>
            <span class="inline-chip">${escapeHtml(formatDateTime(conversation.createdAt))}</span>
          </div>
          <p>${escapeHtml(truncate(conversation.preview, 180))}</p>
          <div class="meta-list">
            <span>${escapeHtml(conversation.counterpartEmail)}</span>
          </div>
          <a class="button secondary" href="${directMessagePath(courseId, conversation.counterpartId)}">Open conversation</a>
        </article>`
      )
      .join("")}
  </section>`;
}

function renderOperationLogs(logs, emptyMessage) {
  if (!logs.length) {
    return `<p class="empty">${escapeHtml(emptyMessage)}</p>`;
  }

  return `<div class="table-wrap scroll-panel">
    <table>
      <thead>
        <tr>
          <th>When</th>
          <th>Actor</th>
          <th>Course</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        ${logs
          .map(
            (log) => `<tr>
              <td>${escapeHtml(formatDateTime(log.created_at))}</td>
              <td>
                <strong>${escapeHtml(log.actor_name)}</strong>
                <div class="helper">${escapeHtml(log.actor_email)} · ${escapeHtml(roleLabel(log.actor_role))}</div>
              </td>
              <td>${escapeHtml(
                log.course_code
                  ? `${log.course_code} · ${log.course_title || "Course"}`
                  : "Platform"
              )}</td>
              <td>
                <strong>${escapeHtml(log.summary)}</strong>
                ${
                  log.target_label
                    ? `<div class="helper">${escapeHtml(`${log.target_type}: ${log.target_label}`)}</div>`
                    : ""
                }
              </td>
            </tr>`
          )
          .join("")}
      </tbody>
    </table>
  </div>`;
}

function renderPageMenu(scopeName, defaultTab, items) {
  return `<nav class="page-menu-shell">
    <div class="page-menu" data-page-menu="${escapeHtml(scopeName)}" data-default-tab="${escapeHtml(
      defaultTab
    )}">
      ${items
        .map(
          (item) => `<button class="page-menu-button" type="button" data-page-tab="${escapeHtml(
            item.id
          )}">
            ${escapeHtml(item.label)}
          </button>`
        )
        .join("")}
    </div>
  </nav>`;
}

function renderLanguageBar() {
  return `<div class="language-bar" data-i18n-skip>
    ${UI_LANGUAGE_OPTIONS.map(
      (option) => `<button
        class="language-button"
        type="button"
        data-locale="${escapeHtml(option.code)}"
        aria-label="${escapeHtml(option.label)}"
        title="${escapeHtml(option.label)}">
        <span class="flag">${option.flag}</span>
        <span>${escapeHtml(option.shortLabel)}</span>
      </button>`
    ).join("")}
  </div>`;
}

function renderPagePanel(scopeName, panelId, content, isDefault = false) {
  return `<section class="page-panel-stack" data-page-panel-scope="${escapeHtml(
    scopeName
  )}" data-page-panel="${escapeHtml(panelId)}"${isDefault ? "" : " hidden"}>
    ${content}
  </section>`;
}

function renderProgramCards(programs) {
  if (!programs.length) {
    return `<p class="empty">No programmes configured yet.</p>`;
  }

  return `<section class="grid cards-grid">
    ${programs
      .map(
        (program) => `<article class="panel compact-panel">
          <p class="kicker">${escapeHtml(studyLevelLabel(program.studyLevel))}</p>
          <h3>${escapeHtml(program.programName)}</h3>
          <p>${escapeHtml(program.summary)}</p>
          <div class="meta-list">
            <span>Lead teacher: ${escapeHtml(program.teacher.fullName)}</span>
            <span>${program.courses.length} courses</span>
          </div>
          <div class="stack">
            ${program.courses
              .map(
                (course) => `<div class="catalog-entry">
                  <strong>${escapeHtml(`${course.code} · ${course.title}`)}</strong>
                  <p>${escapeHtml(course.description)}</p>
                  <span class="helper">${escapeHtml(program.teacher.fullName)}</span>
                </div>`
              )
              .join("")}
          </div>
        </article>`
      )
      .join("")}
  </section>`;
}

function renderDashboardScripts() {
  return `<script>
    (function () {
      function setupTableFilters(scope) {
        const searchInput = scope.querySelector('[data-filter-search]');
        const statusSelect = scope.querySelector('[data-filter-status]');
        const countNode = scope.querySelector('[data-filter-count]');
        const prevButton = scope.querySelector('[data-page-prev]');
        const nextButton = scope.querySelector('[data-page-next]');
        const pageLabel = scope.querySelector('[data-page-label]');
        const pageNumbers = scope.querySelector('[data-page-numbers]');
        const rows = Array.from(scope.querySelectorAll('tbody tr'));
        const pageSize = 12;

        function applyFilters() {
          const activeRole = scope.getAttribute('data-active-role') || '';
          const searchValue = (searchInput ? searchInput.value : '').trim().toLowerCase();
          const statusValue = statusSelect ? statusSelect.value : 'all';
          const matchingRows = [];

          rows.forEach(function (row) {
            const rowSearch = row.getAttribute('data-search') || '';
            const rowRole = row.getAttribute('data-role') || '';
            const rowStatus = row.getAttribute('data-status') || '';
            const matchesRole = !activeRole || rowRole === activeRole;
            const matchesStatus = statusValue === 'all' || rowStatus === statusValue;
            const matchesSearch = !searchValue || rowSearch.indexOf(searchValue) !== -1;
            if (matchesSearch && matchesRole && matchesStatus) {
              matchingRows.push(row);
            }
          });

          const totalCount = matchingRows.length;
          const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
          const currentPage = Math.min(
            Number(scope.getAttribute('data-page') || 1),
            totalPages
          );
          scope.setAttribute('data-page', String(currentPage));

          rows.forEach(function (row) {
            row.hidden = true;
          });

          const startIndex = (currentPage - 1) * pageSize;
          const endIndex = startIndex + pageSize;
          matchingRows.slice(startIndex, endIndex).forEach(function (row) {
            row.hidden = false;
          });

          if (countNode) {
            countNode.textContent = 'Showing ' + totalCount + ' matches';
          }
          if (pageLabel) {
            pageLabel.textContent =
              totalCount === 0
                ? 'Page 0 of 0'
                : 'Page ' + currentPage + ' of ' + totalPages;
          }
          if (pageNumbers) {
            pageNumbers.innerHTML = '';
            if (totalCount > 0) {
              for (let pageIndex = 1; pageIndex <= totalPages; pageIndex += 1) {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'page-number-button' + (pageIndex === currentPage ? ' active' : '');
                button.textContent = String(pageIndex);
                button.addEventListener('click', function () {
                  scope.setAttribute('data-page', String(pageIndex));
                  applyFilters();
                });
                pageNumbers.appendChild(button);
              }
            }
          }
          if (prevButton) {
            prevButton.disabled = currentPage <= 1;
          }
          if (nextButton) {
            nextButton.disabled = currentPage >= totalPages;
          }
          if (typeof window.__applyUiLocale === "function") {
            window.__applyUiLocale(scope);
          }
        }

        if (searchInput) {
          searchInput.addEventListener('input', function () {
            scope.setAttribute('data-page', '1');
            applyFilters();
          });
        }
        if (statusSelect) {
          statusSelect.addEventListener('change', function () {
            scope.setAttribute('data-page', '1');
            applyFilters();
          });
        }
        if (prevButton) {
          prevButton.addEventListener('click', function () {
            const nextPage = Math.max(1, Number(scope.getAttribute('data-page') || 1) - 1);
            scope.setAttribute('data-page', String(nextPage));
            applyFilters();
          });
        }
        if (nextButton) {
          nextButton.addEventListener('click', function () {
            const nextPage = Number(scope.getAttribute('data-page') || 1) + 1;
            scope.setAttribute('data-page', String(nextPage));
            applyFilters();
          });
        }
        scope.__applyFilters = applyFilters;
        scope.setAttribute('data-page', '1');
        applyFilters();
      }

      function setupDirectoryTabs() {
        const tabScopes = Array.from(document.querySelectorAll('[data-tab-scope="directory"]'));
        if (!tabScopes.length) return;

        const buttons = tabScopes.flatMap(function (scope) {
          return Array.from(scope.querySelectorAll('[data-directory-tab]'));
        });
        const linkedScopes = Array.from(document.querySelectorAll('[data-linked-tab-scope="directory"]'));

        function setActiveRole(role) {
          buttons.forEach(function (button) {
            button.classList.toggle('active', button.getAttribute('data-directory-tab') === role);
          });

          linkedScopes.forEach(function (scope) {
            scope.setAttribute('data-active-role', role);
            if (typeof scope.__applyFilters === 'function') {
              scope.__applyFilters();
            }
          });
        }

        buttons.forEach(function (button) {
          button.addEventListener('click', function () {
            setActiveRole(button.getAttribute('data-directory-tab'));
          });
        });

        setActiveRole('teacher');
      }

      function setupCourseFilters(scope) {
        const searchInput = scope.querySelector('[data-course-search]');
        const programSelect = scope.querySelector('[data-course-program]');
        const tabButtons = Array.from(scope.querySelectorAll('[data-course-tab]'));
        const countNode = scope.querySelector('[data-course-count]');
        const cards = Array.from(scope.querySelectorAll('[data-course-card]'));

        function applyFilters() {
          const activeLevel = scope.getAttribute('data-active-level') || '';
          const searchValue = (searchInput ? searchInput.value : '').trim().toLowerCase();
          const programValue = programSelect ? programSelect.value : 'all';
          let visibleCount = 0;
          let availableCount = 0;

          cards.forEach(function (card) {
            const cardSearch = card.getAttribute('data-search') || '';
            const cardLevel = card.getAttribute('data-level') || '';
            const cardProgram = card.getAttribute('data-program') || '';
            const matchesSearch = !searchValue || cardSearch.indexOf(searchValue) !== -1;
            const matchesLevel = !activeLevel || cardLevel === activeLevel;
            const matchesProgram = programValue === 'all' || cardProgram === programValue;
            if (matchesLevel && matchesProgram) {
              availableCount += 1;
            }
            const visible = matchesSearch && matchesLevel && matchesProgram;

            card.hidden = !visible;
            if (visible) visibleCount += 1;
          });

          if (countNode) {
            countNode.textContent = 'Showing ' + visibleCount + ' of ' + availableCount;
          }
          if (typeof window.__applyUiLocale === "function") {
            window.__applyUiLocale(scope);
          }
        }

        if (searchInput) searchInput.addEventListener('input', applyFilters);
        if (programSelect) programSelect.addEventListener('change', applyFilters);
        tabButtons.forEach(function (button) {
          button.addEventListener('click', function () {
            const level = button.getAttribute('data-course-tab') || '';
            scope.setAttribute('data-active-level', level);
            tabButtons.forEach(function (candidate) {
              candidate.classList.toggle('active', candidate === button);
            });
            applyFilters();
          });
        });

        const availableLevels = new Set(
          cards.map(function (card) {
            return card.getAttribute('data-level') || '';
          })
        );
        const defaultLevel = availableLevels.has('undergraduate')
          ? 'undergraduate'
          : availableLevels.has('graduate')
            ? 'graduate'
            : '';
        scope.setAttribute('data-active-level', defaultLevel);
        tabButtons.forEach(function (button) {
          button.classList.toggle('active', button.getAttribute('data-course-tab') === defaultLevel);
        });
        applyFilters();
      }

      function browserLocaleCode() {
        const value = String(
          window.__uiLocale ||
            document.documentElement.getAttribute('data-ui-locale') ||
            document.documentElement.lang ||
            'en'
        ).toLowerCase();
        if (value.startsWith('zh')) return 'zh-CN';
        if (value.startsWith('de')) return 'de-DE';
        if (value.startsWith('fr')) return 'fr-FR';
        if (value.startsWith('hi')) return 'hi-IN';
        if (value.startsWith('ar')) return 'ar-SA';
        return 'en-GB';
      }

      function formatBrowserDateTime(value, fallback) {
        if (!value) return fallback;
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return fallback;
        return new Intl.DateTimeFormat(browserLocaleCode(), {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'Europe/Berlin',
        }).format(date);
      }

      function setupAdminActivityAutoRefresh() {
        const scope = document.querySelector('[data-live-admin-activity]');
        if (!scope) return;

        const endpoint = scope.getAttribute('data-live-endpoint');
        const onlineCountNode = document.querySelector('[data-live-online-count]');
        if (!endpoint) return;

        async function refreshActivity() {
          try {
            const response = await fetch(endpoint, {
              headers: { Accept: 'application/json' },
              credentials: 'same-origin',
            });
            if (!response.ok) return;

            const payload = await response.json();
            const usersById = new Map((payload.users || []).map(function (user) {
              return [String(user.id), user];
            }));

            Array.from(scope.querySelectorAll('tbody tr[data-user-id]')).forEach(function (row) {
              const user = usersById.get(row.getAttribute('data-user-id'));
              if (!user) return;

              const status = user.is_online ? 'online' : 'offline';
              row.setAttribute('data-status', status);
              row.setAttribute(
                'data-search',
                ((row.getAttribute('data-base-search') || '') + ' ' + status).trim()
              );

              const badge = row.querySelector('[data-live-status]');
              if (badge) {
                badge.className = 'status-badge ' + status;
                badge.textContent = status === 'online' ? 'Online' : 'Offline';
              }

              const lastSeen = row.querySelector('[data-live-last-seen]');
              if (lastSeen) {
                lastSeen.textContent = formatBrowserDateTime(user.last_seen_at, 'Never');
              }
            });

            if (onlineCountNode && typeof payload.online_count === 'number') {
              onlineCountNode.textContent = String(payload.online_count);
            }

            if (typeof scope.__applyFilters === 'function') {
              scope.__applyFilters();
            }
            if (typeof window.__applyUiLocale === "function") {
              window.__applyUiLocale(scope.parentElement || document.body);
            }
          } catch (error) {
          }
        }

        refreshActivity();
        window.setInterval(refreshActivity, 20000);
      }

      Array.from(document.querySelectorAll('[data-filter-scope]')).forEach(setupTableFilters);
      Array.from(document.querySelectorAll('[data-course-scope]')).forEach(setupCourseFilters);
      setupDirectoryTabs();
      setupAdminActivityAutoRefresh();
    })();
  </script>`;
}

function renderPage({
  title,
  user,
  headline,
  subhead,
  content,
  query = {},
  extraScripts = "",
  headlineNoWrap = false,
}) {
  const authActions = user
    ? `<nav class="nav-actions">
        <a class="nav-link" href="/dashboard">Dashboard</a>
        <form method="post" action="/logout">
          <button class="nav-link button-link" type="submit">Log out</button>
        </form>
      </nav>`
    : "";
  const topbarControls = `<div class="topbar-controls">
    ${renderLanguageBar()}
    ${authActions}
  </div>`;

  const roleBlock = user
    ? `<div class="hero-meta">
        ${renderRolePill(user.role)}
        <span>${escapeHtml(user.full_name)}</span>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <style>
      :root {
        color-scheme: light;
        --bg-1: #f6efe3;
        --bg-2: #eef7f2;
        --surface: rgba(255, 255, 255, 0.84);
        --surface-strong: #ffffff;
        --text: #1b2630;
        --muted: #556370;
        --primary: #0f766e;
        --primary-dark: #0f5f59;
        --secondary: #c26d13;
        --border: rgba(15, 118, 110, 0.16);
        --danger: #b42318;
        --success: #027a48;
        --shadow: 0 24px 48px rgba(28, 43, 77, 0.12);
        --shadow-soft: 0 16px 32px rgba(28, 43, 77, 0.08);
        --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
      }

      html {
        scroll-behavior: smooth;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: "Avenir Next", "Segoe UI", sans-serif;
        color: var(--text);
        background:
          radial-gradient(circle at top left, rgba(15, 118, 110, 0.18), transparent 24%),
          radial-gradient(circle at top right, rgba(180, 83, 9, 0.16), transparent 18%),
          linear-gradient(135deg, var(--bg-1), var(--bg-2) 52%, #f9f6ef);
        min-height: 100vh;
        overflow-x: hidden;
        position: relative;
      }

      html[dir="rtl"] body {
        direction: rtl;
      }

      html[dir="rtl"] input,
      html[dir="rtl"] textarea,
      html[dir="rtl"] select {
        text-align: right;
      }

      html[dir="rtl"] .mono {
        direction: ltr;
        unicode-bidi: plaintext;
      }

      body::before,
      body::after {
        content: "";
        position: fixed;
        width: 360px;
        height: 360px;
        border-radius: 999px;
        filter: blur(20px);
        pointer-events: none;
        z-index: 0;
        opacity: 0.55;
        animation: drift 18s ease-in-out infinite alternate;
      }

      body::before {
        top: -120px;
        right: -80px;
        background: radial-gradient(circle, rgba(15, 118, 110, 0.14), transparent 68%);
      }

      body::after {
        left: -120px;
        bottom: -140px;
        background: radial-gradient(circle, rgba(194, 109, 19, 0.12), transparent 68%);
        animation-duration: 22s;
      }

      a {
        color: var(--primary-dark);
        text-decoration: none;
        transition: color 180ms var(--ease-out);
      }

      a:hover {
        text-decoration: underline;
      }

      button,
      .button {
        border: none;
        border-radius: 999px;
        padding: 12px 18px;
        background: linear-gradient(135deg, var(--primary), #155e75);
        color: white;
        cursor: pointer;
        font-weight: 700;
        text-decoration: none;
        transition:
          transform 180ms var(--ease-out),
          box-shadow 180ms var(--ease-out),
          background 180ms var(--ease-out),
          border-color 180ms var(--ease-out),
          color 180ms var(--ease-out);
        box-shadow: 0 14px 24px rgba(15, 118, 110, 0.16);
      }

      button:hover,
      .button:hover {
        transform: translateY(-2px);
        box-shadow: 0 18px 30px rgba(15, 118, 110, 0.22);
      }

      button:active,
      .button:active {
        transform: translateY(0);
      }

      .button.secondary,
      .nav-link {
        background: transparent;
        color: var(--primary-dark);
        border: 1px solid rgba(15, 118, 110, 0.2);
      }

      .button.danger {
        background: linear-gradient(135deg, var(--danger), #7a1c13);
      }

      .button-link {
        font: inherit;
      }

      .app-shell {
        width: min(1200px, calc(100% - 32px));
        margin: 0 auto;
        padding: 24px 0 56px;
        position: relative;
        z-index: 1;
      }

      .topbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        margin-bottom: 24px;
        padding: 14px 18px;
        border-radius: 26px;
        background: rgba(255, 255, 255, 0.72);
        border: 1px solid rgba(255, 255, 255, 0.55);
        box-shadow: var(--shadow-soft);
        backdrop-filter: blur(18px);
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .brand-mark {
        width: 42px;
        height: 42px;
        border-radius: 14px;
        display: grid;
        place-items: center;
        background: linear-gradient(135deg, var(--primary), var(--secondary));
        color: white;
        font-weight: 800;
        box-shadow: 0 16px 24px rgba(15, 118, 110, 0.2);
        animation: pulseMark 5.5s ease-in-out infinite;
      }

      .brand h1 {
        font-size: 1.1rem;
        margin: 0;
        white-space: nowrap;
        letter-spacing: -0.02em;
      }

      .topbar-controls {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 14px;
        flex-wrap: wrap;
      }

      .nav-actions {
        display: flex;
        gap: 12px;
        align-items: center;
      }

      .language-bar {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px;
        border-radius: 999px;
        border: 1px solid rgba(15, 118, 110, 0.14);
        background: rgba(255, 255, 255, 0.88);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
      }

      .language-button {
        min-width: 74px;
        padding: 10px 12px;
        border-radius: 999px;
        background: transparent;
        color: var(--primary-dark);
        border: 1px solid transparent;
        box-shadow: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-size: 13px;
        font-weight: 800;
      }

      .language-button:hover {
        background: rgba(15, 118, 110, 0.08);
        box-shadow: none;
      }

      .language-button.active {
        background: linear-gradient(135deg, var(--primary), #155e75);
        color: white;
        border-color: transparent;
        box-shadow: 0 14px 24px rgba(15, 118, 110, 0.2);
      }

      .flag {
        font-size: 16px;
        line-height: 1;
      }

      .hero {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 28px;
        box-shadow: var(--shadow);
        padding: 28px;
        margin-bottom: 24px;
        backdrop-filter: blur(10px);
        position: relative;
        overflow: hidden;
        animation: revealUp 520ms var(--ease-out) both;
      }

      .hero::after {
        content: "";
        position: absolute;
        inset: 0;
        background:
          linear-gradient(120deg, rgba(255, 255, 255, 0.38), transparent 30%),
          radial-gradient(circle at 80% 20%, rgba(15, 118, 110, 0.09), transparent 24%);
        pointer-events: none;
      }

      .hero h2 {
        margin: 10px 0 12px;
        font-size: clamp(2rem, 4vw, 3.8rem);
        line-height: 1.05;
        max-width: 14ch;
      }

      .hero h2.nowrap {
        max-width: none;
        white-space: nowrap;
        font-size: clamp(1.35rem, 5vw, 3.8rem);
        letter-spacing: -0.03em;
      }

      .hero p {
        margin: 0;
        line-height: 1.6;
        color: var(--muted);
        max-width: 70ch;
      }

      .hero-meta {
        display: inline-flex;
        gap: 10px;
        align-items: center;
        border-radius: 999px;
        padding: 8px 12px;
        background: rgba(15, 118, 110, 0.08);
        color: var(--primary-dark);
        font-size: 14px;
        font-weight: 700;
      }

      .panel {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 24px;
        box-shadow: var(--shadow);
        padding: 22px;
        backdrop-filter: blur(10px);
        transition:
          transform 220ms var(--ease-out),
          box-shadow 220ms var(--ease-out),
          border-color 220ms var(--ease-out),
          background 220ms var(--ease-out);
        animation: revealUp 560ms var(--ease-out) both;
      }

      .panel:hover,
      .announcement:hover,
      .catalog-entry:hover,
      .course-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 28px 42px rgba(28, 43, 77, 0.16);
        border-color: rgba(15, 118, 110, 0.24);
      }

      .compact-panel {
        padding: 18px;
      }

      .grid {
        display: grid;
        gap: 20px;
      }

      .stats-grid {
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        margin-bottom: 24px;
      }

      .cards-grid {
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      }

      .two-col {
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      }

      .three-col {
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      }

      .stack {
        display: grid;
        gap: 16px;
      }

      .stat-card h3,
      .panel h3,
      .panel h2,
      .panel h4 {
        margin: 0 0 10px;
        letter-spacing: -0.02em;
      }

      .kicker {
        margin: 0 0 8px;
        color: var(--primary-dark);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-weight: 700;
        font-size: 12px;
      }

      .helper,
      .meta-list,
      .panel p {
        color: var(--muted);
        line-height: 1.6;
      }

      .meta-list {
        display: flex;
        flex-wrap: wrap;
        gap: 10px 16px;
        margin: 12px 0 16px;
        font-size: 14px;
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        align-items: flex-start;
      }

      .inline-chip,
      .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 999px;
        background: rgba(15, 118, 110, 0.08);
        color: var(--primary-dark);
        font-size: 13px;
        font-weight: 700;
      }

      .status-badge.offline {
        background: rgba(180, 83, 9, 0.1);
        color: #92400e;
      }

      .role-pill {
        display: inline-flex;
        align-items: center;
        padding: 6px 10px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .role-pill.admin {
        background: rgba(180, 83, 9, 0.12);
        color: #9a3412;
      }

      .role-pill.teacher {
        background: rgba(15, 118, 110, 0.12);
        color: var(--primary-dark);
      }

      .role-pill.student {
        background: rgba(29, 78, 216, 0.12);
        color: #1d4ed8;
      }

      .message {
        border-radius: 18px;
        padding: 14px 18px;
        margin-bottom: 18px;
        font-weight: 600;
      }

      .message.notice {
        background: rgba(2, 122, 72, 0.1);
        color: var(--success);
      }

      .message.error {
        background: rgba(180, 35, 24, 0.1);
        color: var(--danger);
      }

      form {
        display: grid;
        gap: 14px;
      }

      .inline-form {
        display: inline-flex;
        gap: 0;
      }

      label {
        display: grid;
        gap: 8px;
        font-weight: 600;
      }

      input,
      textarea,
      select {
        width: 100%;
        border: 1px solid rgba(85, 99, 112, 0.22);
        border-radius: 16px;
        padding: 12px 14px;
        background: var(--surface-strong);
        font: inherit;
        color: var(--text);
      }

      textarea {
        min-height: 120px;
        resize: vertical;
      }

      .actions-row {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        align-items: center;
      }

      .table-wrap {
        overflow-x: auto;
      }

      .table-wrap.scroll-panel {
        max-height: 420px;
        overflow: auto;
        border: 1px solid rgba(85, 99, 112, 0.12);
        border-radius: 20px;
        background: rgba(255, 255, 255, 0.72);
        scrollbar-width: thin;
        scrollbar-color: rgba(15, 118, 110, 0.32) rgba(15, 118, 110, 0.08);
      }

      .table-wrap.scroll-panel table {
        margin-top: 0;
      }

      .table-wrap.scroll-panel thead th {
        position: sticky;
        top: 0;
        z-index: 1;
      }

      .filter-row {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        align-items: center;
        margin: 16px 0 12px;
      }

      .filter-row input,
      .filter-row select {
        max-width: 260px;
      }

      .filter-count {
        color: var(--muted);
        font-size: 14px;
        margin-left: auto;
      }

      .pagination-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 14px;
      }

      .pagination-label {
        color: var(--muted);
        font-size: 14px;
      }

      .pagination-group {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .page-number-button {
        border: 1px solid rgba(15, 118, 110, 0.18);
        border-radius: 999px;
        padding: 8px 12px;
        background: rgba(255, 255, 255, 0.9);
        color: var(--primary-dark);
        cursor: pointer;
        font: inherit;
        font-weight: 700;
      }

      .page-number-button.active {
        background: linear-gradient(135deg, var(--primary), #155e75);
        color: white;
        border-color: transparent;
      }

      .tab-row {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin: 16px 0 18px;
      }

      .tab-button {
        border: 1px solid rgba(15, 118, 110, 0.18);
        border-radius: 999px;
        padding: 10px 16px;
        background: rgba(255, 255, 255, 0.9);
        color: var(--primary-dark);
        cursor: pointer;
        font: inherit;
        font-weight: 700;
      }

      .tab-button.active {
        background: linear-gradient(135deg, var(--primary), #155e75);
        color: white;
        border-color: transparent;
      }

      .page-menu-shell {
        margin: 24px 0 20px;
        animation: revealUp 620ms var(--ease-out) both;
      }

      .page-menu {
        position: sticky;
        top: 12px;
        z-index: 20;
        display: flex;
        gap: 12px;
        overflow-x: auto;
        padding: 12px;
        border-radius: 22px;
        border: 1px solid var(--border);
        background: rgba(255, 255, 255, 0.92);
        box-shadow: 0 16px 30px rgba(28, 43, 77, 0.08);
        backdrop-filter: blur(12px);
        scrollbar-width: none;
      }

      .page-menu::-webkit-scrollbar {
        display: none;
      }

      .page-menu-button {
        flex: 0 0 auto;
        border: 1px solid rgba(15, 118, 110, 0.18);
        border-radius: 999px;
        padding: 11px 18px;
        background: rgba(255, 255, 255, 0.96);
        color: var(--primary-dark);
        cursor: pointer;
        font: inherit;
        font-weight: 700;
        white-space: nowrap;
      }

      .page-menu-button.active {
        background: linear-gradient(135deg, var(--primary), #155e75);
        color: white;
        border-color: transparent;
        box-shadow: 0 14px 22px rgba(15, 118, 110, 0.18);
      }

      .page-panel-stack {
        gap: 20px;
      }

      .page-panel-stack[hidden] {
        display: none !important;
      }

      .page-panel-stack:not([hidden]) {
        display: grid;
      }

      .cards-scroll {
        max-height: 760px;
        overflow: auto;
        padding-right: 4px;
      }

      .collapsible-panel {
        padding: 0;
        overflow: hidden;
      }

      .collapsible-panel summary {
        list-style: none;
        cursor: pointer;
        padding: 22px;
      }

      .collapsible-panel summary::-webkit-details-marker {
        display: none;
      }

      .collapsible-panel[open] summary {
        border-bottom: 1px solid rgba(85, 99, 112, 0.12);
      }

      .collapsible-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }

      .collapsible-header h3,
      .collapsible-header p {
        margin: 0;
      }

      .collapsible-icon {
        font-size: 18px;
        color: var(--primary-dark);
        transition: transform 0.2s ease;
      }

      .collapsible-panel[open] .collapsible-icon {
        transform: rotate(90deg);
      }

      .collapsible-body {
        padding: 22px;
      }

      .section-controls {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 12px;
        margin: 0 0 18px;
      }

      .section-meta {
        color: var(--muted);
        font-size: 14px;
        margin: 10px 0 0;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 12px;
      }

      th,
      td {
        text-align: left;
        padding: 14px 12px;
        border-bottom: 1px solid rgba(85, 99, 112, 0.12);
        vertical-align: top;
      }

      th {
        color: var(--primary-dark);
        background: rgba(15, 118, 110, 0.06);
      }

      .announcement {
        border: 1px solid rgba(85, 99, 112, 0.14);
        border-radius: 18px;
        padding: 16px;
        background: rgba(255, 255, 255, 0.72);
        transition:
          transform 220ms var(--ease-out),
          box-shadow 220ms var(--ease-out),
          border-color 220ms var(--ease-out);
      }

      .catalog-entry {
        border: 1px solid rgba(85, 99, 112, 0.14);
        border-radius: 18px;
        padding: 14px;
        background: rgba(255, 255, 255, 0.78);
        transition:
          transform 220ms var(--ease-out),
          box-shadow 220ms var(--ease-out),
          border-color 220ms var(--ease-out);
      }

      .catalog-entry strong {
        display: block;
        margin-bottom: 6px;
      }

      .catalog-entry p {
        margin: 0 0 8px;
      }

      .announcement-header {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 8px;
      }

      .empty {
        margin: 0;
        color: var(--muted);
        font-style: italic;
      }

      .question-card {
        border: 1px dashed rgba(15, 118, 110, 0.28);
        border-radius: 18px;
        padding: 16px;
        background: rgba(255, 255, 255, 0.65);
      }

      .question-card h4 {
        margin: 0 0 12px;
      }

      .quiz-option-grid {
        display: grid;
        gap: 12px;
      }

      .quiz-option {
        display: flex;
        gap: 10px;
        align-items: flex-start;
        padding: 14px;
        border-radius: 16px;
        border: 1px solid rgba(85, 99, 112, 0.16);
        background: rgba(255, 255, 255, 0.7);
      }

      .course-hero-grid {
        display: grid;
        gap: 20px;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      }

      .mono {
        font-family: "SFMono-Regular", "Menlo", monospace;
      }

      tbody tr:hover {
        background: rgba(15, 118, 110, 0.05);
      }

      @media (max-width: 720px) {
        .app-shell {
          width: min(100% - 20px, 1200px);
        }

        .topbar {
          flex-direction: column;
          align-items: flex-start;
        }

        .topbar-controls {
          width: 100%;
          justify-content: flex-start;
        }

        .nav-actions {
          width: 100%;
          flex-wrap: wrap;
        }

        .hero h2 {
          max-width: none;
        }

        .page-menu {
          top: 8px;
          padding: 10px;
        }
      }

      @keyframes revealUp {
        from {
          opacity: 0;
          transform: translateY(16px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes pulseMark {
        0%,
        100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-2px);
        }
      }

      @keyframes drift {
        from {
          transform: translate3d(0, 0, 0);
        }
        to {
          transform: translate3d(18px, -18px, 0);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        html {
          scroll-behavior: auto;
        }

        *,
        *::before,
        *::after {
          animation: none !important;
          transition: none !important;
        }
      }
    </style>
  </head>
  <body>
    <main class="app-shell">
      <header class="topbar">
        <div class="brand">
          <div class="brand-mark">UL</div>
          <h1>University Learning Hub</h1>
        </div>
        ${topbarControls}
      </header>

      <section class="hero">
        ${roleBlock}
        <h2 class="${headlineNoWrap ? "nowrap" : ""}">${escapeHtml(headline)}</h2>
        ${subhead ? `<p>${escapeHtml(subhead)}</p>` : ""}
      </section>

      ${renderMessageBanner(query)}
      ${content}
    </main>
    ${extraScripts}
    <script>
      (function () {
        const pageMenus = Array.from(document.querySelectorAll('[data-page-menu]'));
        if (!pageMenus.length) return;

        pageMenus.forEach(function (pageMenu) {
          const scopeName = pageMenu.getAttribute('data-page-menu') || '';
          const defaultTab = pageMenu.getAttribute('data-default-tab') || '';
          const buttons = Array.from(pageMenu.querySelectorAll('[data-page-tab]'));
          const panels = Array.from(
            document.querySelectorAll('[data-page-panel-scope="' + scopeName + '"][data-page-panel]')
          );
          if (!buttons.length || !panels.length) return;

          function validTab(tabId) {
            return buttons.some(function (button) {
              return button.getAttribute('data-page-tab') === tabId;
            });
          }

          function currentHashTab() {
            const hash = window.location.hash.replace(/^#/, '');
            return validTab(hash) ? hash : '';
          }

          function updateHash(tabId) {
            const base = window.location.pathname + window.location.search;
            if (window.location.hash === '#' + tabId) return;
            window.history.replaceState(null, '', base + '#' + tabId);
          }

          function activateTab(tabId, syncHash) {
            const activeTab = validTab(tabId) ? tabId : defaultTab || buttons[0].getAttribute('data-page-tab');
            buttons.forEach(function (button) {
              const isActive = button.getAttribute('data-page-tab') === activeTab;
              button.classList.toggle('active', isActive);
              button.setAttribute('aria-selected', isActive ? 'true' : 'false');
            });
            panels.forEach(function (panel) {
              const isActive = panel.getAttribute('data-page-panel') === activeTab;
              panel.hidden = !isActive;
            });
            if (syncHash) {
              updateHash(activeTab);
            }
          }

          buttons.forEach(function (button) {
            button.addEventListener('click', function () {
              activateTab(button.getAttribute('data-page-tab'), true);
            });
          });

          window.addEventListener('hashchange', function () {
            activateTab(currentHashTab() || defaultTab, false);
          });

          activateTab(currentHashTab() || defaultTab, !currentHashTab());
        });
      })();
    </script>
    <script>
      (function () {
        const languageOptions = ${JSON.stringify(UI_LANGUAGE_OPTIONS)};
        const textTranslations = ${JSON.stringify(UI_TEXT_TRANSLATIONS)};
        const localeStorageKey = 'ulh_locale';
        const supportedLocales = new Set(languageOptions.map(function (option) {
          return option.code;
        }));
        const localeButtons = Array.from(document.querySelectorAll('[data-locale]'));
        const localeFormatCodes = {
          en: 'en-GB',
          zh: 'zh-CN',
          de: 'de-DE',
          fr: 'fr-FR',
          hi: 'hi-IN',
          ar: 'ar-SA',
        };

        function resolveLocale(candidate) {
          const value = String(candidate || '').toLowerCase();
          if (supportedLocales.has(value)) return value;
          if (value.startsWith('zh')) return 'zh';
          if (value.startsWith('de')) return 'de';
          if (value.startsWith('fr')) return 'fr';
          if (value.startsWith('hi')) return 'hi';
          if (value.startsWith('ar')) return 'ar';
          return 'en';
        }

        function localeFormatCode(locale) {
          return localeFormatCodes[resolveLocale(locale)] || 'en-GB';
        }

        function translateExact(source, locale) {
          return textTranslations[locale] && textTranslations[locale][source];
        }

        function looksLikeDateText(source) {
          return /(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}(?:\s+at\s+\d{2}:\d{2})?/i.test(
            source
          ) || /\b\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?)?\b/.test(source);
        }

        function formatLocaleDateTime(source, locale) {
          const value = String(source || '').trim();
          if (!value || !looksLikeDateText(value)) return '';

          let normalized = value.replace(/\s+at\s+/i, ' ');
          let date = new Date(normalized);
          if (Number.isNaN(date.getTime())) {
            normalized = normalized.replace(
              /(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})(?::\d{2})?/,
              '$1T$2:00'
            );
            date = new Date(normalized);
          }
          if (Number.isNaN(date.getTime())) return '';

          return new Intl.DateTimeFormat(localeFormatCode(locale), {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'Europe/Berlin',
          }).format(date);
        }

        function localizeFragment(source, locale) {
          const value = String(source || '');
          if (!value) return value;
          const exact = translateExact(value, locale);
          if (exact) return exact;
          return formatLocaleDateTime(value, locale) || value;
        }

        function translateEmbeddedDates(source, locale) {
          let output = String(source || '');
          const patterns = [
            /(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}(?:\s+at\s+\d{2}:\d{2})?/g,
            /\b\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?)?\b/g,
          ];

          patterns.forEach(function (pattern) {
            output = output.replace(pattern, function (match) {
              return formatLocaleDateTime(match, locale) || match;
            });
          });

          return output;
        }

        function translatePattern(source, locale) {
          const patterns = [
            {
              regex: /^Showing (\d+) matches$/,
              render: function (_, count) {
                return {
                  zh: '显示 ' + count + ' 条结果',
                  de: count + ' Treffer angezeigt',
                  fr: count + ' résultats affichés',
                  hi: count + ' परिणाम दिखाए जा रहे हैं',
                  ar: 'عرض ' + count + ' نتيجة',
                }[locale];
              },
            },
            {
              regex: /^Showing (\d+) of (\d+)$/,
              render: function (_, visible, total) {
                return {
                  zh: '显示 ' + visible + ' / ' + total,
                  de: visible + ' von ' + total + ' angezeigt',
                  fr: visible + ' sur ' + total + ' affichés',
                  hi: visible + ' / ' + total + ' दिखाया जा रहा है',
                  ar: 'عرض ' + visible + ' من ' + total,
                }[locale];
              },
            },
            {
              regex: /^Page (\d+) of (\d+)$/,
              render: function (_, page, total) {
                return {
                  zh: '第 ' + page + ' / ' + total + ' 页',
                  de: 'Seite ' + page + ' von ' + total,
                  fr: 'Page ' + page + ' sur ' + total,
                  hi: 'पृष्ठ ' + page + ' / ' + total,
                  ar: 'الصفحة ' + page + ' من ' + total,
                }[locale];
              },
            },
            {
              regex: /^(\d+) students$/,
              render: function (_, count) {
                return {
                  zh: count + ' 名学生',
                  de: count + ' Studierende',
                  fr: count + ' étudiants',
                  hi: count + ' छात्र',
                  ar: count + ' طلاب',
                }[locale];
              },
            },
            {
              regex: /^(\d+) courses$/,
              render: function (_, count) {
                return {
                  zh: count + ' 门课程',
                  de: count + ' Kurse',
                  fr: count + ' cours',
                  hi: count + ' कोर्स',
                  ar: count + ' مقررات',
                }[locale];
              },
            },
            {
              regex: /^Teachers \((\d+)\)$/,
              render: function (_, count) {
                return {
                  zh: '教师（' + count + '）',
                  de: 'Lehrende (' + count + ')',
                  fr: 'Enseignants (' + count + ')',
                  hi: 'शिक्षक (' + count + ')',
                  ar: 'المعلمون (' + count + ')',
                }[locale];
              },
            },
            {
              regex: /^Students \((\d+)\)$/,
              render: function (_, count) {
                return {
                  zh: '学生（' + count + '）',
                  de: 'Studierende (' + count + ')',
                  fr: 'Étudiants (' + count + ')',
                  hi: 'छात्र (' + count + ')',
                  ar: 'الطلاب (' + count + ')',
                }[locale];
              },
            },
            {
              regex: /^Questions: (\d+)$/,
              render: function (_, count) {
                return {
                  zh: '题目数：' + count,
                  de: 'Fragen: ' + count,
                  fr: 'Questions : ' + count,
                  hi: 'प्रश्न: ' + count,
                  ar: 'الأسئلة: ' + count,
                }[locale];
              },
            },
            {
              regex: /^Level: (.+)$/,
              render: function (_, value) {
                const localizedValue = localizeFragment(value, locale);
                return {
                  zh: '层级：' + localizedValue,
                  de: 'Ebene: ' + localizedValue,
                  fr: 'Niveau : ' + localizedValue,
                  hi: 'स्तर: ' + localizedValue,
                  ar: 'المرحلة: ' + localizedValue,
                }[locale];
              },
            },
            {
              regex: /^Program: (.+)$/,
              render: function (_, value) {
                return {
                  zh: '专业：' + value,
                  de: 'Programm: ' + value,
                  fr: 'Programme : ' + value,
                  hi: 'प्रोग्राम: ' + value,
                  ar: 'البرنامج: ' + value,
                }[locale];
              },
            },
            {
              regex: /^Teacher: (.+)$/,
              render: function (_, value) {
                return {
                  zh: '教师：' + value,
                  de: 'Lehrperson: ' + value,
                  fr: 'Enseignant : ' + value,
                  hi: 'शिक्षक: ' + value,
                  ar: 'المعلم: ' + value,
                }[locale];
              },
            },
            {
              regex: /^Schedule: (.+)$/,
              render: function (_, value) {
                const localizedValue = localizeFragment(value, locale);
                return {
                  zh: '时间：' + localizedValue,
                  de: 'Termin: ' + localizedValue,
                  fr: 'Horaire : ' + localizedValue,
                  hi: 'समय: ' + localizedValue,
                  ar: 'الموعد: ' + localizedValue,
                }[locale];
              },
            },
            {
              regex: /^Materials: (\d+)$/,
              render: function (_, count) {
                return {
                  zh: '资料：' + count,
                  de: 'Materialien: ' + count,
                  fr: 'Supports : ' + count,
                  hi: 'सामग्री: ' + count,
                  ar: 'المواد: ' + count,
                }[locale];
              },
            },
            {
              regex: /^Quizzes: (\d+)$/,
              render: function (_, count) {
                return {
                  zh: '测验：' + count,
                  de: 'Quizze: ' + count,
                  fr: 'Quiz : ' + count,
                  hi: 'क्विज़: ' + count,
                  ar: 'الاختبارات القصيرة: ' + count,
                }[locale];
              },
            },
            {
              regex: /^Due: (.+)$/,
              render: function (_, value) {
                const localizedValue = localizeFragment(value, locale);
                return {
                  zh: '截止：' + localizedValue,
                  de: 'Fällig: ' + localizedValue,
                  fr: 'Échéance : ' + localizedValue,
                  hi: 'अंतिम तिथि: ' + localizedValue,
                  ar: 'الاستحقاق: ' + localizedValue,
                }[locale];
              },
            },
            {
              regex: /^To (.+)$/,
              render: function (_, name) {
                return {
                  zh: '发给 ' + name,
                  de: 'An ' + name,
                  fr: 'À ' + name,
                  hi: name + ' को',
                  ar: 'إلى ' + name,
                }[locale];
              },
            },
            {
              regex: /^Submitted (.+)$/,
              render: function (_, time) {
                const localizedTime = localizeFragment(time, locale);
                return {
                  zh: '已提交 ' + localizedTime,
                  de: 'Abgegeben ' + localizedTime,
                  fr: 'Remis ' + localizedTime,
                  hi: localizedTime + ' को जमा किया गया',
                  ar: 'تم التسليم ' + localizedTime,
                }[locale];
              },
            },
            {
              regex: /^Grade: (.+)$/,
              render: function (_, grade) {
                return {
                  zh: '成绩：' + grade,
                  de: 'Note: ' + grade,
                  fr: 'Note : ' + grade,
                  hi: 'ग्रेड: ' + grade,
                  ar: 'الدرجة: ' + grade,
                }[locale];
              },
            },
            {
              regex: /^Lead teacher: (.+)$/,
              render: function (_, teacher) {
                return {
                  zh: '主讲教师：' + teacher,
                  de: 'Lehrverantwortlich: ' + teacher,
                  fr: 'Enseignant principal : ' + teacher,
                  hi: 'मुख्य शिक्षक: ' + teacher,
                  ar: 'المعلم الرئيسي: ' + teacher,
                }[locale];
              },
            },
            {
              regex: /^Latest score: (.+) · (.+)$/,
              render: function (_, score, time) {
                const localizedScore = localizeFragment(score, locale);
                const localizedTime = localizeFragment(time, locale);
                return {
                  zh: '最近得分：' + localizedScore + ' · ' + localizedTime,
                  de: 'Letztes Ergebnis: ' + localizedScore + ' · ' + localizedTime,
                  fr: 'Dernier score : ' + localizedScore + ' · ' + localizedTime,
                  hi: 'नवीनतम स्कोर: ' + localizedScore + ' · ' + localizedTime,
                  ar: 'أحدث نتيجة: ' + localizedScore + ' · ' + localizedTime,
                }[locale];
              },
            },
            {
              regex: /^Latest result: (.+)$/,
              render: function (_, value) {
                const localizedValue = localizeFragment(value, locale);
                return {
                  zh: '最近结果：' + localizedValue,
                  de: 'Letztes Resultat: ' + localizedValue,
                  fr: 'Dernier résultat : ' + localizedValue,
                  hi: 'नवीनतम परिणाम: ' + localizedValue,
                  ar: 'أحدث نتيجة: ' + localizedValue,
                }[locale];
              },
            },
            {
              regex: /^(\d+) of (\d+) students submitted$/,
              render: function (_, submitted, total) {
                return {
                  zh: submitted + ' / ' + total + ' 名学生已提交',
                  de: submitted + ' von ' + total + ' Studierenden haben abgegeben',
                  fr: submitted + ' sur ' + total + ' étudiants ont remis',
                  hi: total + ' में से ' + submitted + ' छात्रों ने जमा किया',
                  ar: 'قام ' + submitted + ' من أصل ' + total + ' طلاب بالتسليم',
                }[locale];
              },
            },
            {
              regex: /^(\d+) files · (\d+) announcements · (\d+) quizzes · (\d+) assignments$/,
              render: function (_, files, announcements, quizzes, assignments) {
                return {
                  zh: files + ' 个文件 · ' + announcements + ' 条公告 · ' + quizzes + ' 个测验 · ' + assignments + ' 个作业',
                  de: files + ' Dateien · ' + announcements + ' Ankündigungen · ' + quizzes + ' Quizze · ' + assignments + ' Abgaben',
                  fr: files + ' fichiers · ' + announcements + ' annonces · ' + quizzes + ' quiz · ' + assignments + ' travaux',
                  hi: files + ' फ़ाइलें · ' + announcements + ' घोषणाएँ · ' + quizzes + ' क्विज़ · ' + assignments + ' असाइनमेंट',
                  ar: files + ' ملفات · ' + announcements + ' إعلانات · ' + quizzes + ' اختبارات قصيرة · ' + assignments + ' واجبات',
                }[locale];
              },
            },
          ];

          for (const pattern of patterns) {
            const match = source.match(pattern.regex);
            if (match) {
              return pattern.render.apply(null, match);
            }
          }
          return source;
        }

        function translateText(source, locale) {
          if (!source || locale === 'en') {
            return source;
          }
          const exact = translateExact(source, locale);
          if (exact) {
            return exact;
          }
          const translatedPattern = translatePattern(source, locale);
          if (translatedPattern !== source) {
            return translatedPattern;
          }
          return translateEmbeddedDates(source, locale);
        }

        function attributeDatasetKey(attributeName) {
          return {
            placeholder: 'i18nOriginalPlaceholder',
            title: 'i18nOriginalTitle',
            'aria-label': 'i18nOriginalAriaLabel',
          }[attributeName];
        }

        function applyLocale(scope) {
          const target = scope || document.body;
          const locale = resolveLocale(window.__uiLocale);
          const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT, {
            acceptNode: function (node) {
              if (!node.nodeValue || !node.nodeValue.trim()) {
                return NodeFilter.FILTER_REJECT;
              }
              const parent = node.parentElement;
              if (!parent) {
                return NodeFilter.FILTER_REJECT;
              }
              if (parent.closest('[data-i18n-skip]')) {
                return NodeFilter.FILTER_REJECT;
              }
              if (['SCRIPT', 'STYLE', 'TEXTAREA'].includes(parent.tagName)) {
                return NodeFilter.FILTER_REJECT;
              }
              return NodeFilter.FILTER_ACCEPT;
            },
          });

          let textNode;
          while ((textNode = walker.nextNode())) {
            const raw = textNode.__i18nOriginalRaw || textNode.nodeValue;
            const source = textNode.__i18nOriginal || textNode.nodeValue.trim();
            if (!source) continue;
            textNode.__i18nOriginalRaw = raw;
            textNode.__i18nOriginal = source;
            textNode.nodeValue = raw.replace(source, translateText(source, locale));
          }

          Array.from(target.querySelectorAll('[placeholder], [title], [aria-label]')).forEach(function (element) {
            if (element.closest('[data-i18n-skip]')) return;
            ['placeholder', 'title', 'aria-label'].forEach(function (attributeName) {
              if (!element.hasAttribute(attributeName)) return;
              const datasetKey = attributeDatasetKey(attributeName);
              const source = element.dataset[datasetKey] || element.getAttribute(attributeName);
              element.dataset[datasetKey] = source;
              element.setAttribute(attributeName, translateText(source, locale));
            });
          });

          if (!window.__uiDocumentTitleOriginal) {
            window.__uiDocumentTitleOriginal = document.title;
          }
          document.title = translateText(window.__uiDocumentTitleOriginal, locale);
          document.documentElement.lang = locale;
          document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
          document.documentElement.setAttribute('data-ui-locale', locale);

          localeButtons.forEach(function (button) {
            button.classList.toggle('active', button.getAttribute('data-locale') === locale);
          });
        }

        function setLocale(locale) {
          const resolvedLocale = resolveLocale(locale);
          window.__uiLocale = resolvedLocale;
          try {
            window.localStorage.setItem(localeStorageKey, resolvedLocale);
          } catch (error) {
          }
          applyLocale(document.body);
          window.dispatchEvent(new CustomEvent('ui-locale-change', {
            detail: { locale: resolvedLocale },
          }));
        }

        localeButtons.forEach(function (button) {
          button.addEventListener('click', function () {
            setLocale(button.getAttribute('data-locale'));
          });
        });

        try {
          window.__uiLocale = resolveLocale(
            window.localStorage.getItem(localeStorageKey) ||
              navigator.language ||
              navigator.userLanguage
          );
        } catch (error) {
          window.__uiLocale = 'en';
        }

        window.__applyUiLocale = applyLocale;
        window.__translateUiText = function (value) {
          return translateText(String(value || ''), resolveLocale(window.__uiLocale));
        };

        applyLocale(document.body);
      })();
    </script>
  </body>
</html>`;
}

async function dbQuery(sql, params = []) {
  if (!pool) {
    throw new Error("Database is not configured.");
  }

  const [rows] = await pool.query(sql, params);
  return rows;
}

async function dbOne(sql, params = []) {
  const rows = await dbQuery(sql, params);
  return rows[0] || null;
}

async function logOperation({
  actor,
  actionType,
  targetType,
  targetIdentifier = null,
  targetLabel = null,
  course = null,
  summary,
}) {
  if (!pool || !actor || !["admin", "teacher"].includes(actor.role) || !summary) {
    return;
  }

  await dbQuery(
    `INSERT INTO operation_logs
     (actor_user_id, actor_name, actor_email, actor_role, action_type, target_type, target_identifier, target_label, course_id, course_code, course_title, summary)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      actor.id,
      actor.full_name,
      actor.email,
      actor.role,
      actionType,
      targetType,
      targetIdentifier,
      targetLabel,
      course?.id || null,
      course?.code || null,
      course?.title || null,
      summary,
    ]
  );
}

async function getRecentOperationLogs({ actorUserId = null, limit = 12 } = {}) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 12, 50));
  const clauses = [];
  const params = [];

  if (actorUserId) {
    clauses.push("actor_user_id = ?");
    params.push(actorUserId);
  }

  const whereClause = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return dbQuery(
    `SELECT
       id,
       actor_name,
       actor_email,
       actor_role,
       action_type,
       target_type,
       target_identifier,
       target_label,
       course_id,
       course_code,
       course_title,
       summary,
       created_at
     FROM operation_logs
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT ${safeLimit}`,
    params
  );
}

async function ensureSchema() {
  if (!pool) {
    return;
  }

  const schemaPath = path.join(__dirname, "sql", "schema.sql");
  const source = fs.readFileSync(schemaPath, "utf8");
  const withoutComments = source
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");

  const statements = withoutComments
    .split(/;\s*(?:\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await dbQuery(statement);
  }

  await ensureUserColumns();
  await ensureCourseColumns();
  await seedDefaultUsers();
  await seedAcademicCatalog();
}

async function ensureUserColumns() {
  const passwordColumn = await dbQuery("SHOW COLUMNS FROM users LIKE 'display_password'");
  if (!passwordColumn.length) {
    await dbQuery(
      "ALTER TABLE users ADD COLUMN display_password VARCHAR(255) NULL AFTER password_hash"
    );
  }

  const levelColumn = await dbQuery("SHOW COLUMNS FROM users LIKE 'study_level'");
  if (!levelColumn.length) {
    await dbQuery(
      "ALTER TABLE users ADD COLUMN study_level ENUM('undergraduate', 'graduate') NULL AFTER display_password"
    );
  }

  const programColumn = await dbQuery("SHOW COLUMNS FROM users LIKE 'program_name'");
  if (!programColumn.length) {
    await dbQuery(
      "ALTER TABLE users ADD COLUMN program_name VARCHAR(150) NULL AFTER study_level"
    );
  }
}

async function ensureCourseColumns() {
  const levelColumn = await dbQuery("SHOW COLUMNS FROM courses LIKE 'study_level'");
  if (!levelColumn.length) {
    await dbQuery(
      "ALTER TABLE courses ADD COLUMN study_level ENUM('undergraduate', 'graduate') NULL AFTER description"
    );
  }

  const programColumn = await dbQuery("SHOW COLUMNS FROM courses LIKE 'program_name'");
  if (!programColumn.length) {
    await dbQuery(
      "ALTER TABLE courses ADD COLUMN program_name VARCHAR(150) NULL AFTER study_level"
    );
  }
}

async function ensureUserAccount({
  fullName,
  email,
  role,
  password,
  studyLevel = null,
  programName = null,
  activate = true,
}) {
  const existing = await dbOne(
    `SELECT id
     FROM users
     WHERE email = ?`,
    [email]
  );
  const passwordRecord = buildPasswordRecord(password);

  if (!existing) {
    const result = await dbQuery(
      `INSERT INTO users
       (full_name, email, role, password_salt, password_hash, display_password, study_level, program_name, is_active, last_seen_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        fullName,
        email,
        role,
        passwordRecord.salt,
        passwordRecord.hash,
        password,
        studyLevel,
        programName,
        activate ? 1 : 0,
      ]
    );

    return {
      id: result.insertId,
      full_name: fullName,
      email,
      role,
      study_level: studyLevel,
      program_name: programName,
    };
  }

  await dbQuery(
    `UPDATE users
     SET
       full_name = ?,
       role = ?,
       password_salt = ?,
       password_hash = ?,
       display_password = ?,
       study_level = ?,
       program_name = ?,
       is_active = ?
     WHERE id = ?`,
    [
      fullName,
      role,
      passwordRecord.salt,
      passwordRecord.hash,
      password,
      studyLevel,
      programName,
      activate ? 1 : 0,
      existing.id,
    ]
  );

  return {
    id: existing.id,
    full_name: fullName,
    email,
    role,
    study_level: studyLevel,
    program_name: programName,
  };
}

async function ensureCatalogCourse(program, course, teacherIds, programIndex, courseIndex) {
  const scheduleAt = computeScheduleAt(programIndex, courseIndex);
  const existing = await dbOne("SELECT id FROM courses WHERE code = ?", [course.code]);
  const [primaryTeacherId] = teacherIds;

  let courseId = existing?.id;
  if (!courseId) {
    const result = await dbQuery(
      `INSERT INTO courses
       (title, code, description, study_level, program_name, schedule_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        course.title,
        course.code,
        course.description,
        program.studyLevel,
        program.programName,
        scheduleAt,
        primaryTeacherId,
      ]
    );
    courseId = result.insertId;
  } else {
    await dbQuery(
      `UPDATE courses
       SET
         title = ?,
         description = ?,
         study_level = ?,
         program_name = ?,
         schedule_at = ?,
         created_by = ?
       WHERE id = ?`,
      [
        course.title,
        course.description,
        program.studyLevel,
        program.programName,
        scheduleAt,
        primaryTeacherId,
        courseId,
      ]
    );
  }

  for (const teacherId of teacherIds) {
    await dbQuery(
      `INSERT IGNORE INTO course_memberships (course_id, user_id, role)
       VALUES (?, ?, 'teacher')`,
      [courseId, teacherId]
    );
  }

  return {
    id: courseId,
    code: course.code,
    title: course.title,
    studyLevel: program.studyLevel,
    programName: program.programName,
  };
}

async function renameLegacySeedUser(oldEmail, newEmail, newFullName) {
  if (!oldEmail || oldEmail === newEmail) {
    return;
  }

  const oldUser = await dbOne("SELECT id FROM users WHERE email = ?", [oldEmail]);
  if (!oldUser) {
    return;
  }

  const existingNewUser = await dbOne("SELECT id FROM users WHERE email = ?", [newEmail]);
  if (existingNewUser) {
    return;
  }

  await dbQuery("UPDATE users SET email = ?, full_name = ? WHERE id = ?", [
    newEmail,
    newFullName,
    oldUser.id,
  ]);
}

async function seedDefaultUsers() {
  await renameLegacySeedUser(
    "teacher@example.com",
    "amelia.hart@universityhub.edu",
    "Dr. Amelia Hart"
  );
  await renameLegacySeedUser(
    "student@example.com",
    "mia.thompson@universityhub.edu",
    "Mia Thompson"
  );

  const defaults = [
    {
      fullName: "System Administrator",
      email: "admin@example.com",
      role: "admin",
      password: "Admin123!",
    },
    {
      fullName: "Dr. Amelia Hart",
      email: "amelia.hart@universityhub.edu",
      role: "teacher",
      password: "Teacher123!",
    },
    {
      fullName: "Mia Thompson",
      email: "mia.thompson@universityhub.edu",
      role: "student",
      password: "Student123!",
    },
  ];

  for (const user of defaults) {
    await ensureUserAccount(user);
  }
}

async function seedAcademicCatalog() {
  const teacherMap = new Map();

  for (const program of ACADEMIC_CATALOG) {
    const primaryTeacher = await ensureUserAccount({
      ...program.teacher,
      role: "teacher",
      studyLevel: program.studyLevel,
      programName: program.programName,
    });
    const extraTeachers = [];
    for (const teacherSeed of EXTRA_PROGRAM_TEACHERS[program.programName] || []) {
      extraTeachers.push(
        await ensureUserAccount({
          ...teacherSeed,
          role: "teacher",
          studyLevel: program.studyLevel,
          programName: program.programName,
        })
      );
    }

    teacherMap.set(program.programName, {
      primaryTeacher,
      extraTeachers,
    });
  }

  const seededCourses = [];
  for (const [programIndex, program] of ACADEMIC_CATALOG.entries()) {
    const teachers = teacherMap.get(program.programName);
    for (const [courseIndex, course] of program.courses.entries()) {
      seededCourses.push(
        await ensureCatalogCourse(
          program,
          course,
          [teachers.primaryTeacher.id, ...teachers.extraTeachers.map((teacher) => teacher.id)],
          programIndex,
          courseIndex
        )
      );
    }
  }

  const coursesByProgram = seededCourses.reduce((map, course) => {
    const key = `${course.studyLevel}:${course.programName}`;
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key).push(course);
    return map;
  }, new Map());

  const coursesByLevel = seededCourses.reduce((map, course) => {
    if (!map.has(course.studyLevel)) {
      map.set(course.studyLevel, []);
    }
    map.get(course.studyLevel).push(course);
    return map;
  }, new Map());

  for (const studentSeed of buildStudentSeedList()) {
    await renameLegacySeedUser(
      studentSeed.legacyEmail,
      studentSeed.email,
      studentSeed.fullName
    );

    const student = await ensureUserAccount({
      fullName: studentSeed.fullName,
      email: studentSeed.email,
      role: "student",
      password: studentSeed.password,
      studyLevel: studentSeed.studyLevel,
      programName: studentSeed.programName,
    });

    const programKey = `${studentSeed.studyLevel}:${studentSeed.programName}`;
    const programCourses = coursesByProgram.get(programKey) || [];
    const sameLevelCourses = coursesByLevel.get(studentSeed.studyLevel) || [];
    const desiredCourseCodes = pickStudentCourseCodes(studentSeed, programCourses, sameLevelCourses);

    for (const courseCode of desiredCourseCodes) {
      const course = seededCourses.find((item) => item.code === courseCode);
      if (!course) {
        continue;
      }

      await dbQuery(
        `INSERT IGNORE INTO course_memberships (course_id, user_id, role)
         VALUES (?, ?, 'student')`,
        [course.id, student.id]
      );
    }
  }
}

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function withParams(pathname, params = {}) {
  const [base, current] = pathname.split("?");
  const search = new URLSearchParams(current || "");

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    search.set(key, String(value));
  }

  const query = search.toString();
  return query ? `${base}?${query}` : base;
}

function withHash(pathname, hash) {
  const cleanHash = String(hash || "").replace(/^#/, "");
  if (!cleanHash) {
    return pathname;
  }
  const [base] = String(pathname || "").split("#");
  return `${base}#${cleanHash}`;
}

function dashboardPath(tabId, params = {}) {
  return withHash(withParams("/dashboard", params), tabId);
}

function coursePath(courseId, tabId, params = {}) {
  return withHash(withParams(`/courses/${courseId}`, params), tabId);
}

function createSingleFieldUpload(fieldName) {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (error) => {
      if (error) {
        next(error);
        return;
      }
      next();
    });
  };
}

const uploadSingleMaterial = createSingleFieldUpload("material");
const uploadSingleCsv = createSingleFieldUpload("csv_file");
const uploadSingleSubmission = createSingleFieldUpload("submission_file");
const uploadSingleMessageAttachment = createSingleFieldUpload("attachment_file");

function buildS3ObjectKey(prefix, originalFileName) {
  const extension = path.extname(originalFileName || "");
  const baseName = slugify(path.basename(originalFileName || "file", extension)) || "file";
  return `${prefix}/${Date.now()}-${baseName}${extension}`;
}

function normalizeMessageBody(value) {
  return String(value || "").trim();
}

async function uploadFileToS3(key, file) {
  if (!s3Client || !bucketName) {
    throw new Error("S3 is not configured.");
  }

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype || "application/octet-stream",
    })
  );
}

async function deleteFileFromS3(key) {
  if (!s3Client || !bucketName || !key) {
    return;
  }

  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      })
    );
  } catch (error) {
  }
}

async function storeCourseMessage({
  courseId,
  senderUserId,
  recipientUserId = null,
  body = "",
  file = null,
}) {
  const normalizedBody = normalizeMessageBody(body);
  let attachmentKey = null;
  let attachmentFileName = null;
  let attachmentContentType = null;

  if (file) {
    attachmentKey = buildS3ObjectKey(`courses/${courseId}/messages`, file.originalname);
    await uploadFileToS3(attachmentKey, file);
    attachmentFileName = file.originalname;
    attachmentContentType = file.mimetype || null;
  }

  const result = await dbQuery(
    `INSERT INTO course_messages
     (course_id, sender_user_id, recipient_user_id, body, attachment_s3_key, attachment_file_name, attachment_content_type)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      courseId,
      senderUserId,
      recipientUserId,
      normalizedBody || null,
      attachmentKey,
      attachmentFileName,
      attachmentContentType,
    ]
  );

  return result.insertId;
}

app.use(
  asyncHandler(async (req, res, next) => {
    req.user = null;

    if (!pool) {
      next();
      return;
    }

    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[SESSION_COOKIE_NAME];
    if (!token) {
      next();
      return;
    }

    const user = await dbOne(
      `SELECT id, full_name, email, role, session_token, last_seen_at, is_active
       FROM users
       WHERE session_token = ? AND is_active = 1`,
      [token]
    );

    if (!user) {
      next();
      return;
    }

    req.user = user;
    await dbQuery("UPDATE users SET last_seen_at = NOW() WHERE id = ?", [user.id]);
    req.user.last_seen_at = new Date();
    next();
  })
);

function requireAuth(req, res, next) {
  if (!req.user) {
    res.redirect(withParams("/", { error: "Please sign in first." }));
    return;
  }
  next();
}

function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.redirect(withParams("/dashboard", { error: "You do not have permission for that action." }));
      return;
    }
    next();
  };
}

async function getAccessibleCourse(user, courseId) {
  const course = await dbOne(
    `SELECT c.*, creator.full_name AS creator_name
     FROM courses c
     JOIN users creator ON creator.id = c.created_by
     WHERE c.id = ?`,
    [courseId]
  );

  if (!course) {
    return null;
  }

  if (user.role === "admin") {
    return { course, canManage: true, membershipRole: "admin" };
  }

  const membership = await dbOne(
    `SELECT role
     FROM course_memberships
     WHERE course_id = ? AND user_id = ?`,
    [courseId, user.id]
  );

  if (course.created_by === user.id && user.role === "teacher") {
    return { course, canManage: true, membershipRole: "teacher" };
  }

  if (!membership) {
    return null;
  }

  return {
    course,
    canManage: membership.role === "teacher",
    membershipRole: membership.role,
  };
}

async function getDashboardCourses(user) {
  if (user.role === "admin") {
    return dbQuery(
      `SELECT
         c.id,
         c.title,
         c.code,
         c.description,
         c.study_level,
         c.program_name,
         c.schedule_at,
         creator.full_name AS creator_name,
         (SELECT COUNT(*) FROM course_memberships cm WHERE cm.course_id = c.id AND cm.role = 'student') AS student_count,
         (SELECT COUNT(*) FROM course_materials m WHERE m.course_id = c.id) AS material_count,
         (SELECT COUNT(*) FROM quizzes q WHERE q.course_id = c.id) AS quiz_count
       FROM courses c
       JOIN users creator ON creator.id = c.created_by
       ORDER BY c.created_at DESC`
    );
  }

  if (user.role === "teacher") {
    return dbQuery(
      `SELECT DISTINCT
         c.id,
         c.title,
         c.code,
         c.description,
         c.study_level,
         c.program_name,
         c.schedule_at,
         creator.full_name AS creator_name,
         (SELECT COUNT(*) FROM course_memberships cm WHERE cm.course_id = c.id AND cm.role = 'student') AS student_count,
         (SELECT COUNT(*) FROM course_materials m WHERE m.course_id = c.id) AS material_count,
         (SELECT COUNT(*) FROM quizzes q WHERE q.course_id = c.id) AS quiz_count
       FROM courses c
       JOIN users creator ON creator.id = c.created_by
       LEFT JOIN course_memberships tm
         ON tm.course_id = c.id AND tm.role = 'teacher'
       WHERE c.created_by = ? OR tm.user_id = ?
       ORDER BY c.schedule_at IS NULL, c.schedule_at, c.created_at DESC`,
      [user.id, user.id]
    );
  }

  return dbQuery(
    `SELECT
       c.id,
       c.title,
       c.code,
       c.description,
       c.study_level,
       c.program_name,
       c.schedule_at,
       creator.full_name AS creator_name,
       (SELECT COUNT(*) FROM course_memberships cm WHERE cm.course_id = c.id AND cm.role = 'student') AS student_count,
       (SELECT COUNT(*) FROM course_materials m WHERE m.course_id = c.id) AS material_count,
       (SELECT COUNT(*) FROM quizzes q WHERE q.course_id = c.id) AS quiz_count
     FROM courses c
     JOIN users creator ON creator.id = c.created_by
     JOIN course_memberships cm
       ON cm.course_id = c.id
      AND cm.user_id = ?
      AND cm.role = 'student'
     ORDER BY c.schedule_at IS NULL, c.schedule_at, c.created_at DESC`,
    [user.id]
  );
}

async function getRecentAnnouncementsForCourses(courseIds) {
  if (!courseIds.length) {
    return [];
  }

  return dbQuery(
    `SELECT
       a.id,
       a.title,
       a.content,
       a.created_at,
       u.full_name AS author_name,
       c.title AS course_title
     FROM announcements a
     JOIN users u ON u.id = a.created_by
     JOIN courses c ON c.id = a.course_id
     WHERE a.course_id IN (?)
     ORDER BY a.created_at DESC
     LIMIT 8`,
    [courseIds]
  );
}

app.get(
  "/",
  asyncHandler(async (req, res) => {
    if (req.user) {
      res.redirect("/dashboard");
      return;
    }

    const content = `
      <section class="panel" style="max-width: 480px; margin: 0 auto;">
        <h3>Login</h3>
        <form method="post" action="/login">
          <label>
            Email
            <input type="email" name="email" placeholder="admin@example.com" required />
          </label>
          <label>
            Password
            <input type="password" name="password" placeholder="Enter your password" required />
          </label>
          <button type="submit">Sign in</button>
        </form>
      </section>`;

    res.send(
      renderPage({
        title: "University Learning Hub",
        headline: "University Learning Hub",
        subhead: "",
        content,
        query: req.query,
        headlineNoWrap: true,
      })
    );
  })
);

app.post(
  "/login",
  asyncHandler(async (req, res) => {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!email || !password) {
      res.redirect(withParams("/", { error: "Email and password are required." }));
      return;
    }

    const user = await dbOne(
      `SELECT id, full_name, email, role, password_salt, password_hash, is_active
       FROM users
       WHERE email = ?`,
      [email]
    );

    if (!user || !user.is_active || !verifyPassword(user, password)) {
      res.redirect(withParams("/", { error: "Invalid email or password." }));
      return;
    }

    const sessionToken = generateSessionToken();
    await dbQuery(
      "UPDATE users SET session_token = ?, last_seen_at = NOW() WHERE id = ?",
      [sessionToken, user.id]
    );
    setSessionCookie(res, sessionToken);
    res.redirect("/dashboard");
  })
);

app.post(
  "/logout",
  asyncHandler(async (req, res) => {
    if (req.user) {
      await dbQuery("UPDATE users SET session_token = NULL WHERE id = ?", [req.user.id]);
    }
    clearSessionCookie(res);
    res.redirect(withParams("/", { notice: "You have been signed out." }));
  })
);

app.get(
  "/dashboard",
  requireAuth,
  asyncHandler(async (req, res) => {
    const courses = await getDashboardCourses(req.user);
    const courseIds = courses.map((course) => course.id);
    const announcements = await getRecentAnnouncementsForCourses(courseIds);

    if (req.user.role === "admin") {
      const recentLogs = await getRecentOperationLogs({ limit: 14 });
      const counts = await dbQuery(
        `SELECT role, COUNT(*) AS count
         FROM users
         GROUP BY role`
      );
      const countsMap = new Map(counts.map((row) => [row.role, row.count]));
      const accountRows = await dbQuery(
        `SELECT id, full_name, email, role, display_password, last_seen_at
         FROM users
         ORDER BY FIELD(role, 'admin', 'teacher', 'student'), full_name`
      );
      const onlineUsers = await dbQuery(
        `SELECT id, full_name, email, role, last_seen_at, session_token
         FROM users
         WHERE role IN ('teacher', 'student')
         ORDER BY role, full_name`
      );

      const stats = [
        {
          label: "Teachers",
          value: countsMap.get("teacher") || 0,
          detail: "Accounts with teaching privileges",
        },
        {
          label: "Students",
          value: countsMap.get("student") || 0,
          detail: "Learners enrolled into courses",
        },
        {
          label: "Courses",
          value: courses.length,
          detail: "Courses available across the platform",
        },
        {
          label: "Online now",
          value: onlineUsers.filter(isOnline).length,
          detail: "Teacher or student sessions active in the last 5 minutes",
          valueAttributes: 'data-live-online-count',
        },
      ];

      const content = `
        ${renderStatsCards(stats)}
        ${renderPageMenu("dashboard-tabs", "people", [
          { id: "people", label: "People" },
          { id: "provisioning", label: "Provisioning" },
          { id: "curriculum", label: "Curriculum" },
          { id: "oversight", label: "Oversight" },
        ])}
        ${renderPagePanel(
          "dashboard-tabs",
          "people",
          `<section class="panel" data-filter-scope="accounts" data-linked-tab-scope="directory">
            <p class="kicker">Accounts</p>
            <h3>Directory credentials</h3>
            <div class="tab-row" data-tab-scope="directory">
              <button class="tab-button active" type="button" data-directory-tab="teacher">
                Teachers (${countsMap.get("teacher") || 0})
              </button>
              <button class="tab-button" type="button" data-directory-tab="student">
                Students (${countsMap.get("student") || 0})
              </button>
            </div>
            <div class="filter-row">
              <input type="search" placeholder="Search name or email" data-filter-search />
              <span class="filter-count" data-filter-count></span>
            </div>
            <div class="table-wrap scroll-panel">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Username</th>
                    <th>Password</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  ${accountRows
                    .map((user) => `<tr data-role="${escapeHtml(user.role)}" data-search="${escapeHtml(
                      `${user.full_name} ${user.email} ${user.role}`.toLowerCase()
                    )}">
                      <td>${escapeHtml(user.full_name)}</td>
                      <td>${escapeHtml(user.email)}</td>
                      <td><span class="mono">${escapeHtml(user.display_password || "Unavailable")}</span></td>
                      <td>${renderRolePill(user.role)}</td>
                    </tr>`)
                    .join("")}
                </tbody>
              </table>
            </div>
            <div class="pagination-row">
              <button class="button secondary" type="button" data-page-prev>Previous</button>
              <div class="pagination-group" data-page-numbers></div>
              <span class="pagination-label" data-page-label></span>
              <button class="button secondary" type="button" data-page-next>Next</button>
            </div>
          </section>

          <section class="panel" data-filter-scope="sessions" data-linked-tab-scope="directory" data-live-admin-activity data-live-endpoint="/api/admin/activity">
            <p class="kicker">Session control</p>
            <h3>Teacher and student activity</h3>
            <div class="tab-row" data-tab-scope="directory">
              <button class="tab-button active" type="button" data-directory-tab="teacher">
                Teachers (${countsMap.get("teacher") || 0})
              </button>
              <button class="tab-button" type="button" data-directory-tab="student">
                Students (${countsMap.get("student") || 0})
              </button>
            </div>
            <div class="filter-row">
              <input type="search" placeholder="Search teacher or student" data-filter-search />
              <select data-filter-status>
                <option value="all">All statuses</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </select>
              <span class="filter-count" data-filter-count></span>
            </div>
            <div class="table-wrap scroll-panel">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Last seen</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  ${onlineUsers
                    .map((user) => `<tr data-role="${escapeHtml(user.role)}" data-status="${
                      isOnline(user) ? "online" : "offline"
                    }" data-user-id="${user.id}" data-base-search="${escapeHtml(
                      `${user.full_name} ${user.email} ${user.role}`.toLowerCase()
                    )}" data-search="${escapeHtml(
                      `${user.full_name} ${user.email} ${user.role} ${isOnline(user) ? "online" : "offline"}`.toLowerCase()
                    )}">
                      <td>${escapeHtml(user.full_name)}</td>
                      <td>${renderRolePill(user.role)}</td>
                      <td>${escapeHtml(user.email)}</td>
                      <td>
                        <span class="status-badge ${isOnline(user) ? "online" : "offline"}" data-live-status>
                          ${isOnline(user) ? "Online" : "Offline"}
                        </span>
                      </td>
                      <td data-live-last-seen>${escapeHtml(formatLastSeen(user.last_seen_at))}</td>
                      <td>
                        <form method="post" action="/admin/users/${user.id}/force-logout">
                          <button class="button danger" type="submit">Force logout</button>
                        </form>
                      </td>
                    </tr>`)
                    .join("")}
                </tbody>
              </table>
            </div>
            <div class="pagination-row">
              <button class="button secondary" type="button" data-page-prev>Previous</button>
              <div class="pagination-group" data-page-numbers></div>
              <span class="pagination-label" data-page-label></span>
              <button class="button secondary" type="button" data-page-next>Next</button>
            </div>
          </section>`,
          true
        )}
        ${renderPagePanel(
          "dashboard-tabs",
          "provisioning",
          `<section class="grid two-col">
            <article class="panel">
              <p class="kicker">Admin action</p>
              <h3>Create a new user</h3>
              <form method="post" action="/admin/users">
                <label>
                  Full name
                  <input type="text" name="full_name" required />
                </label>
                <label>
                  Email
                  <input type="email" name="email" required />
                </label>
                <label>
                  Role
                  <select name="role">
                    <option value="teacher">Teacher</option>
                    <option value="student">Student</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
                <label>
                  Temporary password
                  <input type="text" name="password" placeholder="TempPass123!" required />
                </label>
                <button type="submit">Create user</button>
              </form>
            </article>

            <article class="panel">
              <p class="kicker">CSV tools</p>
              <h3>Bulk import and export</h3>
              <p class="section-meta">Use columns: full_name, email, role, password, study_level, program_name.</p>
              <div class="actions-row">
                <a class="button secondary" href="/admin/users/import-template.csv">Download template</a>
                <a class="button secondary" href="/admin/users/export.csv">Export all users</a>
              </div>
              <form method="post" action="/admin/users/import" enctype="multipart/form-data">
                <label>
                  CSV file
                  <input type="file" name="csv_file" accept=".csv,text/csv" required />
                </label>
                <button type="submit">Import users CSV</button>
              </form>
            </article>
          </section>`
        )}
        ${renderPagePanel(
          "dashboard-tabs",
          "curriculum",
          `<section class="panel" id="create-course">
            <p class="kicker">Curriculum</p>
            <h3>Create a course</h3>
            <form method="post" action="/courses">
              <label>
                Course title
                <input type="text" name="title" placeholder="Distributed Systems" required />
              </label>
              <label>
                Course code
                <input type="text" name="code" placeholder="CC-401" required />
              </label>
              <label>
                Study level
                <select name="study_level">
                  <option value="undergraduate">Undergraduate</option>
                  <option value="graduate">Graduate</option>
                </select>
              </label>
              <label>
                Programme / major
                <input type="text" name="program_name" placeholder="Computer Science and Engineering" />
              </label>
              <label>
                Schedule
                <input type="datetime-local" name="schedule_at" />
              </label>
              <label>
                Description
                <textarea name="description" placeholder="Explain what students will learn." required></textarea>
              </label>
              <button type="submit">Create course</button>
            </form>
          </section>

          <section class="panel">
            <p class="kicker">Courses</p>
            <h3>All live courses</h3>
            ${renderFilterableCourseCards(courses, "No courses created yet.", "admin-courses")}
          </section>`
        )}
        ${renderPagePanel(
          "dashboard-tabs",
          "oversight",
          `<section class="panel">
            <p class="kicker">Audit trail</p>
            <h3>Recent admin and teacher actions</h3>
            ${renderOperationLogs(
              recentLogs,
              "Admin and teacher changes will appear here once people start managing the platform."
            )}
          </section>

          <section class="panel">
            <p class="kicker">Announcements</p>
            <h3>Recent course news</h3>
            ${renderAnnouncements(announcements, "Announcements will appear here after teachers publish them.")}
          </section>`
        )}`;

      res.send(
        renderPage({
          title: "Admin Dashboard",
          user: req.user,
          headline: "Admin operations center",
          subhead: "",
          content,
          query: req.query,
          extraScripts: renderDashboardScripts(),
        })
      );
      return;
    }

    if (req.user.role === "teacher") {
      const recentLogs = await getRecentOperationLogs({ actorUserId: req.user.id, limit: 14 });
      const stats = [
        {
          label: "My courses",
          value: courses.length,
          detail: "Courses you own or manage",
        },
        {
          label: "Announcements",
          value: announcements.length,
          detail: "Recent posts across your teaching spaces",
        },
        {
          label: "Next session",
          value: courses[0] ? courses[0].code : "None",
          detail: courses[0]
            ? formatDateTime(courses[0].schedule_at)
            : "Create your first course to set a schedule",
        },
      ];

      const content = `
        ${renderStatsCards(stats)}
        ${renderPageMenu("dashboard-tabs", "courses", [
          { id: "create", label: "Create" },
          { id: "courses", label: "Courses" },
          { id: "updates", label: "Updates" },
          { id: "audit", label: "Audit" },
        ])}
        ${renderPagePanel(
          "dashboard-tabs",
          "create",
          `<section class="panel" id="create-course">
            <p class="kicker">Teaching</p>
            <h3>Create a course</h3>
            <form method="post" action="/courses">
              <label>
                Course title
                <input type="text" name="title" placeholder="Cloud Security" required />
              </label>
              <label>
                Course code
                <input type="text" name="code" placeholder="SEC-220" required />
              </label>
              <label>
                Study level
                <select name="study_level">
                  <option value="undergraduate">Undergraduate</option>
                  <option value="graduate">Graduate</option>
                </select>
              </label>
              <label>
                Programme / major
                <input type="text" name="program_name" placeholder="MSc in Software and Systems Security" />
              </label>
              <label>
                Schedule
                <input type="datetime-local" name="schedule_at" />
              </label>
              <label>
                Description
                <textarea name="description" placeholder="What will be covered in this course?" required></textarea>
              </label>
              <button type="submit">Create course</button>
            </form>
          </section>`
        )}
        ${renderPagePanel(
          "dashboard-tabs",
          "courses",
          `<section class="panel">
            <p class="kicker">Managed courses</p>
            <h3>Your classroom spaces</h3>
            ${renderFilterableCourseCards(courses, "You do not manage any courses yet.", "teacher-courses")}
          </section>`,
          true
        )}
        ${renderPagePanel(
          "dashboard-tabs",
          "updates",
          `<section class="panel">
            <p class="kicker">Announcement feed</p>
            <h3>Recent teacher updates</h3>
            ${renderAnnouncements(
              announcements,
              "Once you start posting announcements inside courses, the latest items will surface here."
            )}
          </section>`
        )}
        ${renderPagePanel(
          "dashboard-tabs",
          "audit",
          `<section class="panel">
            <p class="kicker">Audit trail</p>
            <h3>My recent actions</h3>
            ${renderOperationLogs(
              recentLogs,
              "Course updates, roster changes, and grading actions will appear here."
            )}
          </section>`
        )}`;

      res.send(
        renderPage({
          title: "Teacher Dashboard",
          user: req.user,
          headline: "Teacher Dashboard",
          subhead: "",
          content,
          query: req.query,
          extraScripts: renderDashboardScripts(),
        })
      );
      return;
    }

    const grades = await dbQuery(
      `SELECT
         g.grade_value,
         g.feedback,
         g.updated_at,
         c.title AS course_title,
         c.code AS course_code
       FROM grades g
       JOIN courses c ON c.id = g.course_id
       WHERE g.student_id = ?
       ORDER BY g.updated_at DESC`,
      [req.user.id]
    );

    const attempts = courseIds.length
      ? await dbQuery(
          `SELECT
             q.id AS quiz_id,
             q.title,
             c.code AS course_code,
             qa.correct_answers,
             qa.total_questions,
             qa.score,
             qa.submitted_at
           FROM quiz_attempts qa
           JOIN quizzes q ON q.id = qa.quiz_id
           JOIN courses c ON c.id = q.course_id
           WHERE qa.student_id = ? AND q.course_id IN (?)
           ORDER BY qa.submitted_at DESC
           LIMIT 6`,
          [req.user.id, courseIds]
        )
      : [];

    const content = `
      ${renderStatsCards([
        {
          label: "Enrolled courses",
          value: courses.length,
          detail: "Courses currently assigned to you",
        },
        {
          label: "Announcements",
          value: announcements.length,
          detail: "Recent notices from your teachers",
        },
        {
          label: "Grades posted",
          value: grades.length,
          detail: "Courses where a grade is already recorded",
        },
      ])}

      <section class="panel">
        <p class="kicker">My courses</p>
        <h3>Study spaces</h3>
        ${renderFilterableCourseCards(courses, "You are not enrolled in any courses yet.", "student-courses")}
      </section>

      <section class="grid two-col">
        <article class="panel">
          <p class="kicker">Announcements</p>
          <h3>Latest course notices</h3>
          ${renderAnnouncements(announcements, "No announcements have been posted for your courses yet.")}
        </article>

        <article class="panel">
          <p class="kicker">Recent quiz results</p>
          ${
            attempts.length
              ? `<div class="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Quiz</th>
                        <th>Course</th>
                        <th>Score</th>
                        <th>Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${attempts
                        .map(
                          (attempt) => `<tr>
                            <td>${escapeHtml(attempt.title)}</td>
                            <td>${escapeHtml(attempt.course_code)}</td>
                            <td>${escapeHtml(scoreLabel(attempt))}</td>
                            <td>${escapeHtml(formatDateTime(attempt.submitted_at))}</td>
                          </tr>`
                        )
                        .join("")}
                    </tbody>
                  </table>
                </div>`
              : `<p class="empty">Quiz submissions will appear here after you complete them.</p>`
          }
        </article>
      </section>

      <section class="panel">
        <p class="kicker">Grades</p>
        <h3>Recorded marks</h3>
        ${
          grades.length
            ? `<div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Grade</th>
                      <th>Feedback</th>
                      <th>Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${grades
                      .map(
                        (grade) => `<tr>
                          <td>${escapeHtml(`${grade.course_code} · ${grade.course_title}`)}</td>
                          <td>${escapeHtml(grade.grade_value)}</td>
                          <td>${escapeHtml(grade.feedback || "No feedback yet.")}</td>
                          <td>${escapeHtml(formatDateTime(grade.updated_at))}</td>
                        </tr>`
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>`
            : `<p class="empty">No grades have been posted yet.</p>`
        }
      </section>`;

    res.send(
      renderPage({
        title: "Student Dashboard",
        user: req.user,
        headline: "Student Dashboard",
        subhead: "",
        content,
        query: req.query,
        extraScripts: renderDashboardScripts(),
      })
    );
  })
);

app.post(
  "/admin/users",
  requireAuth,
  requireRoles("admin"),
  asyncHandler(async (req, res) => {
    const fullName = String(req.body.full_name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const role = String(req.body.role || "").trim();
    const password = String(req.body.password || "");

    if (!fullName || !email || !["admin", "teacher", "student"].includes(role) || !password) {
      res.redirect(dashboardPath("provisioning", { error: "All user fields are required." }));
      return;
    }

    const existing = await dbOne("SELECT id FROM users WHERE email = ?", [email]);
    if (existing) {
      res.redirect(dashboardPath("provisioning", { error: "That email is already in use." }));
      return;
    }

    const passwordRecord = buildPasswordRecord(password);
    await dbQuery(
      `INSERT INTO users
       (full_name, email, role, password_salt, password_hash, display_password)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [fullName, email, role, passwordRecord.salt, passwordRecord.hash, password]
    );

    await logOperation({
      actor: req.user,
      actionType: "create_user",
      targetType: "user",
      targetIdentifier: email,
      targetLabel: `${fullName} (${role})`,
      summary: `Created ${role} account ${email}.`,
    });

    res.redirect(dashboardPath("provisioning", { notice: "User account created." }));
  })
);

app.get(
  "/admin/users/import-template.csv",
  requireAuth,
  requireRoles("admin"),
  (req, res) => {
    sendCsvDownload(res, "user-import-template.csv", [
      {
        full_name: "Dr. Amelia Hart",
        email: "amelia.hart@universityhub.edu",
        role: "teacher",
        password: "Teacher123!",
        study_level: "undergraduate",
        program_name: "Computer Science and Engineering",
      },
      {
        full_name: "Mia Thompson",
        email: "mia.thompson@universityhub.edu",
        role: "student",
        password: "Student123!",
        study_level: "undergraduate",
        program_name: "Computer Science and Engineering",
      },
    ]);
  }
);

app.get(
  "/admin/users/export.csv",
  requireAuth,
  requireRoles("admin"),
  asyncHandler(async (req, res) => {
    const users = await dbQuery(
      `SELECT full_name, email, role, display_password, study_level, program_name, is_active, last_seen_at
       FROM users
       ORDER BY FIELD(role, 'admin', 'teacher', 'student'), full_name`
    );

    sendCsvDownload(
      res,
      "university-learning-hub-users.csv",
      users.map((user) => ({
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        password: user.display_password || "",
        study_level: user.study_level || "",
        program_name: user.program_name || "",
        is_active: user.is_active ? "yes" : "no",
        last_seen_at: formatCsvDateTime(user.last_seen_at),
      }))
    );
  })
);

app.post(
  "/admin/users/import",
  requireAuth,
  requireRoles("admin"),
  uploadSingleCsv,
  asyncHandler(async (req, res) => {
    if (!req.file) {
      res.redirect(dashboardPath("provisioning", { error: "Choose a CSV file to import." }));
      return;
    }

    const records = parseCsvObjects(req.file.buffer.toString("utf8"));
    if (!records.length) {
      res.redirect(dashboardPath("provisioning", { error: "The CSV file is empty." }));
      return;
    }

    let processed = 0;
    let skipped = 0;
    const issueRows = [];

    for (const record of records) {
      const fullName = String(record.full_name || record.name || "").trim();
      const email = String(record.email || record.username || "").trim().toLowerCase();
      const role = String(record.role || "").trim().toLowerCase();
      const password = String(
        record.password || record.temporary_password || record.temp_password || ""
      ).trim();
      const studyLevelRaw = String(record.study_level || record.level || "").trim().toLowerCase();
      const studyLevel = ["undergraduate", "graduate"].includes(studyLevelRaw)
        ? studyLevelRaw
        : null;
      const programName = String(
        record.program_name || record.programme || record.program || record.major || ""
      ).trim() || null;

      if (!fullName || !email || !["admin", "teacher", "student"].includes(role) || !password) {
        skipped += 1;
        if (issueRows.length < 5) {
          issueRows.push(`row ${record.__rowNumber}`);
        }
        continue;
      }

      await ensureUserAccount({
        fullName,
        email,
        role,
        password,
        studyLevel,
        programName,
      });
      processed += 1;
    }

    if (!processed) {
      const suffix = issueRows.length ? ` Check ${issueRows.join(", ")}.` : "";
      res.redirect(dashboardPath("provisioning", { error: `No valid rows were imported.${suffix}` }));
      return;
    }

    const notice = `CSV processed. ${processed} user${
      processed === 1 ? "" : "s"
    } imported or updated${skipped ? `; ${skipped} skipped` : ""}.`;

    await logOperation({
      actor: req.user,
      actionType: "import_users_csv",
      targetType: "users_csv",
      targetLabel: req.file.originalname || "users.csv",
      summary: `Imported or updated ${processed} user records${skipped ? `; ${skipped} skipped` : ""}.`,
    });

    res.redirect(dashboardPath("provisioning", { notice }));
  })
);

app.post(
  "/admin/users/:id/force-logout",
  requireAuth,
  requireRoles("admin"),
  asyncHandler(async (req, res) => {
    const targetId = Number(req.params.id);
    const targetUser = await dbOne(
      "SELECT id, full_name, email, role FROM users WHERE id = ?",
      [targetId]
    );

    if (req.user.id === targetId) {
      res.redirect(dashboardPath("people", { error: "Use the normal logout button for your own account." }));
      return;
    }

    if (!targetUser) {
      res.redirect(dashboardPath("people", { error: "That account no longer exists." }));
      return;
    }

    await dbQuery("UPDATE users SET session_token = NULL WHERE id = ?", [targetId]);

    await logOperation({
      actor: req.user,
      actionType: "force_logout",
      targetType: "user_session",
      targetIdentifier: targetUser.email,
      targetLabel: `${targetUser.full_name} (${targetUser.role})`,
      summary: `Forced logout for ${targetUser.email}.`,
    });

    res.redirect(dashboardPath("people", { notice: "User session cleared." }));
  })
);

app.get(
  "/api/admin/activity",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.user.role !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const users = await dbQuery(
      `SELECT id, role, last_seen_at, session_token
       FROM users
       WHERE role IN ('teacher', 'student')
       ORDER BY role, full_name`
    );

    res.json({
      online_count: users.filter(isOnline).length,
      users: users.map((user) => ({
        id: user.id,
        role: user.role,
        is_online: isOnline(user),
        last_seen_at: user.last_seen_at,
      })),
    });
  })
);

app.post(
  "/courses",
  requireAuth,
  requireRoles("admin", "teacher"),
  asyncHandler(async (req, res) => {
    const title = String(req.body.title || "").trim();
    const code = String(req.body.code || "").trim().toUpperCase();
    const description = String(req.body.description || "").trim();
    const studyLevel = ["undergraduate", "graduate"].includes(String(req.body.study_level || "").trim())
      ? String(req.body.study_level || "").trim()
      : null;
    const programName = String(req.body.program_name || "").trim() || null;
    const scheduleAt = normalizeDateTimeInput(req.body.schedule_at);
    const courseDashboardTab = req.user.role === "admin" ? "curriculum" : "create";

    if (!title || !code || !description) {
      res.redirect(dashboardPath(courseDashboardTab, { error: "Course title, code, and description are required." }));
      return;
    }

    const result = await dbQuery(
      `INSERT INTO courses
       (title, code, description, study_level, program_name, schedule_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, code, description, studyLevel, programName, scheduleAt, req.user.id]
    );

    const courseId = result.insertId;

    if (req.user.role === "teacher") {
      await dbQuery(
        `INSERT IGNORE INTO course_memberships (course_id, user_id, role)
         VALUES (?, ?, 'teacher')`,
        [courseId, req.user.id]
      );
    }

    await logOperation({
      actor: req.user,
      actionType: "create_course",
      targetType: "course",
      targetIdentifier: String(courseId),
      targetLabel: `${code} · ${title}`,
      course: {
        id: courseId,
        code,
        title,
      },
      summary: `Created course ${code}.`,
    });

    res.redirect(coursePath(courseId, "manage", { notice: "Course created." }));
  })
);

app.get(
  "/courses/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const context = await getAccessibleCourse(req.user, Number(req.params.id));
    if (!context) {
      res.redirect(withParams("/dashboard", { error: "You do not have access to that course." }));
      return;
    }

    const { course, canManage } = context;

    const [students, materials, announcements, quizzes, teacherMemberships] = await Promise.all([
      dbQuery(
        `SELECT u.id, u.full_name, u.email, u.last_seen_at, u.session_token
         FROM users u
         JOIN course_memberships cm
           ON cm.user_id = u.id
          AND cm.course_id = ?
          AND cm.role = 'student'
         ORDER BY u.full_name`,
        [course.id]
      ),
      dbQuery(
        `SELECT m.id, m.title, m.file_name, m.created_at, u.full_name AS uploaded_by_name
         FROM course_materials m
         JOIN users u ON u.id = m.uploaded_by
         WHERE m.course_id = ?
         ORDER BY m.created_at DESC`,
        [course.id]
      ),
      dbQuery(
        `SELECT a.id, a.title, a.content, a.created_at, u.full_name AS author_name
         FROM announcements a
         JOIN users u ON u.id = a.created_by
         WHERE a.course_id = ?
         ORDER BY a.created_at DESC`,
        [course.id]
      ),
      dbQuery(
        `SELECT
           q.id,
           q.title,
           q.description,
           q.due_at,
           q.created_at,
           (SELECT COUNT(*) FROM quiz_questions qq WHERE qq.quiz_id = q.id) AS question_count,
           (SELECT COUNT(*) FROM quiz_attempts qa WHERE qa.quiz_id = q.id) AS attempt_count,
           ? AS course_code
         FROM quizzes q
         WHERE q.course_id = ?
         ORDER BY q.created_at DESC`,
        [course.code, course.id]
      ),
      dbQuery(
        `SELECT u.id, u.full_name, u.email, u.role
         FROM users u
         JOIN course_memberships cm
           ON cm.user_id = u.id
          AND cm.course_id = ?
          AND cm.role = 'teacher'
         ORDER BY u.full_name`,
        [course.id]
      ),
    ]);

    const teacherNames = teacherMemberships.length
      ? teacherMemberships.map((row) => row.full_name)
      : [course.creator_name];

    const availableStudents = canManage
      ? await dbQuery(
          `SELECT u.id, u.full_name, u.email
           FROM users u
           WHERE u.role = 'student'
             AND u.id NOT IN (
               SELECT user_id
               FROM course_memberships
               WHERE course_id = ? AND role = 'student'
             )
           ORDER BY u.full_name`,
          [course.id]
        )
      : [];

    const gradeRows = canManage
      ? await dbQuery(
          `SELECT
             u.id AS student_id,
             u.full_name,
             u.email,
             g.grade_value,
             g.feedback,
             g.updated_at
           FROM users u
           JOIN course_memberships cm
             ON cm.user_id = u.id
            AND cm.course_id = ?
            AND cm.role = 'student'
           LEFT JOIN grades g
             ON g.course_id = ? AND g.student_id = u.id
           ORDER BY u.full_name`,
          [course.id, course.id]
        )
      : await dbQuery(
          `SELECT grade_value, feedback, updated_at
           FROM grades
           WHERE course_id = ? AND student_id = ?`,
          [course.id, req.user.id]
        );

    const attemptRows =
      req.user.role === "student"
        ? await dbQuery(
            `SELECT quiz_id, correct_answers, total_questions, score, submitted_at
             FROM quiz_attempts
             WHERE student_id = ? AND quiz_id IN (
               SELECT id FROM quizzes WHERE course_id = ?
             )`,
            [req.user.id, course.id]
          )
        : [];

    const attemptMap = new Map(attemptRows.map((attempt) => [attempt.quiz_id, attempt]));

    const assignments = canManage
      ? await dbQuery(
          `SELECT
             a.id,
             a.title,
             a.description,
             a.due_at,
             a.created_at,
             ? AS course_code,
             (SELECT COUNT(*) FROM assignment_submissions submission WHERE submission.assignment_id = a.id) AS submission_count,
             (SELECT COUNT(*) FROM course_memberships cm WHERE cm.course_id = a.course_id AND cm.role = 'student') AS student_count
           FROM assignments a
           WHERE a.course_id = ?
           ORDER BY a.created_at DESC`,
          [course.code, course.id]
        )
      : await dbQuery(
          `SELECT
             a.id,
             a.title,
             a.description,
             a.due_at,
             a.created_at,
             ? AS course_code,
             submission.id AS submission_id,
             submission.file_name AS submission_file_name,
             submission.submitted_at,
             submission.grade_value,
             submission.feedback,
             submission.graded_at
           FROM assignments a
           LEFT JOIN assignment_submissions submission
             ON submission.assignment_id = a.id AND submission.student_id = ?
           WHERE a.course_id = ?
           ORDER BY a.created_at DESC`,
          [course.code, req.user.id, course.id]
        );

    const publicMessages = await dbQuery(
      `SELECT
         message.id,
         message.body,
         message.created_at,
         message.attachment_file_name,
         sender.full_name AS sender_name
       FROM course_messages message
       JOIN users sender ON sender.id = message.sender_user_id
       WHERE message.course_id = ? AND message.recipient_user_id IS NULL
       ORDER BY message.created_at DESC
       LIMIT 15`,
      [course.id]
    );

    const directMessages = await dbQuery(
      `SELECT
         message.id,
         message.body,
         message.created_at,
         message.attachment_file_name,
         message.sender_user_id,
         message.recipient_user_id,
         sender.full_name AS sender_name,
         sender.email AS sender_email,
         sender.role AS sender_role,
         recipient.full_name AS recipient_name,
         recipient.email AS recipient_email,
         recipient.role AS recipient_role
       FROM course_messages message
       JOIN users sender ON sender.id = message.sender_user_id
       LEFT JOIN users recipient ON recipient.id = message.recipient_user_id
       WHERE message.course_id = ?
         AND message.recipient_user_id IS NOT NULL
         AND (message.sender_user_id = ? OR message.recipient_user_id = ?)
       ORDER BY message.created_at DESC
       LIMIT 120`,
      [course.id, req.user.id, req.user.id]
    );

    const directRecipients = await getCourseMessageRecipients(req.user, context);
    const directConversationSummaries = summarizeDirectMessageThreads(directMessages, req.user.id);

    const managePanels = canManage
      ? `
        <section class="grid two-col">
          <article class="panel">
            <p class="kicker">Course settings</p>
            <h3>Update the course profile</h3>
            <form method="post" action="/courses/${course.id}/settings">
              <label>
                Title
                <input type="text" name="title" value="${escapeHtml(course.title)}" required />
              </label>
              <label>
                Code
                <input type="text" name="code" value="${escapeHtml(course.code)}" required />
              </label>
              <label>
                Study level
                <select name="study_level">
                  <option value="undergraduate" ${course.study_level === "undergraduate" ? "selected" : ""}>Undergraduate</option>
                  <option value="graduate" ${course.study_level === "graduate" ? "selected" : ""}>Graduate</option>
                </select>
              </label>
              <label>
                Programme / major
                <input type="text" name="program_name" value="${escapeHtml(course.program_name || "")}" />
              </label>
              <label>
                Schedule
                <input type="datetime-local" name="schedule_at" value="${escapeHtml(
                  formatDateInputValue(course.schedule_at)
                )}" />
              </label>
              <label>
                Description
                <textarea name="description" required>${escapeHtml(course.description)}</textarea>
              </label>
              <button type="submit">Save course details</button>
            </form>
          </article>

          <article class="panel">
            <p class="kicker">Enrollment</p>
            <h3>Add students to this course</h3>
            <p class="section-meta">Use manual selection, import a roster CSV, or batch unenroll students with an email list.</p>
            ${
              availableStudents.length
                ? `<form method="post" action="/courses/${course.id}/enrollments">
                    <label>
                      Student
                      <select name="student_id">
                        ${availableStudents
                          .map(
                            (student) =>
                              `<option value="${student.id}">${escapeHtml(
                                `${student.full_name} · ${student.email}`
                              )}</option>`
                          )
                          .join("")}
                      </select>
                    </label>
                    <button type="submit">Enroll student</button>
                  </form>`
                : `<p class="empty">All current student accounts are already enrolled here.</p>`
            }
            <div class="actions-row">
              <a class="button secondary" href="/courses/${course.id}/enrollments-template.csv">Download roster template</a>
              <a class="button secondary" href="/courses/${course.id}/unenrollments-template.csv">Download unenrollment template</a>
            </div>
            <form method="post" action="/courses/${course.id}/enrollments/import" enctype="multipart/form-data">
              <label>
                CSV file
                <input type="file" name="csv_file" accept=".csv,text/csv" required />
              </label>
              <button type="submit">Import enrollments CSV</button>
            </form>
            <form method="post" action="/courses/${course.id}/unenrollments/import" enctype="multipart/form-data">
              <label>
                CSV file
                <input type="file" name="csv_file" accept=".csv,text/csv" required />
              </label>
              <button type="submit">Import unenrollments CSV</button>
            </form>
          </article>
        </section>`
      : "";

    const contentCreationPanels = canManage
      ? `
        <section class="grid two-col">
          <article class="panel">
            <p class="kicker">Materials</p>
            <h3>Upload courseware to S3</h3>
            <form method="post" action="/courses/${course.id}/materials" enctype="multipart/form-data">
              <label>
                Display title
                <input type="text" name="title" placeholder="Week 1 lecture deck" />
              </label>
              <label>
                File
                <input type="file" name="material" required />
              </label>
              <button type="submit">Upload file</button>
            </form>
          </article>

          <article class="panel">
            <p class="kicker">Announcements</p>
            <h3>Publish a notice</h3>
            <form method="post" action="/courses/${course.id}/announcements">
              <label>
                Title
                <input type="text" name="title" placeholder="Tomorrow's lecture moved online" required />
              </label>
              <label>
                Message
                <textarea name="content" placeholder="Write the announcement for students." required></textarea>
              </label>
              <button type="submit">Post announcement</button>
            </form>
          </article>
        </section>

        <section class="panel">
          <p class="kicker">Assessment builder</p>
          <h3>Create a quiz</h3>
          <form method="post" action="/courses/${course.id}/quizzes" id="quiz-builder-form">
            <label>
              Quiz title
              <input type="text" name="title" placeholder="Quiz 1: AWS fundamentals" required />
            </label>
            <label>
              Description
              <textarea name="description" placeholder="Tell students what this quiz covers." required></textarea>
            </label>
            <label>
              Due date
              <input type="datetime-local" name="due_at" />
            </label>
            <div class="stack" id="question-list">
              ${renderQuestionFields(1)}
            </div>
            <div class="actions-row">
              <button type="button" class="button secondary" id="add-question-button">Add another question</button>
              <button type="submit">Create quiz</button>
            </div>
          </form>
        </section>`
      : "";

    const studentsGradesPanels = canManage
      ? `
        <section class="grid two-col">
          <article class="panel">
            <p class="kicker">Roster</p>
            <h3>Student activity</h3>
            <p class="section-meta">Monitor current presence and export the roster for offline review.</p>
            ${
              students.length
                ? `<div class="actions-row">
                    <a class="button secondary" href="/courses/${course.id}/students.csv">Export roster CSV</a>
                  </div>
                  <div data-course-filter-scope="student-activity" data-live-course-activity data-live-endpoint="/api/courses/${course.id}/activity">
                    <div class="filter-row">
                      <input type="search" placeholder="Search student name or email" data-course-filter-search />
                      <select data-course-filter-status>
                        <option value="all">All statuses</option>
                        <option value="online">Online</option>
                        <option value="offline">Offline</option>
                      </select>
                      <select data-course-filter-sort>
                        <option value="name-asc">Name A-Z</option>
                        <option value="name-desc">Name Z-A</option>
                        <option value="status-online-first">Online first</option>
                        <option value="last-seen-newest">Recently seen</option>
                        <option value="last-seen-oldest">Least recent</option>
                      </select>
                      <span class="filter-count" data-course-filter-count></span>
                    </div>
                    <div class="table-wrap scroll-panel">
                      <table>
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Status</th>
                            <th>Last seen</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          ${students
                            .map((student) => {
                              const status = isOnline(student) ? "online" : "offline";
                              return `<tr data-user-id="${student.id}" data-status="${status}" data-base-search="${escapeHtml(
                                `${student.full_name} ${student.email}`.toLowerCase()
                              )}" data-search="${escapeHtml(
                                `${student.full_name} ${student.email} ${status}`.toLowerCase()
                              )}" data-sort-name="${escapeHtml(sortTextValue(student.full_name))}" data-sort-status-rank="${
                                status === "online" ? "1" : "0"
                              }" data-sort-lastseen="${escapeHtml(sortTimestampValue(student.last_seen_at))}" data-sort-email="${escapeHtml(
                                sortTextValue(student.email)
                              )}">
                                <td>${escapeHtml(student.full_name)}</td>
                                <td>${escapeHtml(student.email)}</td>
                                <td>
                                  <span class="status-badge ${status}" data-live-status>
                                    ${status === "online" ? "Online" : "Offline"}
                                  </span>
                                </td>
                                <td data-live-last-seen>${escapeHtml(formatLastSeen(student.last_seen_at))}</td>
                                <td>
                                  <form class="inline-form" method="post" action="/courses/${course.id}/enrollments/${student.id}/delete" onsubmit="return confirm('Remove this student from the course?');">
                                    <button class="button danger" type="submit">Remove</button>
                                  </form>
                                </td>
                              </tr>`;
                            })
                            .join("")}
                        </tbody>
                      </table>
                    </div>
                  </div>`
                : `<p class="empty">No students are enrolled in this course yet.</p>`
            }
          </article>

          <article class="panel">
            <p class="kicker">Grades</p>
            <h3>Record or update grades</h3>
            <p class="section-meta">Save one grade manually or import a gradebook CSV with email, grade, and feedback columns.</p>
            ${
              students.length
                ? `<form method="post" action="/courses/${course.id}/grades">
                    <label>
                      Student
                      <select name="student_id">
                        ${students
                          .map(
                            (student) =>
                              `<option value="${student.id}">${escapeHtml(student.full_name)}</option>`
                          )
                          .join("")}
                      </select>
                    </label>
                    <label>
                      Grade
                      <input type="text" name="grade_value" placeholder="A, 92, Pass" required />
                    </label>
                    <label>
                      Feedback
                      <textarea name="feedback" placeholder="Optional teacher feedback"></textarea>
                    </label>
                    <button type="submit">Save grade</button>
                  </form>`
                : `<p class="empty">Enroll a student first to start grading.</p>`
            }
            <div class="actions-row">
              <a class="button secondary" href="/courses/${course.id}/grades-template.csv">Download grade template</a>
            </div>
            <form method="post" action="/courses/${course.id}/grades/import" enctype="multipart/form-data">
              <label>
                CSV file
                <input type="file" name="csv_file" accept=".csv,text/csv" required />
              </label>
              <button type="submit">Import grades CSV</button>
            </form>
          </article>
        </section>`
      : "";

    const gradesSection = canManage
      ? `<section class="panel">
          <p class="kicker">Gradebook</p>
          <h3>Course grades</h3>
          <p class="section-meta">Search the gradebook or switch between graded and not graded students.</p>
          ${
            gradeRows.length
              ? `<div class="actions-row">
                  <a class="button secondary" href="/courses/${course.id}/grades.csv">Export grades CSV</a>
                </div>
                <div data-course-filter-scope="course-grades">
                  <div class="filter-row">
                    <input type="search" placeholder="Search student, email, or grade" data-course-filter-search />
                    <select data-course-filter-status>
                      <option value="all">All results</option>
                      <option value="graded">Graded</option>
                      <option value="ungraded">Not graded</option>
                    </select>
                    <span class="filter-count" data-course-filter-count></span>
                  </div>
                  <div class="table-wrap scroll-panel">
                    <table>
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Email</th>
                          <th>Grade</th>
                          <th>Feedback</th>
                          <th>Updated</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${gradeRows
                          .map((grade) => {
                            const gradeStatus = grade.grade_value ? "graded" : "ungraded";
                            return `<tr data-status="${gradeStatus}" data-search="${escapeHtml(
                              `${grade.full_name} ${grade.email} ${grade.grade_value || "not graded"} ${
                                grade.feedback || ""
                              }`.toLowerCase()
                            )}">
                              <td>${escapeHtml(grade.full_name)}</td>
                              <td>${escapeHtml(grade.email)}</td>
                              <td>${escapeHtml(grade.grade_value || "Not graded")}</td>
                              <td>${escapeHtml(grade.feedback || "No feedback yet.")}</td>
                              <td>${escapeHtml(
                                grade.updated_at ? formatDateTime(grade.updated_at) : "Never"
                              )}</td>
                            </tr>`;
                          })
                          .join("")}
                      </tbody>
                    </table>
                  </div>
                </div>`
              : `<p class="empty">The gradebook is empty because no students are enrolled yet.</p>`
          }
        </section>`
      : `<section class="panel">
          <p class="kicker">My grade</p>
          <h3>Course outcome</h3>
          ${
            gradeRows.length
              ? `<div class="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Grade</th>
                        <th>Feedback</th>
                        <th>Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${gradeRows
                        .map(
                          (grade) => `<tr>
                            <td>${escapeHtml(grade.grade_value)}</td>
                            <td>${escapeHtml(grade.feedback || "No feedback yet.")}</td>
                            <td>${escapeHtml(formatDateTime(grade.updated_at))}</td>
                          </tr>`
                        )
                        .join("")}
                    </tbody>
                  </table>
                </div>`
              : `<p class="empty">No grade has been posted for this course yet.</p>`
          }
        </section>`;

    const assignmentsPanel = `
      ${
        canManage
          ? `<section class="panel">
              <p class="kicker">Assignment builder</p>
              <h3>Create an assignment</h3>
              <p class="section-meta">Assignment files are uploaded by students into S3, while due dates, grades, and feedback are stored in RDS.</p>
              <form method="post" action="/courses/${course.id}/assignments">
                <label>
                  Assignment title
                  <input type="text" name="title" placeholder="Assignment 1: Cloud architecture report" required />
                </label>
                <label>
                  Description
                  <textarea name="description" placeholder="Explain the brief, deliverables, and marking criteria." required></textarea>
                </label>
                <label>
                  Due date
                  <input type="datetime-local" name="due_at" />
                </label>
                <button type="submit">Create assignment</button>
              </form>
            </section>`
          : `<section class="panel">
              <p class="kicker">Assignment workflow</p>
              <h3>Submit coursework to cloud storage</h3>
              <p class="section-meta">Open an assignment to upload your file to S3 and review grades and feedback saved in RDS.</p>
            </section>`
      }

      <section class="panel">
        <p class="kicker">Assignments</p>
        <h3>${canManage ? "Submission tracking and grading" : "Open assignments and my submissions"}</h3>
        ${renderAssignmentCards(
          assignments,
          canManage
            ? "Create the first assignment for this course."
            : "No assignments have been posted for this course yet.",
          { canManage, enableSearch: true, scopeName: `assignments-${course.id}` }
        )}
      </section>`;

    const messagesPanel = `
      <section class="grid two-col">
        <article class="panel">
          <p class="kicker">Public channel</p>
          <h3>Course discussion board</h3>
          <p class="section-meta">Public discussion messages stay in RDS and optional attachments are stored in S3.</p>
          <form method="post" action="/courses/${course.id}/messages/public" enctype="multipart/form-data">
            <label>
              Message
              <textarea name="body" placeholder="Share an update, ask a question, or post a quick clarification."></textarea>
            </label>
            <label>
              Attachment
              <input type="file" name="attachment_file" />
            </label>
            <button type="submit">Post to course chat</button>
          </form>
          ${renderMessageFeed(
            publicMessages,
            "No public discussion messages have been posted yet.",
            { scroll: true }
          )}
        </article>

        <article class="panel">
          <p class="kicker">Private chat</p>
          <h3>${canManage ? "Direct messages with teachers and students" : "Private messages with teachers"}</h3>
          ${
            directRecipients.length
              ? `<form method="post" action="/courses/${course.id}/messages/direct" enctype="multipart/form-data">
                  <label>
                    Recipient
                    <select name="recipient_user_id">
                      ${directRecipients
                        .map(
                          (recipient) =>
                            `<option value="${recipient.id}">${escapeHtml(
                              `${recipient.full_name} · ${recipient.email}`
                            )}</option>`
                        )
                        .join("")}
                    </select>
                  </label>
                  <label>
                    Message
                    <textarea name="body" placeholder="Start a private conversation here."></textarea>
                  </label>
                  <label>
                    Attachment
                    <input type="file" name="attachment_file" />
                  </label>
                  <button type="submit">Send private message</button>
                </form>`
              : `<p class="empty">No valid private-message recipients are available for this course.</p>`
          }
          ${renderDirectConversationCards(
            directConversationSummaries,
            "No private conversations have been started yet.",
            course.id
          )}
        </article>
      </section>`;

    const overviewPanel = `
      <section class="grid course-hero-grid">
        <article class="panel compact-panel">
          <p class="kicker">Code</p>
          <h3>${escapeHtml(course.code)}</h3>
          <p class="helper">${escapeHtml(
            [course.study_level ? studyLevelLabel(course.study_level) : "", course.program_name]
              .filter(Boolean)
              .join(" · ")
          )}</p>
          <p>${escapeHtml(course.description)}</p>
        </article>
        <article class="panel compact-panel">
          <p class="kicker">Schedule</p>
          <h3>${escapeHtml(formatDateTime(course.schedule_at))}</h3>
          <p>Lead teacher: ${escapeHtml(teacherNames.join(", "))}</p>
        </article>
        <article class="panel compact-panel">
          <p class="kicker">Activity</p>
          <h3>${students.length} students</h3>
          <p>${materials.length} files · ${announcements.length} announcements · ${quizzes.length} quizzes · ${assignments.length} assignments</p>
        </article>
      </section>`;

    const courseContentSections = `
      <section class="grid two-col">
        <details class="panel collapsible-panel" open>
          <summary>
            <div class="collapsible-header">
              <div>
                <p class="kicker">Course files</p>
                <h3>Materials and downloadable courseware</h3>
              </div>
              <span class="collapsible-icon">›</span>
            </div>
          </summary>
          <div class="collapsible-body">
            ${renderMaterials(
              materials,
              canManage
                ? "Upload the first course file to make it available to students."
                : "No materials have been published for this course yet.",
              { canManage, courseId: course.id, enableSearch: true, scopeName: `materials-${course.id}` }
            )}
          </div>
        </details>

        <details class="panel collapsible-panel" open>
          <summary>
            <div class="collapsible-header">
              <div>
                <p class="kicker">Announcement board</p>
                <h3>Latest notices</h3>
              </div>
              <span class="collapsible-icon">›</span>
            </div>
          </summary>
          <div class="collapsible-body">
            ${renderAnnouncements(
              announcements.map((announcement) => ({
                ...announcement,
                course_title: "",
              })),
              "No announcements have been posted for this course yet.",
              { canManage, courseId: course.id, enableSearch: true, scopeName: `announcements-${course.id}` }
            )}
          </div>
        </details>
      </section>

      <details class="panel collapsible-panel" open>
        <summary>
          <div class="collapsible-header">
            <div>
              <p class="kicker">Quizzes</p>
              <h3>Assessments for this course</h3>
            </div>
            <span class="collapsible-icon">›</span>
          </div>
        </summary>
        <div class="collapsible-body">
          ${renderQuizCards(
            quizzes,
            attemptMap,
            canManage
              ? "Build the first quiz for this course using the form above."
              : "No quizzes are available yet.",
            { canManage, courseId: course.id, enableSearch: true, scopeName: `quizzes-${course.id}` }
          )}
        </div>
      </details>
    `;

    const content = canManage
      ? `
        ${renderPageMenu("course-tabs", "overview", [
          { id: "overview", label: "Overview" },
          { id: "manage", label: "Manage" },
          { id: "students-grades", label: "Students & Grades" },
          { id: "content", label: "Content" },
          { id: "assignments", label: "Assignments" },
          { id: "messages", label: "Messages" },
        ])}
        ${renderPagePanel("course-tabs", "overview", overviewPanel, true)}
        ${renderPagePanel("course-tabs", "manage", managePanels)}
        ${renderPagePanel("course-tabs", "students-grades", `${studentsGradesPanels}${gradesSection}`)}
        ${renderPagePanel(
          "course-tabs",
          "content",
          `${contentCreationPanels}
          <div class="section-controls">
            <button class="button secondary" type="button" data-expand-all>Expand all</button>
            <button class="button secondary" type="button" data-collapse-all>Collapse all</button>
          </div>
          ${courseContentSections}`
        )}
        ${renderPagePanel("course-tabs", "assignments", assignmentsPanel)}
        ${renderPagePanel("course-tabs", "messages", messagesPanel)}`
      : `
        ${renderPageMenu("course-tabs", "overview", [
          { id: "overview", label: "Overview" },
          { id: "content", label: "Content" },
          { id: "assignments", label: "Assignments" },
          { id: "messages", label: "Messages" },
          { id: "grade", label: "Grade" },
        ])}
        ${renderPagePanel("course-tabs", "overview", overviewPanel, true)}
        ${renderPagePanel(
          "course-tabs",
          "content",
          `<div class="section-controls">
            <button class="button secondary" type="button" data-expand-all>Expand all</button>
            <button class="button secondary" type="button" data-collapse-all>Collapse all</button>
          </div>
          ${courseContentSections}`
        )}
        ${renderPagePanel("course-tabs", "assignments", assignmentsPanel)}
        ${renderPagePanel("course-tabs", "messages", messagesPanel)}
        ${renderPagePanel("course-tabs", "grade", gradesSection)}`;

    const extraScripts = `${canManage ? `<template id="question-template">${renderQuestionFields("__INDEX__")}</template>` : ""}
      <script>
        (function () {
          const expandAllButton = document.querySelector('[data-expand-all]');
          const collapseAllButton = document.querySelector('[data-collapse-all]');
          const collapsiblePanels = Array.from(document.querySelectorAll('.collapsible-panel'));

          function compareStrings(left, right) {
            return String(left || '').localeCompare(String(right || ''));
          }

          function compareNumbers(left, right, direction) {
            const leftValue = Number(left);
            const rightValue = Number(right);
            const leftMissing =
              left === '' || left === null || left === undefined || Number.isNaN(leftValue);
            const rightMissing =
              right === '' || right === null || right === undefined || Number.isNaN(rightValue);
            if (leftMissing && rightMissing) return 0;
            if (leftMissing) return 1;
            if (rightMissing) return -1;
            const delta = leftValue - rightValue;
            return direction === 'desc' ? -delta : delta;
          }

          function setupCourseTableFilters(scope) {
            const searchInput = scope.querySelector('[data-course-filter-search]');
            const statusSelect = scope.querySelector('[data-course-filter-status]');
            const sortSelect = scope.querySelector('[data-course-filter-sort]');
            const countNode = scope.querySelector('[data-course-filter-count]');
            const rows = Array.from(scope.querySelectorAll('tbody tr'));
            const rowContainer = scope.querySelector('tbody');

            function compareTableRows(left, right, sortValue) {
              switch (sortValue) {
                case 'name-desc':
                  return compareStrings(
                    right.getAttribute('data-sort-name'),
                    left.getAttribute('data-sort-name')
                  );
                case 'status-online-first': {
                  const statusDelta = compareNumbers(
                    left.getAttribute('data-sort-status-rank'),
                    right.getAttribute('data-sort-status-rank'),
                    'desc'
                  );
                  return (
                    statusDelta ||
                    compareStrings(
                      left.getAttribute('data-sort-name'),
                      right.getAttribute('data-sort-name')
                    )
                  );
                }
                case 'last-seen-newest': {
                  const seenDelta = compareNumbers(
                    left.getAttribute('data-sort-lastseen'),
                    right.getAttribute('data-sort-lastseen'),
                    'desc'
                  );
                  return (
                    seenDelta ||
                    compareStrings(
                      left.getAttribute('data-sort-name'),
                      right.getAttribute('data-sort-name')
                    )
                  );
                }
                case 'last-seen-oldest': {
                  const seenDelta = compareNumbers(
                    left.getAttribute('data-sort-lastseen'),
                    right.getAttribute('data-sort-lastseen'),
                    'asc'
                  );
                  return (
                    seenDelta ||
                    compareStrings(
                      left.getAttribute('data-sort-name'),
                      right.getAttribute('data-sort-name')
                    )
                  );
                }
                case 'name-asc':
                default:
                  return compareStrings(
                    left.getAttribute('data-sort-name'),
                    right.getAttribute('data-sort-name')
                  );
              }
            }

            function applyFilters() {
              const searchValue = (searchInput ? searchInput.value : '').trim().toLowerCase();
              const statusValue = statusSelect ? statusSelect.value : 'all';
              const sortValue = sortSelect ? sortSelect.value : 'name-asc';
              let visibleCount = 0;

              if (rowContainer && sortSelect) {
                rows
                  .slice()
                  .sort(function (left, right) {
                    return compareTableRows(left, right, sortValue);
                  })
                  .forEach(function (row) {
                    rowContainer.appendChild(row);
                  });
              }

              rows.forEach(function (row) {
                const rowSearch = row.getAttribute('data-search') || '';
                const rowStatus = row.getAttribute('data-status') || '';
                const matchesSearch = !searchValue || rowSearch.indexOf(searchValue) !== -1;
                const matchesStatus = statusValue === 'all' || rowStatus === statusValue;
                const shouldShow = matchesSearch && matchesStatus;
                row.hidden = !shouldShow;
                if (shouldShow) {
                  visibleCount += 1;
                }
              });

              if (countNode) {
                countNode.textContent = 'Showing ' + visibleCount + ' matches';
              }
              if (typeof window.__applyUiLocale === "function") {
                window.__applyUiLocale(scope);
              }
            }

            if (searchInput) {
              searchInput.addEventListener('input', applyFilters);
            }
            if (statusSelect) {
              statusSelect.addEventListener('change', applyFilters);
            }
            if (sortSelect) {
              sortSelect.addEventListener('change', applyFilters);
            }
            scope.__applyFilters = applyFilters;
            applyFilters();
          }

          function formatBrowserDateTime(value, fallback) {
            if (!value) return fallback;
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) return fallback;
            return new Intl.DateTimeFormat('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
              timeZone: 'Europe/Berlin',
            }).format(date);
          }

          function setupCourseActivityAutoRefresh() {
            document.querySelectorAll('[data-live-course-activity]').forEach(function (scope) {
              const endpoint = scope.getAttribute('data-live-endpoint');
              if (!endpoint) return;

              async function refreshActivity() {
                try {
                  const response = await fetch(endpoint, {
                    headers: { Accept: 'application/json' },
                    credentials: 'same-origin',
                  });
                  if (!response.ok) return;

                  const payload = await response.json();
                  const usersById = new Map((payload.students || []).map(function (user) {
                    return [String(user.id), user];
                  }));

                  Array.from(scope.querySelectorAll('tbody tr[data-user-id]')).forEach(function (row) {
                    const user = usersById.get(row.getAttribute('data-user-id'));
                    if (!user) return;

                    const status = user.is_online ? 'online' : 'offline';
                    row.setAttribute('data-status', status);
                    row.setAttribute('data-sort-status-rank', user.is_online ? '1' : '0');
                    row.setAttribute('data-sort-lastseen', user.last_seen_at ? String(new Date(user.last_seen_at).getTime()) : '');
                    row.setAttribute(
                      'data-search',
                      ((row.getAttribute('data-base-search') || '') + ' ' + status).trim()
                    );

                    const badge = row.querySelector('[data-live-status]');
                    if (badge) {
                      badge.className = 'status-badge ' + status;
                      badge.textContent = status === 'online' ? 'Online' : 'Offline';
                    }

                    const lastSeen = row.querySelector('[data-live-last-seen]');
                    if (lastSeen) {
                      lastSeen.textContent = formatBrowserDateTime(user.last_seen_at, 'Never');
                    }
                  });

                  if (typeof scope.__applyFilters === 'function') {
                    scope.__applyFilters();
                  }
                  if (typeof window.__applyUiLocale === "function") {
                    window.__applyUiLocale(scope);
                  }
                } catch (error) {
                }
              }

              refreshActivity();
              window.setInterval(refreshActivity, 20000);
            });
          }

          function setupContentPagination(scope) {
            const searchInput = scope.querySelector('[data-content-search]');
            const sortSelect = scope.querySelector('[data-content-sort]');
            const countNode = scope.querySelector('[data-content-count]');
            const prevButton = scope.querySelector('[data-content-page-prev]');
            const nextButton = scope.querySelector('[data-content-page-next]');
            const pageLabel = scope.querySelector('[data-content-page-label]');
            const pageNumbers = scope.querySelector('[data-content-page-numbers]');
            const items = Array.from(scope.querySelectorAll('[data-content-item]'));
            const listNode = scope.querySelector('[data-content-list]');
            const pageSize = Math.max(1, Number(scope.getAttribute('data-content-page-size') || 6));

            function compareContentItems(left, right, sortValue) {
              switch (sortValue) {
                case 'oldest':
                  return compareNumbers(
                    left.getAttribute('data-sort-created'),
                    right.getAttribute('data-sort-created'),
                    'asc'
                  );
                case 'title-asc':
                  return compareStrings(
                    left.getAttribute('data-sort-title'),
                    right.getAttribute('data-sort-title')
                  );
                case 'author-asc':
                  return compareStrings(
                    left.getAttribute('data-sort-author'),
                    right.getAttribute('data-sort-author')
                  );
                case 'uploader-asc':
                  return compareStrings(
                    left.getAttribute('data-sort-uploader'),
                    right.getAttribute('data-sort-uploader')
                  );
                case 'due-soonest':
                  return compareNumbers(
                    left.getAttribute('data-sort-due'),
                    right.getAttribute('data-sort-due'),
                    'asc'
                  );
                case 'due-latest':
                  return compareNumbers(
                    left.getAttribute('data-sort-due'),
                    right.getAttribute('data-sort-due'),
                    'desc'
                  );
                case 'attempts-most': {
                  const attemptDelta = compareNumbers(
                    left.getAttribute('data-sort-attempts'),
                    right.getAttribute('data-sort-attempts'),
                    'desc'
                  );
                  return (
                    attemptDelta ||
                    compareStrings(
                      left.getAttribute('data-sort-title'),
                      right.getAttribute('data-sort-title')
                    )
                  );
                }
                case 'newest':
                default:
                  return compareNumbers(
                    left.getAttribute('data-sort-created'),
                    right.getAttribute('data-sort-created'),
                    'desc'
                  );
              }
            }

            function applyFilters() {
              const searchValue = (searchInput ? searchInput.value : '').trim().toLowerCase();
              const sortValue = sortSelect ? sortSelect.value : 'newest';

              if (listNode && sortSelect) {
                items
                  .slice()
                  .sort(function (left, right) {
                    return compareContentItems(left, right, sortValue);
                  })
                  .forEach(function (item) {
                    listNode.appendChild(item);
                  });
              }

              const matchingItems = items.filter(function (item) {
                const itemSearch = item.getAttribute('data-search') || '';
                return !searchValue || itemSearch.indexOf(searchValue) !== -1;
              });

              const totalCount = matchingItems.length;
              const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
              const currentPage = Math.min(Number(scope.getAttribute('data-page') || 1), totalPages);
              scope.setAttribute('data-page', String(currentPage));

              items.forEach(function (item) {
                item.hidden = true;
              });

              const startIndex = (currentPage - 1) * pageSize;
              matchingItems.slice(startIndex, startIndex + pageSize).forEach(function (item) {
                item.hidden = false;
              });

              if (countNode) {
                countNode.textContent = 'Showing ' + totalCount + ' matches';
              }
              if (pageLabel) {
                pageLabel.textContent = totalCount === 0 ? 'Page 0 of 0' : 'Page ' + currentPage + ' of ' + totalPages;
              }
              if (pageNumbers) {
                pageNumbers.innerHTML = '';
                if (totalCount > 0) {
                  for (let pageIndex = 1; pageIndex <= totalPages; pageIndex += 1) {
                    const button = document.createElement('button');
                    button.type = 'button';
                    button.className = 'page-number-button' + (pageIndex === currentPage ? ' active' : '');
                    button.textContent = String(pageIndex);
                    button.addEventListener('click', function () {
                      scope.setAttribute('data-page', String(pageIndex));
                      applyFilters();
                    });
                    pageNumbers.appendChild(button);
                  }
                }
              }
              if (prevButton) {
                prevButton.disabled = currentPage <= 1;
              }
              if (nextButton) {
                nextButton.disabled = currentPage >= totalPages;
              }
              if (typeof window.__applyUiLocale === "function") {
                window.__applyUiLocale(scope);
              }
            }

            if (searchInput) {
              searchInput.addEventListener('input', function () {
                scope.setAttribute('data-page', '1');
                applyFilters();
              });
            }
            if (sortSelect) {
              sortSelect.addEventListener('change', function () {
                scope.setAttribute('data-page', '1');
                applyFilters();
              });
            }
            if (prevButton) {
              prevButton.addEventListener('click', function () {
                const nextPage = Math.max(1, Number(scope.getAttribute('data-page') || 1) - 1);
                scope.setAttribute('data-page', String(nextPage));
                applyFilters();
              });
            }
            if (nextButton) {
              nextButton.addEventListener('click', function () {
                const nextPage = Number(scope.getAttribute('data-page') || 1) + 1;
                scope.setAttribute('data-page', String(nextPage));
                applyFilters();
              });
            }
            scope.setAttribute('data-page', '1');
            applyFilters();
          }

          if (expandAllButton) {
            expandAllButton.addEventListener('click', function () {
              collapsiblePanels.forEach(function (panel) {
                panel.open = true;
              });
            });
          }

          if (collapseAllButton) {
            collapseAllButton.addEventListener('click', function () {
              collapsiblePanels.forEach(function (panel) {
                panel.open = false;
              });
            });
          }

          document.querySelectorAll('[data-course-filter-scope]').forEach(function (scope) {
            setupCourseTableFilters(scope);
          });
          document.querySelectorAll('[data-content-scope]').forEach(function (scope) {
            setupContentPagination(scope);
          });
          setupCourseActivityAutoRefresh();

          ${canManage ? `
          const addButton = document.getElementById("add-question-button");
          const list = document.getElementById("question-list");
          const template = document.getElementById("question-template");
          if (addButton && list && template) {
            let index = 2;
            addButton.addEventListener("click", function () {
              const html = template.innerHTML.replace(/__INDEX__/g, String(index));
              const wrapper = document.createElement("div");
              wrapper.innerHTML = html.trim();
              list.appendChild(wrapper.firstElementChild);
              index += 1;
            });
          }
          ` : ""}
        })();
      </script>`;

    res.send(
      renderPage({
        title: course.title,
        user: req.user,
        headline: course.title,
        subhead: "",
        content,
        query: req.query,
        extraScripts,
      })
    );
  })
);

app.get(
  "/courses/:id/students.csv",
  requireAuth,
  requireRoles("admin", "teacher"),
  asyncHandler(async (req, res) => {
    const context = await getAccessibleCourse(req.user, Number(req.params.id));
    if (!context || !context.canManage) {
      res.redirect(withParams("/dashboard", { error: "You cannot export that roster." }));
      return;
    }

    const students = await dbQuery(
      `SELECT u.id, u.full_name, u.email, u.last_seen_at, u.session_token
       FROM users u
       JOIN course_memberships cm
         ON cm.user_id = u.id
        AND cm.course_id = ?
        AND cm.role = 'student'
       ORDER BY u.full_name`,
      [context.course.id]
    );

    sendCsvDownload(
      res,
      `${slugify(context.course.code || context.course.title)}-roster.csv`,
      students.map((student) => ({
        student_name: student.full_name,
        email: student.email,
        status: isOnline(student) ? "Online" : "Offline",
        last_seen_at: formatCsvDateTime(student.last_seen_at),
      }))
    );
  })
);

app.get(
  "/courses/:id/grades.csv",
  requireAuth,
  requireRoles("admin", "teacher"),
  asyncHandler(async (req, res) => {
    const context = await getAccessibleCourse(req.user, Number(req.params.id));
    if (!context || !context.canManage) {
      res.redirect(withParams("/dashboard", { error: "You cannot export that gradebook." }));
      return;
    }

    const gradeRows = await dbQuery(
      `SELECT
         u.full_name,
         u.email,
         g.grade_value,
         g.feedback,
         g.updated_at
       FROM users u
       JOIN course_memberships cm
         ON cm.user_id = u.id
        AND cm.course_id = ?
        AND cm.role = 'student'
       LEFT JOIN grades g
         ON g.course_id = ? AND g.student_id = u.id
       ORDER BY u.full_name`,
      [context.course.id, context.course.id]
    );

    sendCsvDownload(
      res,
      `${slugify(context.course.code || context.course.title)}-grades.csv`,
      gradeRows.map((grade) => ({
        student_name: grade.full_name,
        email: grade.email,
        grade: grade.grade_value || "Not graded",
        grade_status: grade.grade_value ? "Graded" : "Not graded",
        feedback: grade.feedback || "",
        updated_at: formatCsvDateTime(grade.updated_at),
      }))
    );
  })
);

app.get(
  "/api/courses/:id/activity",
  requireAuth,
  asyncHandler(async (req, res) => {
    const context = await getAccessibleCourse(req.user, Number(req.params.id));
    if (!context || !context.canManage) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const students = await dbQuery(
      `SELECT u.id, u.last_seen_at, u.session_token
       FROM users u
       JOIN course_memberships cm
         ON cm.user_id = u.id
        AND cm.course_id = ?
        AND cm.role = 'student'
       ORDER BY u.full_name`,
      [context.course.id]
    );

    res.json({
      students: students.map((student) => ({
        id: student.id,
        is_online: isOnline(student),
        last_seen_at: student.last_seen_at,
      })),
    });
  })
);

app.get(
  "/courses/:id/enrollments-template.csv",
  requireAuth,
  requireRoles("admin", "teacher"),
  asyncHandler(async (req, res) => {
    const context = await getAccessibleCourse(req.user, Number(req.params.id));
    if (!context || !context.canManage) {
      res.redirect(withParams("/dashboard", { error: "You cannot export that template." }));
      return;
    }

    sendCsvDownload(res, `${slugify(context.course.code || context.course.title)}-enrollments-template.csv`, [
      { email: "mia.thompson@universityhub.edu" },
    ]);
  })
);

app.post(
  "/courses/:id/enrollments/import",
  requireAuth,
  requireRoles("admin", "teacher"),
  uploadSingleCsv,
  asyncHandler(async (req, res) => {
    const context = await getAccessibleCourse(req.user, Number(req.params.id));
    if (!context || !context.canManage) {
      res.redirect(withParams("/dashboard", { error: "You cannot import enrollments for that course." }));
      return;
    }

    if (!req.file) {
      res.redirect(coursePath(context.course.id, "manage", { error: "Choose a CSV file to import." }));
      return;
    }

    const records = parseCsvObjects(req.file.buffer.toString("utf8"));
    if (!records.length) {
      res.redirect(coursePath(context.course.id, "manage", { error: "The CSV file is empty." }));
      return;
    }

    let processed = 0;
    let inserted = 0;
    let skipped = 0;

    for (const record of records) {
      const email = String(record.email || record.student_email || "").trim().toLowerCase();
      if (!email) {
        skipped += 1;
        continue;
      }

      const student = await dbOne("SELECT id FROM users WHERE email = ? AND role = 'student'", [email]);
      if (!student) {
        skipped += 1;
        continue;
      }

      const result = await dbQuery(
        `INSERT IGNORE INTO course_memberships (course_id, user_id, role)
         VALUES (?, ?, 'student')`,
        [context.course.id, student.id]
      );

      processed += 1;
      if (result.affectedRows) {
        inserted += 1;
      }
    }

    await logOperation({
      actor: req.user,
      actionType: "import_enrollments_csv",
      targetType: "enrollments_csv",
      targetLabel: req.file.originalname || "enrollments.csv",
      course: context.course,
      summary: `Imported ${inserted} enrollments into ${context.course.code}${skipped ? `; ${skipped} skipped` : ""}.`,
    });

    res.redirect(
      coursePath(context.course.id, "manage", {
        notice: `Enrollment CSV processed. ${inserted} student${inserted === 1 ? "" : "s"} added${
          skipped ? `; ${skipped} skipped` : ""
        }.`,
      })
    );
  })
);

app.get(
  "/courses/:id/unenrollments-template.csv",
  requireAuth,
  requireRoles("admin", "teacher"),
  asyncHandler(async (req, res) => {
    const context = await getAccessibleCourse(req.user, Number(req.params.id));
    if (!context || !context.canManage) {
      res.redirect(withParams("/dashboard", { error: "You cannot export that template." }));
      return;
    }

    sendCsvDownload(res, `${slugify(context.course.code || context.course.title)}-unenrollments-template.csv`, [
      { email: "mia.thompson@universityhub.edu" },
    ]);
  })
);

app.post(
  "/courses/:id/unenrollments/import",
  requireAuth,
  requireRoles("admin", "teacher"),
  uploadSingleCsv,
  asyncHandler(async (req, res) => {
    const context = await getAccessibleCourse(req.user, Number(req.params.id));
    if (!context || !context.canManage) {
      res.redirect(withParams("/dashboard", { error: "You cannot batch unenroll students for that course." }));
      return;
    }

    if (!req.file) {
      res.redirect(coursePath(context.course.id, "manage", { error: "Choose a CSV file to import." }));
      return;
    }

    const records = parseCsvObjects(req.file.buffer.toString("utf8"));
    if (!records.length) {
      res.redirect(coursePath(context.course.id, "manage", { error: "The CSV file is empty." }));
      return;
    }

    let removed = 0;
    let skipped = 0;

    for (const record of records) {
      const email = String(record.email || record.student_email || "").trim().toLowerCase();
      if (!email) {
        skipped += 1;
        continue;
      }

      const student = await dbOne(
        `SELECT u.id
         FROM users u
         JOIN course_memberships cm
           ON cm.user_id = u.id
          AND cm.course_id = ?
          AND cm.role = 'student'
         WHERE u.email = ?`,
        [context.course.id, email]
      );

      if (!student) {
        skipped += 1;
        continue;
      }

      removed += await removeStudentFromCourse(context.course.id, student.id);
    }

    await logOperation({
      actor: req.user,
      actionType: "import_unenrollments_csv",
      targetType: "unenrollments_csv",
      targetLabel: req.file.originalname || "unenrollments.csv",
      course: context.course,
      summary: `Removed ${removed} students from ${context.course.code}${skipped ? `; ${skipped} skipped` : ""}.`,
    });

    res.redirect(
      coursePath(context.course.id, "manage", {
        notice: `Unenrollment CSV processed. ${removed} student${removed === 1 ? "" : "s"} removed${
          skipped ? `; ${skipped} skipped` : ""
        }.`,
      })
    );
  })
);

app.get(
  "/courses/:id/grades-template.csv",
  requireAuth,
  requireRoles("admin", "teacher"),
  asyncHandler(async (req, res) => {
    const context = await getAccessibleCourse(req.user, Number(req.params.id));
    if (!context || !context.canManage) {
      res.redirect(withParams("/dashboard", { error: "You cannot export that template." }));
      return;
    }

    sendCsvDownload(res, `${slugify(context.course.code || context.course.title)}-grades-template.csv`, [
      {
        email: "mia.thompson@universityhub.edu",
        grade: "A",
        feedback: "Strong first submission.",
      },
    ]);
  })
);

app.post(
  "/courses/:id/grades/import",
  requireAuth,
  requireRoles("admin", "teacher"),
  uploadSingleCsv,
  asyncHandler(async (req, res) => {
    const context = await getAccessibleCourse(req.user, Number(req.params.id));
    if (!context || !context.canManage) {
      res.redirect(withParams("/dashboard", { error: "You cannot import grades for that course." }));
      return;
    }

    if (!req.file) {
      res.redirect(coursePath(context.course.id, "students-grades", { error: "Choose a CSV file to import." }));
      return;
    }

    const records = parseCsvObjects(req.file.buffer.toString("utf8"));
    if (!records.length) {
      res.redirect(coursePath(context.course.id, "students-grades", { error: "The CSV file is empty." }));
      return;
    }

    let updated = 0;
    let skipped = 0;

    for (const record of records) {
      const email = String(record.email || record.student_email || "").trim().toLowerCase();
      const gradeValue = String(record.grade || record.grade_value || "").trim();
      const feedback = String(record.feedback || "").trim();

      if (!email || !gradeValue) {
        skipped += 1;
        continue;
      }

      const enrolledStudent = await dbOne(
        `SELECT u.id
         FROM users u
         JOIN course_memberships cm
           ON cm.user_id = u.id
          AND cm.course_id = ?
          AND cm.role = 'student'
         WHERE u.email = ?`,
        [context.course.id, email]
      );

      if (!enrolledStudent) {
        skipped += 1;
        continue;
      }

      await dbQuery(
        `INSERT INTO grades
         (course_id, student_id, teacher_id, grade_value, feedback)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           teacher_id = VALUES(teacher_id),
           grade_value = VALUES(grade_value),
           feedback = VALUES(feedback),
           updated_at = CURRENT_TIMESTAMP`,
        [context.course.id, enrolledStudent.id, req.user.id, gradeValue, feedback || null]
      );
      updated += 1;
    }

    await logOperation({
      actor: req.user,
      actionType: "import_grades_csv",
      targetType: "grades_csv",
      targetLabel: req.file.originalname || "grades.csv",
      course: context.course,
      summary: `Imported ${updated} grades into ${context.course.code}${skipped ? `; ${skipped} skipped` : ""}.`,
    });

    res.redirect(
      coursePath(context.course.id, "students-grades", {
        notice: `Grades CSV processed. ${updated} row${updated === 1 ? "" : "s"} saved${
          skipped ? `; ${skipped} skipped` : ""
        }.`,
      })
    );
  })
);

app.get(
  "/courses/:courseId/materials/:materialId/edit",
  requireAuth,
  requireRoles("admin", "teacher"),
  asyncHandler(async (req, res) => {
    const editable = await getEditableMaterial(req.user, Number(req.params.courseId), Number(req.params.materialId));
    if (!editable) {
      res.redirect(withParams("/dashboard", { error: "You cannot edit that file." }));
      return;
    }

    const { context, material } = editable;
    const content = `
      <section class="panel">
        <p class="kicker">File</p>
        <h3>Edit course file</h3>
        <p class="section-meta">Update the display title or optionally replace the uploaded file.</p>
        <form method="post" action="/courses/${context.course.id}/materials/${material.id}/edit" enctype="multipart/form-data">
          <label>
            Display title
            <input type="text" name="title" value="${escapeHtml(material.title)}" required />
          </label>
          <label>
            Replace file
            <input type="file" name="material" />
          </label>
          <div class="actions-row">
            <button type="submit">Save file changes</button>
            <a class="button secondary" href="${coursePath(context.course.id, "content")}">Back to course</a>
          </div>
        </form>
      </section>

      <section class="panel">
        <p class="kicker">Danger zone</p>
        <h3>Delete this file</h3>
        <form method="post" action="/courses/${context.course.id}/materials/${material.id}/delete" onsubmit="return confirm('Delete this file?');">
          <button class="button danger" type="submit">Delete file</button>
        </form>
      </section>`;

    res.send(
      renderPage({
        title: "Edit file",
        user: req.user,
        headline: material.title,
        subhead: "",
        content,
        query: req.query,
      })
    );
  })
);

app.post(
  "/courses/:courseId/materials/:materialId/edit",
  requireAuth,
  requireRoles("admin", "teacher"),
  uploadSingleMaterial,
  asyncHandler(async (req, res) => {
    const editable = await getEditableMaterial(req.user, Number(req.params.courseId), Number(req.params.materialId));
    if (!editable) {
      res.redirect(withParams("/dashboard", { error: "You cannot edit that file." }));
      return;
    }

    const { context, material } = editable;
    const title = String(req.body.title || "").trim();
    if (!title) {
      res.redirect(withParams(`/courses/${context.course.id}/materials/${material.id}/edit`, { error: "File title is required." }));
      return;
    }

    let fileName = material.file_name;
    let contentType = material.content_type;
    if (req.file) {
      if (!s3Client || !bucketName) {
        res.redirect(withParams(`/courses/${context.course.id}/materials/${material.id}/edit`, { error: "S3 is not configured." }));
        return;
      }

      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: material.s3_key,
          Body: req.file.buffer,
          ContentType: req.file.mimetype || "application/octet-stream",
        })
      );
      fileName = req.file.originalname;
      contentType = req.file.mimetype || null;
    }

    await dbQuery(
      `UPDATE course_materials
       SET title = ?, file_name = ?, content_type = ?
       WHERE id = ? AND course_id = ?`,
      [title, fileName, contentType, material.id, context.course.id]
    );

    await logOperation({
      actor: req.user,
      actionType: "edit_material",
      targetType: "material",
      targetIdentifier: String(material.id),
      targetLabel: title,
      course: context.course,
      summary: `Updated course file "${title}" in ${context.course.code}.`,
    });

    res.redirect(coursePath(context.course.id, "content", { notice: "Course file updated." }));
  })
);

app.post(
  "/courses/:courseId/materials/:materialId/delete",
  requireAuth,
  requireRoles("admin", "teacher"),
  asyncHandler(async (req, res) => {
    const editable = await getEditableMaterial(req.user, Number(req.params.courseId), Number(req.params.materialId));
    if (!editable) {
      res.redirect(withParams("/dashboard", { error: "You cannot delete that file." }));
      return;
    }

    const { context, material } = editable;
    if (s3Client && bucketName) {
      try {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: bucketName,
            Key: material.s3_key,
          })
        );
      } catch (error) {
      }
    }

    await dbQuery("DELETE FROM course_materials WHERE id = ? AND course_id = ?", [material.id, context.course.id]);

    await logOperation({
      actor: req.user,
      actionType: "delete_material",
      targetType: "material",
      targetIdentifier: String(material.id),
      targetLabel: material.title,
      course: context.course,
      summary: `Deleted course file "${material.title}" from ${context.course.code}.`,
    });

    res.redirect(coursePath(context.course.id, "content", { notice: "Course file deleted." }));
  })
);

app.get(
  "/courses/:courseId/announcements/:announcementId/edit",
  requireAuth,
  requireRoles("admin", "teacher"),
  asyncHandler(async (req, res) => {
    const editable = await getEditableAnnouncement(
      req.user,
      Number(req.params.courseId),
      Number(req.params.announcementId)
    );
    if (!editable) {
      res.redirect(withParams("/dashboard", { error: "You cannot edit that announcement." }));
      return;
    }

    const { context, announcement } = editable;
    const content = `
      <section class="panel">
        <p class="kicker">Announcement</p>
        <h3>Edit notice</h3>
        <form method="post" action="/courses/${context.course.id}/announcements/${announcement.id}/edit">
          <label>
            Title
            <input type="text" name="title" value="${escapeHtml(announcement.title)}" required />
          </label>
          <label>
            Message
            <textarea name="content" required>${escapeHtml(announcement.content)}</textarea>
          </label>
          <div class="actions-row">
            <button type="submit">Save announcement</button>
            <a class="button secondary" href="${coursePath(context.course.id, "content")}">Back to course</a>
          </div>
        </form>
      </section>

      <section class="panel">
        <p class="kicker">Danger zone</p>
        <h3>Delete this announcement</h3>
        <form method="post" action="/courses/${context.course.id}/announcements/${announcement.id}/delete" onsubmit="return confirm('Delete this announcement?');">
          <button class="button danger" type="submit">Delete announcement</button>
        </form>
      </section>`;

    res.send(
      renderPage({
        title: "Edit announcement",
        user: req.user,
        headline: announcement.title,
        subhead: "",
        content,
        query: req.query,
      })
    );
  })
);

app.post(
  "/courses/:courseId/announcements/:announcementId/edit",
  requireAuth,
  requireRoles("admin", "teacher"),
  asyncHandler(async (req, res) => {
    const editable = await getEditableAnnouncement(
      req.user,
      Number(req.params.courseId),
      Number(req.params.announcementId)
    );
    if (!editable) {
      res.redirect(withParams("/dashboard", { error: "You cannot edit that announcement." }));
      return;
    }

    const { context, announcement } = editable;
    const title = String(req.body.title || "").trim();
    const content = String(req.body.content || "").trim();

    if (!title || !content) {
      res.redirect(withParams(`/courses/${context.course.id}/announcements/${announcement.id}/edit`, { error: "Announcement title and message are required." }));
      return;
    }

    await dbQuery(
      `UPDATE announcements
       SET title = ?, content = ?
       WHERE id = ? AND course_id = ?`,
      [title, content, announcement.id, context.course.id]
    );

    await logOperation({
      actor: req.user,
      actionType: "edit_announcement",
      targetType: "announcement",
      targetIdentifier: String(announcement.id),
      targetLabel: title,
      course: context.course,
      summary: `Updated announcement "${title}" in ${context.course.code}.`,
    });

    res.redirect(coursePath(context.course.id, "content", { notice: "Announcement updated." }));
  })
);

app.post(
  "/courses/:courseId/announcements/:announcementId/delete",
  requireAuth,
  requireRoles("admin", "teacher"),
  asyncHandler(async (req, res) => {
    const editable = await getEditableAnnouncement(
      req.user,
      Number(req.params.courseId),
      Number(req.params.announcementId)
    );
    if (!editable) {
      res.redirect(withParams("/dashboard", { error: "You cannot delete that announcement." }));
      return;
    }

    const { context, announcement } = editable;
    await dbQuery("DELETE FROM announcements WHERE id = ? AND course_id = ?", [announcement.id, context.course.id]);

    await logOperation({
      actor: req.user,
      actionType: "delete_announcement",
      targetType: "announcement",
      targetIdentifier: String(announcement.id),
      targetLabel: announcement.title,
      course: context.course,
      summary: `Deleted announcement "${announcement.title}" from ${context.course.code}.`,
    });

    res.redirect(coursePath(context.course.id, "content", { notice: "Announcement deleted." }));
  })
);

app.get(
  "/courses/:courseId/quizzes/:quizId/edit",
  requireAuth,
  requireRoles("admin", "teacher"),
  asyncHandler(async (req, res) => {
    const editable = await getEditableQuiz(req.user, Number(req.params.courseId), Number(req.params.quizId));
    if (!editable) {
      res.redirect(withParams("/dashboard", { error: "You cannot edit that quiz." }));
      return;
    }

    const { context, quiz, questions } = editable;
    const content = `
      <section class="panel">
        <p class="kicker">Quiz</p>
        <h3>Edit assessment</h3>
        ${
          quiz.attempt_count
            ? `<p class="section-meta">This quiz already has submissions. Saving updated questions will reset existing attempts.</p>`
            : ""
        }
        <form method="post" action="${quizEditPath(context.course.id, quiz.id)}" id="quiz-editor-form">
          <label>
            Quiz title
            <input type="text" name="title" value="${escapeHtml(quiz.title)}" required />
          </label>
          <label>
            Description
            <textarea name="description" required>${escapeHtml(quiz.description)}</textarea>
          </label>
          <label>
            Due date
            <input type="datetime-local" name="due_at" value="${escapeHtml(formatDateInputValue(quiz.due_at))}" />
          </label>
          <div class="stack" id="question-list">
            ${(questions.length ? questions : [{}]).map((question, index) => renderQuestionFields(index + 1, question)).join("")}
          </div>
          <div class="actions-row">
            <button type="button" class="button secondary" id="add-question-button">Add another question</button>
            <button type="submit">Save quiz</button>
            <a class="button secondary" href="${coursePath(context.course.id, "content")}">Back to course</a>
          </div>
        </form>
      </section>

      <section class="panel">
        <p class="kicker">Danger zone</p>
        <h3>Delete this quiz</h3>
        <form method="post" action="/courses/${context.course.id}/quizzes/${quiz.id}/delete" onsubmit="return confirm('Delete this quiz?');">
          <button class="button danger" type="submit">Delete quiz</button>
        </form>
      </section>`;

    const extraScripts = `<template id="question-template">${renderQuestionFields("__INDEX__")}</template>
      <script>
        (function () {
          const addButton = document.getElementById("add-question-button");
          const list = document.getElementById("question-list");
          const template = document.getElementById("question-template");
          if (addButton && list && template) {
            let index = ${Math.max(questions.length, 1) + 1};
            addButton.addEventListener("click", function () {
              const html = template.innerHTML.replace(/__INDEX__/g, String(index));
              const wrapper = document.createElement("div");
              wrapper.innerHTML = html.trim();
              list.appendChild(wrapper.firstElementChild);
              index += 1;
            });
          }
        })();
      </script>`;

    res.send(
      renderPage({
        title: "Edit quiz",
        user: req.user,
        headline: quiz.title,
        subhead: "",
        content,
        query: req.query,
        extraScripts,
      })
    );
  })
);

app.post(
  "/courses/:courseId/quizzes/:quizId/edit",
  requireAuth,
  requireRoles("admin", "teacher"),
  asyncHandler(async (req, res) => {
    const editable = await getEditableQuiz(req.user, Number(req.params.courseId), Number(req.params.quizId));
    if (!editable) {
      res.redirect(withParams("/dashboard", { error: "You cannot edit that quiz." }));
      return;
    }

    const { context, quiz } = editable;
    const quizPayload = parseQuizForm(req.body);
    const validationError = validateQuizPayload(quizPayload);
    if (validationError) {
      res.redirect(withParams(quizEditPath(context.course.id, quiz.id), { error: validationError }));
      return;
    }

    await replaceQuizContents({
      quizId: quiz.id,
      courseId: context.course.id,
      teacherId: req.user.id,
      title: quizPayload.title,
      description: quizPayload.description,
      dueAt: quizPayload.dueAt,
      questions: quizPayload.questions,
    });

    await logOperation({
      actor: req.user,
      actionType: "edit_quiz",
      targetType: "quiz",
      targetIdentifier: String(quiz.id),
      targetLabel: quizPayload.title,
      course: context.course,
      summary: `Updated quiz "${quizPayload.title}" in ${context.course.code}.`,
    });

    res.redirect(coursePath(context.course.id, "content", { notice: "Quiz updated." }));
  })
);

app.post(
  "/courses/:courseId/quizzes/:quizId/delete",
  requireAuth,
  requireRoles("admin", "teacher"),
  asyncHandler(async (req, res) => {
    const editable = await getEditableQuiz(req.user, Number(req.params.courseId), Number(req.params.quizId));
    if (!editable) {
      res.redirect(withParams("/dashboard", { error: "You cannot delete that quiz." }));
      return;
    }

    const { context, quiz } = editable;
    await dbQuery("DELETE FROM quizzes WHERE id = ? AND course_id = ?", [quiz.id, context.course.id]);

    await logOperation({
      actor: req.user,
      actionType: "delete_quiz",
      targetType: "quiz",
      targetIdentifier: String(quiz.id),
      targetLabel: quiz.title,
      course: context.course,
      summary: `Deleted quiz "${quiz.title}" from ${context.course.code}.`,
    });

    res.redirect(coursePath(context.course.id, "content", { notice: "Quiz deleted." }));
  })
);

function renderQuestionFields(index, values = {}) {
  return `<section class="question-card">
    <h4>Question ${escapeHtml(index)}</h4>
    <label>
      Question text
      <textarea name="question_text[]" placeholder="What is Amazon RDS used for?" required>${escapeHtml(
        values.question_text || values.questionText || ""
      )}</textarea>
    </label>
    <div class="grid two-col">
      <label>
        Option A
        <input type="text" name="option_a[]" value="${escapeHtml(values.option_a || values.optionA || "")}" required />
      </label>
      <label>
        Option B
        <input type="text" name="option_b[]" value="${escapeHtml(values.option_b || values.optionB || "")}" required />
      </label>
      <label>
        Option C
        <input type="text" name="option_c[]" value="${escapeHtml(values.option_c || values.optionC || "")}" required />
      </label>
      <label>
        Option D
        <input type="text" name="option_d[]" value="${escapeHtml(values.option_d || values.optionD || "")}" required />
      </label>
    </div>
    <label>
      Correct option
      <select name="correct_option[]">
        <option value="A" ${(values.correct_option || values.correctOption || "A") === "A" ? "selected" : ""}>A</option>
        <option value="B" ${(values.correct_option || values.correctOption || "A") === "B" ? "selected" : ""}>B</option>
        <option value="C" ${(values.correct_option || values.correctOption || "A") === "C" ? "selected" : ""}>C</option>
        <option value="D" ${(values.correct_option || values.correctOption || "A") === "D" ? "selected" : ""}>D</option>
      </select>
    </label>
  </section>`;
}

app.post(
  "/courses/:id/settings",
  requireAuth,
  requireRoles("admin", "teacher"),
  asyncHandler(async (req, res) => {
    const context = await getAccessibleCourse(req.user, Number(req.params.id));
    if (!context || !context.canManage) {
      res.redirect(withParams("/dashboard", { error: "You cannot edit that course." }));
      return;
    }

    const title = String(req.body.title || "").trim();
    const code = String(req.body.code || "").trim().toUpperCase();
    const description = String(req.body.description || "").trim();
    const studyLevel = ["undergraduate", "graduate"].includes(String(req.body.study_level || "").trim())
      ? String(req.body.study_level || "").trim()
      : null;
    const programName = String(req.body.program_name || "").trim() || null;
    const scheduleAt = normalizeDateTimeInput(req.body.schedule_at);

    if (!title || !code || !description) {
      res.redirect(coursePath(context.course.id, "manage", { error: "Course title, code, and description are required." }));
      return;
    }

    await dbQuery(
      `UPDATE courses
       SET title = ?, code = ?, description = ?, study_level = ?, program_name = ?, schedule_at = ?
       WHERE id = ?`,
      [title, code, description, studyLevel, programName, scheduleAt, context.course.id]
    );

    await logOperation({
      actor: req.user,
      actionType: "update_course",
      targetType: "course",
      targetIdentifier: String(context.course.id),
      targetLabel: `${code} · ${title}`,
      course: {
        id: context.course.id,
        code,
        title,
      },
      summary: `Updated course settings for ${code}.`,
    });

    res.redirect(coursePath(context.course.id, "manage", { notice: "Course details updated." }));
  })
);

app.post(
  "/courses/:id/enrollments",
  requireAuth,
  requireRoles("admin", "teacher"),
  asyncHandler(async (req, res) => {
    const context = await getAccessibleCourse(req.user, Number(req.params.id));
    if (!context || !context.canManage) {
      res.redirect(withParams("/dashboard", { error: "You cannot enroll students into that course." }));
      return;
    }

    const studentId = Number(req.body.student_id);
    const student = await dbOne(
      "SELECT id, full_name, email FROM users WHERE id = ? AND role = 'student'",
      [studentId]
    );
    if (!student) {
      res.redirect(coursePath(context.course.id, "manage", { error: "Selected account is not a student." }));
      return;
    }

    await dbQuery(
      `INSERT IGNORE INTO course_memberships (course_id, user_id, role)
       VALUES (?, ?, 'student')`,
      [context.course.id, studentId]
    );

    await logOperation({
      actor: req.user,
      actionType: "enroll_student",
      targetType: "student",
      targetIdentifier: student.email,
      targetLabel: student.full_name,
      course: context.course,
      summary: `Enrolled ${student.email} into ${context.course.code}.`,
    });

    res.redirect(coursePath(context.course.id, "manage", { notice: "Student enrolled." }));
  })
);

app.post(
  "/courses/:id/enrollments/:studentId/delete",
  requireAuth,
  requireRoles("admin", "teacher"),
  asyncHandler(async (req, res) => {
    const context = await getAccessibleCourse(req.user, Number(req.params.id));
    if (!context || !context.canManage) {
      res.redirect(withParams("/dashboard", { error: "You cannot remove students from that course." }));
      return;
    }

    const studentId = Number(req.params.studentId);
    const enrolledStudent = await dbOne(
      `SELECT u.id, u.full_name, u.email
       FROM course_memberships cm
       JOIN users u ON u.id = cm.user_id
       WHERE cm.course_id = ? AND cm.user_id = ? AND cm.role = 'student'`,
      [context.course.id, studentId]
    );

    if (!enrolledStudent) {
      res.redirect(coursePath(context.course.id, "students-grades", { error: "That student is not enrolled in this course." }));
      return;
    }

    await removeStudentFromCourse(context.course.id, studentId);

    await logOperation({
      actor: req.user,
      actionType: "remove_student",
      targetType: "student",
      targetIdentifier: enrolledStudent.email,
      targetLabel: enrolledStudent.full_name,
      course: context.course,
      summary: `Removed ${enrolledStudent.email} from ${context.course.code}.`,
    });

    res.redirect(coursePath(context.course.id, "students-grades", { notice: "Student removed from the course." }));
  })
);

app.post(
  "/courses/:id/materials",
  requireAuth,
  requireRoles("admin", "teacher"),
  uploadSingleMaterial,
  asyncHandler(async (req, res) => {
    const context = await getAccessibleCourse(req.user, Number(req.params.id));
    if (!context || !context.canManage) {
      res.redirect(withParams("/dashboard", { error: "You cannot upload materials for that course." }));
      return;
    }

    if (!s3Client || !bucketName) {
      res.redirect(coursePath(context.course.id, "content", { error: "S3 is not configured." }));
      return;
    }

    if (!req.file) {
      res.redirect(coursePath(context.course.id, "content", { error: "Choose a file to upload." }));
      return;
    }

    const title = String(req.body.title || "").trim() || req.file.originalname;
    const extension = path.extname(req.file.originalname);
    const baseName = slugify(path.basename(req.file.originalname, extension));
    const s3Key = `courses/${context.course.id}/materials/${Date.now()}-${baseName}${extension}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype || "application/octet-stream",
      })
    );

    const materialResult = await dbQuery(
      `INSERT INTO course_materials
       (course_id, title, file_name, content_type, s3_key, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        context.course.id,
        title,
        req.file.originalname,
        req.file.mimetype || null,
        s3Key,
        req.user.id,
      ]
    );

    await logOperation({
      actor: req.user,
      actionType: "upload_material",
      targetType: "material",
      targetIdentifier: String(materialResult.insertId),
      targetLabel: title,
      course: context.course,
      summary: `Uploaded course file "${title}" to ${context.course.code}.`,
    });

    res.redirect(coursePath(context.course.id, "content", { notice: "Course file uploaded." }));
  })
);

app.post(
  "/courses/:id/announcements",
  requireAuth,
  requireRoles("admin", "teacher"),
  asyncHandler(async (req, res) => {
    const context = await getAccessibleCourse(req.user, Number(req.params.id));
    if (!context || !context.canManage) {
      res.redirect(withParams("/dashboard", { error: "You cannot post announcements for that course." }));
      return;
    }

    const title = String(req.body.title || "").trim();
    const content = String(req.body.content || "").trim();

    if (!title || !content) {
      res.redirect(coursePath(context.course.id, "content", { error: "Announcement title and message are required." }));
      return;
    }

    const announcementResult = await dbQuery(
      `INSERT INTO announcements
       (course_id, title, content, created_by)
       VALUES (?, ?, ?, ?)`,
      [context.course.id, title, content, req.user.id]
    );

    await logOperation({
      actor: req.user,
      actionType: "create_announcement",
      targetType: "announcement",
      targetIdentifier: String(announcementResult.insertId),
      targetLabel: title,
      course: context.course,
      summary: `Posted announcement "${title}" in ${context.course.code}.`,
    });

    res.redirect(coursePath(context.course.id, "content", { notice: "Announcement posted." }));
  })
);

app.post(
  "/courses/:id/quizzes",
  requireAuth,
  requireRoles("admin", "teacher"),
  asyncHandler(async (req, res) => {
    const context = await getAccessibleCourse(req.user, Number(req.params.id));
    if (!context || !context.canManage) {
      res.redirect(withParams("/dashboard", { error: "You cannot create quizzes for that course." }));
      return;
    }

    const quizPayload = parseQuizForm(req.body);
    const validationError = validateQuizPayload(quizPayload);
    if (validationError) {
      res.redirect(coursePath(context.course.id, "content", { error: validationError }));
      return;
    }

    const quizId = await replaceQuizContents({
      courseId: context.course.id,
      teacherId: req.user.id,
      title: quizPayload.title,
      description: quizPayload.description,
      dueAt: quizPayload.dueAt,
      questions: quizPayload.questions,
    });

    await logOperation({
      actor: req.user,
      actionType: "create_quiz",
      targetType: "quiz",
      targetIdentifier: String(quizId),
      targetLabel: quizPayload.title,
      course: context.course,
      summary: `Created quiz "${quizPayload.title}" in ${context.course.code}.`,
    });

    res.redirect(coursePath(context.course.id, "content", { notice: "Quiz created." }));
  })
);

app.post(
  "/courses/:id/grades",
  requireAuth,
  requireRoles("admin", "teacher"),
  asyncHandler(async (req, res) => {
    const context = await getAccessibleCourse(req.user, Number(req.params.id));
    if (!context || !context.canManage) {
      res.redirect(withParams("/dashboard", { error: "You cannot update grades for that course." }));
      return;
    }

    const studentId = Number(req.body.student_id);
    const gradeValue = String(req.body.grade_value || "").trim();
    const feedback = String(req.body.feedback || "").trim();

    if (!studentId || !gradeValue) {
      res.redirect(coursePath(context.course.id, "students-grades", { error: "Student and grade are required." }));
      return;
    }

    const enrolledStudent = await dbOne(
      `SELECT u.id, u.full_name, u.email
       FROM course_memberships cm
       JOIN users u ON u.id = cm.user_id
       WHERE cm.course_id = ? AND cm.user_id = ? AND cm.role = 'student'`,
      [context.course.id, studentId]
    );

    if (!enrolledStudent) {
      res.redirect(coursePath(context.course.id, "students-grades", { error: "That student is not enrolled in this course." }));
      return;
    }

    await dbQuery(
      `INSERT INTO grades
       (course_id, student_id, teacher_id, grade_value, feedback)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         teacher_id = VALUES(teacher_id),
         grade_value = VALUES(grade_value),
         feedback = VALUES(feedback),
         updated_at = CURRENT_TIMESTAMP`,
      [context.course.id, studentId, req.user.id, gradeValue, feedback || null]
    );

    await logOperation({
      actor: req.user,
      actionType: "save_grade",
      targetType: "grade",
      targetIdentifier: enrolledStudent.email,
      targetLabel: `${enrolledStudent.full_name} · ${gradeValue}`,
      course: context.course,
      summary: `Saved grade ${gradeValue} for ${enrolledStudent.email} in ${context.course.code}.`,
    });

    res.redirect(coursePath(context.course.id, "students-grades", { notice: "Grade saved." }));
  })
);

app.post(
  "/courses/:id/assignments",
  requireAuth,
  requireRoles("admin", "teacher"),
  asyncHandler(async (req, res) => {
    const context = await getAccessibleCourse(req.user, Number(req.params.id));
    if (!context || !context.canManage) {
      res.redirect(withParams("/dashboard", { error: "You cannot create assignments for that course." }));
      return;
    }

    const title = String(req.body.title || "").trim();
    const description = String(req.body.description || "").trim();
    const dueAt = normalizeDateTimeInput(req.body.due_at);

    if (!title || !description) {
      res.redirect(coursePath(context.course.id, "assignments", { error: "Assignment title and description are required." }));
      return;
    }

    const result = await dbQuery(
      `INSERT INTO assignments
       (course_id, title, description, due_at, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [context.course.id, title, description, dueAt, req.user.id]
    );

    await logOperation({
      actor: req.user,
      actionType: "create_assignment",
      targetType: "assignment",
      targetIdentifier: String(result.insertId),
      targetLabel: title,
      course: context.course,
      summary: `Created assignment "${title}" in ${context.course.code}.`,
    });

    res.redirect(coursePath(context.course.id, "assignments", { notice: "Assignment created." }));
  })
);

app.get(
  "/assignments/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const accessible = await getAccessibleAssignment(req.user, Number(req.params.id));
    if (!accessible) {
      res.redirect(withParams("/dashboard", { error: "Assignment not found." }));
      return;
    }

    const { context, assignment } = accessible;
    const metaSummary = `${context.course.code} · ${context.course.title}`;

    if (context.canManage) {
      const submissions = await dbQuery(
        `SELECT
           student.id AS student_id,
           student.full_name,
           student.email,
           submission.id AS submission_id,
           submission.file_name,
           submission.submitted_at,
           submission.grade_value,
           submission.feedback,
           submission.graded_at
         FROM users student
         JOIN course_memberships membership
           ON membership.user_id = student.id
          AND membership.course_id = ?
          AND membership.role = 'student'
         LEFT JOIN assignment_submissions submission
           ON submission.assignment_id = ? AND submission.student_id = student.id
         ORDER BY student.full_name`,
        [context.course.id, assignment.id]
      );

      const content = `
        <section class="grid two-col">
          <article class="panel">
            <p class="kicker">Assignment</p>
            <h3>${escapeHtml(assignment.title)}</h3>
            <p>${escapeHtml(assignment.description)}</p>
            <div class="meta-list">
              <span>${escapeHtml(metaSummary)}</span>
              <span>Due: ${escapeHtml(formatDateTime(assignment.due_at))}</span>
            </div>
            <div class="actions-row">
              <a class="button secondary" href="${coursePath(context.course.id, "assignments")}">Back to assignments</a>
            </div>
          </article>

          <article class="panel">
            <p class="kicker">Cloud workflow</p>
            <h3>Submissions stored in S3, grading stored in RDS</h3>
            <p class="section-meta">Each student submission is uploaded to S3. Submission metadata, grading, and feedback remain in the relational database for reporting and presentation.</p>
          </article>
        </section>

        <section class="panel">
          <p class="kicker">Submissions</p>
          <h3>Review and grade student work</h3>
          ${
            submissions.length
              ? `<div class="table-wrap scroll-panel">
                  <table>
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Submission</th>
                        <th>Submitted</th>
                        <th>Grade</th>
                        <th>Feedback</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${submissions
                        .map(
                          (submission) => `<tr>
                            <td>
                              <strong>${escapeHtml(submission.full_name)}</strong>
                              <div class="helper">${escapeHtml(submission.email)}</div>
                            </td>
                            <td>
                              ${
                                submission.submission_id
                                  ? `<a href="/submissions/${submission.submission_id}/download">${escapeHtml(
                                      submission.file_name
                                    )}</a>`
                                  : "No submission yet"
                              }
                            </td>
                            <td>${escapeHtml(
                              submission.submitted_at ? formatDateTime(submission.submitted_at) : "Not submitted"
                            )}</td>
                            <td colspan="2">
                              ${
                                submission.submission_id
                                  ? `<form method="post" action="/assignments/${assignment.id}/grade/${submission.student_id}">
                                      <div class="grid two-col">
                                        <label>
                                          Grade
                                          <input type="text" name="grade_value" value="${escapeHtml(
                                            submission.grade_value || ""
                                          )}" placeholder="A, 90, Pass" required />
                                        </label>
                                        <label>
                                          Feedback
                                          <textarea name="feedback" placeholder="Add grading feedback">${escapeHtml(
                                            submission.feedback || ""
                                          )}</textarea>
                                        </label>
                                      </div>
                                      <button type="submit">Save grade</button>
                                    </form>`
                                  : `<p class="empty">Wait for the student to upload a file before grading.</p>`
                              }
                            </td>
                          </tr>`
                        )
                        .join("")}
                    </tbody>
                  </table>
                </div>`
              : `<p class="empty">No students are enrolled in this course yet.</p>`
          }
        </section>`;

      res.send(
        renderPage({
          title: assignment.title,
          user: req.user,
          headline: assignment.title,
          subhead: metaSummary,
          content,
          query: req.query,
        })
      );
      return;
    }

    const submission = await dbOne(
      `SELECT
         submission.id,
         submission.file_name,
         submission.submitted_at,
         submission.grade_value,
         submission.feedback,
         submission.graded_at
       FROM assignment_submissions submission
       WHERE submission.assignment_id = ? AND submission.student_id = ?`,
      [assignment.id, req.user.id]
    );

    const content = `
      <section class="grid two-col">
        <article class="panel">
          <p class="kicker">Assignment</p>
          <h3>${escapeHtml(assignment.title)}</h3>
          <p>${escapeHtml(assignment.description)}</p>
          <div class="meta-list">
            <span>${escapeHtml(metaSummary)}</span>
            <span>Due: ${escapeHtml(formatDateTime(assignment.due_at))}</span>
          </div>
          <div class="actions-row">
            <a class="button secondary" href="${coursePath(context.course.id, "assignments")}">Back to assignments</a>
          </div>
        </article>

        <article class="panel">
          <p class="kicker">My submission</p>
          <h3>Upload to cloud storage</h3>
          <p class="section-meta">Your file is uploaded to S3. The submission timestamp, grade, and feedback are kept in RDS.</p>
          ${
            assignment.due_at && new Date(assignment.due_at).getTime() < Date.now()
              ? `<p class="empty">This assignment is closed because the due date has passed.</p>`
              : `<form method="post" action="/assignments/${assignment.id}/submit" enctype="multipart/form-data">
                  <label>
                    Submission file
                    <input type="file" name="submission_file" required />
                  </label>
                  <button type="submit">${submission ? "Replace submission" : "Upload submission"}</button>
                </form>`
          }
          ${
            submission
              ? `<div class="stack">
                  <div class="announcement">
                    <h4>${escapeHtml(submission.file_name)}</h4>
                    <p class="helper">Submitted ${escapeHtml(formatDateTime(submission.submitted_at))}</p>
                    <div class="actions-row">
                      <a class="button secondary" href="/submissions/${submission.id}/download">Download my file</a>
                    </div>
                  </div>
                </div>`
              : `<p class="empty">You have not uploaded anything yet.</p>`
          }
        </article>
      </section>

      <section class="panel">
        <p class="kicker">Grading</p>
        <h3>Feedback from the teaching team</h3>
        ${
          submission && submission.grade_value
            ? `<div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Grade</th>
                      <th>Feedback</th>
                      <th>Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>${escapeHtml(submission.grade_value)}</td>
                      <td>${escapeHtml(submission.feedback || "No feedback yet.")}</td>
                      <td>${escapeHtml(
                        submission.graded_at ? formatDateTime(submission.graded_at) : "Not graded"
                      )}</td>
                    </tr>
                  </tbody>
                </table>
              </div>`
            : `<p class="empty">Your submission has not been graded yet.</p>`
        }
      </section>`;

    res.send(
      renderPage({
        title: assignment.title,
        user: req.user,
        headline: assignment.title,
        subhead: metaSummary,
        content,
        query: req.query,
      })
    );
  })
);

app.post(
  "/assignments/:id/submit",
  requireAuth,
  requireRoles("student"),
  uploadSingleSubmission,
  asyncHandler(async (req, res) => {
    const accessible = await getAccessibleAssignment(req.user, Number(req.params.id));
    if (!accessible || accessible.context.membershipRole !== "student") {
      res.redirect(withParams("/dashboard", { error: "You cannot submit to that assignment." }));
      return;
    }

    const { context, assignment } = accessible;
    if (assignment.due_at && new Date(assignment.due_at).getTime() < Date.now()) {
      res.redirect(withParams(assignmentDetailPath(assignment.id), { error: "This assignment is already closed." }));
      return;
    }

    if (!req.file) {
      res.redirect(withParams(assignmentDetailPath(assignment.id), { error: "Choose a file to upload." }));
      return;
    }

    const existingSubmission = await dbOne(
      `SELECT id, s3_key
       FROM assignment_submissions
       WHERE assignment_id = ? AND student_id = ?`,
      [assignment.id, req.user.id]
    );

    const s3Key = buildS3ObjectKey(
      `courses/${context.course.id}/assignments/${assignment.id}/submissions/${req.user.id}`,
      req.file.originalname
    );
    await uploadFileToS3(s3Key, req.file);

    if (existingSubmission) {
      await dbQuery(
        `UPDATE assignment_submissions
         SET s3_key = ?, file_name = ?, content_type = ?, submitted_at = CURRENT_TIMESTAMP,
             graded_by = NULL, grade_value = NULL, feedback = NULL, graded_at = NULL
         WHERE id = ?`,
        [s3Key, req.file.originalname, req.file.mimetype || null, existingSubmission.id]
      );
      await deleteFileFromS3(existingSubmission.s3_key);
    } else {
      await dbQuery(
        `INSERT INTO assignment_submissions
         (assignment_id, student_id, s3_key, file_name, content_type)
         VALUES (?, ?, ?, ?, ?)`,
        [assignment.id, req.user.id, s3Key, req.file.originalname, req.file.mimetype || null]
      );
    }

    res.redirect(withParams(assignmentDetailPath(assignment.id), { notice: "Assignment uploaded." }));
  })
);

app.post(
  "/assignments/:id/grade/:studentId",
  requireAuth,
  requireRoles("admin", "teacher"),
  asyncHandler(async (req, res) => {
    const accessible = await getAccessibleAssignment(req.user, Number(req.params.id));
    if (!accessible || !accessible.context.canManage) {
      res.redirect(withParams("/dashboard", { error: "You cannot grade that assignment." }));
      return;
    }

    const { context, assignment } = accessible;
    const studentId = Number(req.params.studentId);
    const gradeValue = String(req.body.grade_value || "").trim();
    const feedback = String(req.body.feedback || "").trim();

    if (!gradeValue) {
      res.redirect(withParams(assignmentDetailPath(assignment.id), { error: "Grade is required." }));
      return;
    }

    const submission = await dbOne(
      `SELECT submission.id, student.full_name, student.email
       FROM assignment_submissions submission
       JOIN users student ON student.id = submission.student_id
       WHERE submission.assignment_id = ? AND submission.student_id = ?`,
      [assignment.id, studentId]
    );

    if (!submission) {
      res.redirect(withParams(assignmentDetailPath(assignment.id), { error: "That student has not submitted yet." }));
      return;
    }

    await dbQuery(
      `UPDATE assignment_submissions
       SET graded_by = ?, grade_value = ?, feedback = ?, graded_at = NOW()
       WHERE id = ?`,
      [req.user.id, gradeValue, feedback || null, submission.id]
    );

    await logOperation({
      actor: req.user,
      actionType: "grade_assignment",
      targetType: "assignment_submission",
      targetIdentifier: submission.email,
      targetLabel: `${submission.full_name} · ${assignment.title}`,
      course: context.course,
      summary: `Saved assignment grade ${gradeValue} for ${submission.email} in ${context.course.code}.`,
    });

    res.redirect(withParams(assignmentDetailPath(assignment.id), { notice: "Assignment grade saved." }));
  })
);

app.get(
  "/submissions/:id/download",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!s3Client || !bucketName) {
      res.redirect(withParams("/dashboard", { error: "S3 is not configured." }));
      return;
    }

    const submission = await dbOne(
      `SELECT
         submission.id,
         submission.s3_key,
         submission.student_id,
         assignment.course_id
       FROM assignment_submissions submission
       JOIN assignments assignment ON assignment.id = submission.assignment_id
       WHERE submission.id = ?`,
      [Number(req.params.id)]
    );

    if (!submission) {
      res.redirect(withParams("/dashboard", { error: "Submission not found." }));
      return;
    }

    const context = await getAccessibleCourse(req.user, submission.course_id);
    if (!context || (req.user.role === "student" && submission.student_id !== req.user.id)) {
      res.redirect(withParams("/dashboard", { error: "You do not have access to that submission." }));
      return;
    }

    const signedUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: bucketName,
        Key: submission.s3_key,
      }),
      { expiresIn: 900 }
    );

    res.redirect(signedUrl);
  })
);

app.post(
  "/courses/:id/messages/public",
  requireAuth,
  uploadSingleMessageAttachment,
  asyncHandler(async (req, res) => {
    const context = await getAccessibleCourse(req.user, Number(req.params.id));
    if (!context) {
      res.redirect(withParams("/dashboard", { error: "You cannot post to that course chat." }));
      return;
    }

    const body = normalizeMessageBody(req.body.body);
    if (!body && !req.file) {
      res.redirect(coursePath(context.course.id, "messages", { error: "Enter a message or attach a file." }));
      return;
    }

    if (req.file && (!s3Client || !bucketName)) {
      res.redirect(coursePath(context.course.id, "messages", { error: "S3 is not configured." }));
      return;
    }

    await storeCourseMessage({
      courseId: context.course.id,
      senderUserId: req.user.id,
      body,
      file: req.file || null,
    });

    await logOperation({
      actor: req.user,
      actionType: "post_public_message",
      targetType: "course_message",
      targetLabel: context.course.code,
      course: context.course,
      summary: `Posted to the public chat in ${context.course.code}.`,
    });

    res.redirect(coursePath(context.course.id, "messages", { notice: "Public message posted." }));
  })
);

app.post(
  "/courses/:id/messages/direct",
  requireAuth,
  uploadSingleMessageAttachment,
  asyncHandler(async (req, res) => {
    const context = await getAccessibleCourse(req.user, Number(req.params.id));
    if (!context) {
      res.redirect(withParams("/dashboard", { error: "You cannot send a direct message for that course." }));
      return;
    }

    const recipientUserId = Number(req.body.recipient_user_id);
    const recipient = await getAllowedDirectRecipient(req.user, context, recipientUserId);
    if (!recipient) {
      res.redirect(coursePath(context.course.id, "messages", { error: "That direct message recipient is not allowed." }));
      return;
    }

    const body = normalizeMessageBody(req.body.body);
    if (!body && !req.file) {
      res.redirect(coursePath(context.course.id, "messages", { error: "Enter a message or attach a file." }));
      return;
    }

    if (req.file && (!s3Client || !bucketName)) {
      res.redirect(coursePath(context.course.id, "messages", { error: "S3 is not configured." }));
      return;
    }

    await storeCourseMessage({
      courseId: context.course.id,
      senderUserId: req.user.id,
      recipientUserId,
      body,
      file: req.file || null,
    });

    await logOperation({
      actor: req.user,
      actionType: "send_direct_message",
      targetType: "direct_message",
      targetIdentifier: recipient.email,
      targetLabel: recipient.full_name,
      course: context.course,
      summary: `Sent a direct message to ${recipient.email} in ${context.course.code}.`,
    });

    res.redirect(withParams(directMessagePath(context.course.id, recipientUserId), { notice: "Direct message sent." }));
  })
);

app.get(
  "/courses/:courseId/messages/direct/:recipientId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const context = await getAccessibleCourse(req.user, Number(req.params.courseId));
    if (!context) {
      res.redirect(withParams("/dashboard", { error: "You cannot view that conversation." }));
      return;
    }

    const recipient = await getAllowedDirectRecipient(req.user, context, Number(req.params.recipientId));
    if (!recipient) {
      res.redirect(coursePath(context.course.id, "messages", { error: "That direct conversation is not available." }));
      return;
    }

    const conversationMessages = await dbQuery(
      `SELECT
         message.id,
         message.body,
         message.created_at,
         message.attachment_file_name,
         sender.full_name AS sender_name,
         recipient_user.full_name AS recipient_name
       FROM course_messages message
       JOIN users sender ON sender.id = message.sender_user_id
       LEFT JOIN users recipient_user ON recipient_user.id = message.recipient_user_id
       WHERE message.course_id = ?
         AND message.recipient_user_id IS NOT NULL
         AND (
           (message.sender_user_id = ? AND message.recipient_user_id = ?)
           OR
           (message.sender_user_id = ? AND message.recipient_user_id = ?)
         )
       ORDER BY message.created_at ASC`,
      [context.course.id, req.user.id, recipient.id, recipient.id, req.user.id]
    );

    const content = `
      <section class="grid two-col">
        <article class="panel">
          <p class="kicker">Direct conversation</p>
          <h3>${escapeHtml(recipient.full_name)}</h3>
          <p class="helper">${escapeHtml(`${recipient.email} · ${roleLabel(recipient.role)}`)}</p>
          <div class="actions-row">
            <a class="button secondary" href="${coursePath(context.course.id, "messages")}">Back to course messages</a>
          </div>
        </article>

        <article class="panel">
          <p class="kicker">Send message</p>
          <h3>Private thread with attachments</h3>
          <form method="post" action="${directMessagePath(context.course.id, recipient.id)}" enctype="multipart/form-data">
            <label>
              Message
              <textarea name="body" placeholder="Write your private message here."></textarea>
            </label>
            <label>
              Attachment
              <input type="file" name="attachment_file" />
            </label>
            <button type="submit">Send message</button>
          </form>
        </article>
      </section>

      <section class="panel">
        <p class="kicker">Conversation history</p>
        <h3>Private messages</h3>
        ${renderMessageFeed(
          conversationMessages,
          "No private messages have been sent in this conversation yet.",
          { scroll: true, showRecipient: true }
        )}
      </section>`;

    res.send(
      renderPage({
        title: `Direct message: ${recipient.full_name}`,
        user: req.user,
        headline: `Direct message with ${recipient.full_name}`,
        subhead: `${context.course.code} · ${context.course.title}`,
        content,
        query: req.query,
      })
    );
  })
);

app.post(
  "/courses/:courseId/messages/direct/:recipientId",
  requireAuth,
  uploadSingleMessageAttachment,
  asyncHandler(async (req, res) => {
    const context = await getAccessibleCourse(req.user, Number(req.params.courseId));
    if (!context) {
      res.redirect(withParams("/dashboard", { error: "You cannot send that direct message." }));
      return;
    }

    const recipient = await getAllowedDirectRecipient(req.user, context, Number(req.params.recipientId));
    if (!recipient) {
      res.redirect(coursePath(context.course.id, "messages", { error: "That direct conversation is not available." }));
      return;
    }

    const body = normalizeMessageBody(req.body.body);
    if (!body && !req.file) {
      res.redirect(withParams(directMessagePath(context.course.id, recipient.id), { error: "Enter a message or attach a file." }));
      return;
    }

    if (req.file && (!s3Client || !bucketName)) {
      res.redirect(withParams(directMessagePath(context.course.id, recipient.id), { error: "S3 is not configured." }));
      return;
    }

    await storeCourseMessage({
      courseId: context.course.id,
      senderUserId: req.user.id,
      recipientUserId: recipient.id,
      body,
      file: req.file || null,
    });

    await logOperation({
      actor: req.user,
      actionType: "send_direct_message",
      targetType: "direct_message",
      targetIdentifier: recipient.email,
      targetLabel: recipient.full_name,
      course: context.course,
      summary: `Sent a direct message to ${recipient.email} in ${context.course.code}.`,
    });

    res.redirect(withParams(directMessagePath(context.course.id, recipient.id), { notice: "Direct message sent." }));
  })
);

app.get(
  "/messages/:id/download",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!s3Client || !bucketName) {
      res.redirect(withParams("/dashboard", { error: "S3 is not configured." }));
      return;
    }

    const message = await dbOne(
      `SELECT id, course_id, sender_user_id, recipient_user_id, attachment_s3_key
       FROM course_messages
       WHERE id = ?`,
      [Number(req.params.id)]
    );

    if (!message || !message.attachment_s3_key) {
      res.redirect(withParams("/dashboard", { error: "Message attachment not found." }));
      return;
    }

    const context = await getAccessibleCourse(req.user, message.course_id);
    const isPrivateMessage = !!message.recipient_user_id;
    const isParticipant =
      req.user.role === "admin" ||
      req.user.id === message.sender_user_id ||
      req.user.id === message.recipient_user_id;

    if (!context || (isPrivateMessage && !isParticipant)) {
      res.redirect(withParams("/dashboard", { error: "You do not have access to that attachment." }));
      return;
    }

    const signedUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: bucketName,
        Key: message.attachment_s3_key,
      }),
      { expiresIn: 900 }
    );

    res.redirect(signedUrl);
  })
);

app.get(
  "/materials/:id/download",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!s3Client || !bucketName) {
      res.redirect(withParams("/dashboard", { error: "S3 is not configured." }));
      return;
    }

    const material = await dbOne(
      `SELECT m.id, m.s3_key, m.course_id
       FROM course_materials m
       WHERE m.id = ?`,
      [Number(req.params.id)]
    );

    if (!material) {
      res.redirect(withParams("/dashboard", { error: "Material not found." }));
      return;
    }

    const context = await getAccessibleCourse(req.user, material.course_id);
    if (!context) {
      res.redirect(withParams("/dashboard", { error: "You do not have access to that file." }));
      return;
    }

    const signedUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: bucketName,
        Key: material.s3_key,
      }),
      { expiresIn: 900 }
    );

    res.redirect(signedUrl);
  })
);

app.get(
  "/quizzes/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const quiz = await dbOne(
      `SELECT
         q.*,
         c.id AS course_id,
         c.title AS course_title,
         c.code AS course_code
       FROM quizzes q
       JOIN courses c ON c.id = q.course_id
       WHERE q.id = ?`,
      [Number(req.params.id)]
    );

    if (!quiz) {
      res.redirect(withParams("/dashboard", { error: "Quiz not found." }));
      return;
    }

    const context = await getAccessibleCourse(req.user, quiz.course_id);
    if (!context) {
      res.redirect(withParams("/dashboard", { error: "You do not have access to that quiz." }));
      return;
    }

    const questions = await dbQuery(
      `SELECT id, position, question_text, option_a, option_b, option_c, option_d, correct_option
       FROM quiz_questions
       WHERE quiz_id = ?
       ORDER BY position`,
      [quiz.id]
    );

    const existingAttempt =
      req.user.role === "student"
        ? await dbOne(
            `SELECT correct_answers, total_questions, score, submitted_at
             FROM quiz_attempts
             WHERE quiz_id = ? AND student_id = ?`,
            [quiz.id, req.user.id]
          )
        : null;

    const attemptRows =
      req.user.role !== "student"
        ? await dbQuery(
            `SELECT
               qa.correct_answers,
               qa.total_questions,
               qa.score,
               qa.submitted_at,
               u.full_name
             FROM quiz_attempts qa
             JOIN users u ON u.id = qa.student_id
             WHERE qa.quiz_id = ?
             ORDER BY qa.submitted_at DESC`,
            [quiz.id]
          )
        : [];

    const quizContent =
      req.user.role === "student"
        ? `<section class="panel">
            <p class="kicker">Student attempt</p>
            <h3>${escapeHtml(quiz.title)}</h3>
            <p>${escapeHtml(quiz.description)}</p>
            <div class="meta-list">
              <span>Course: ${escapeHtml(`${quiz.course_code} · ${quiz.course_title}`)}</span>
              <span>Due: ${escapeHtml(formatDateTime(quiz.due_at))}</span>
              <span>${escapeHtml(existingAttempt ? `Latest result: ${scoreLabel(existingAttempt)}` : "No attempt submitted yet")}</span>
            </div>
            <form method="post" action="/quizzes/${quiz.id}/submit">
              ${questions
                .map(
                  (question) => `<section class="question-card">
                    <h4>${escapeHtml(`Question ${question.position}`)}</h4>
                    <p>${escapeHtml(question.question_text)}</p>
                    <div class="quiz-option-grid">
                      ${[
                        ["A", question.option_a],
                        ["B", question.option_b],
                        ["C", question.option_c],
                        ["D", question.option_d],
                      ]
                        .map(
                          ([key, label]) => `<label class="quiz-option">
                            <input type="radio" name="question_${question.id}" value="${key}" required />
                            <span><strong>${key}.</strong> ${escapeHtml(label)}</span>
                          </label>`
                        )
                        .join("")}
                    </div>
                  </section>`
                )
                .join("")}
              <button type="submit">Submit quiz</button>
            </form>
          </section>`
        : `<section class="grid two-col">
            <article class="panel">
              <p class="kicker">Quiz overview</p>
              <h3>${escapeHtml(quiz.title)}</h3>
              <p>${escapeHtml(quiz.description)}</p>
              <div class="meta-list">
                <span>Course: ${escapeHtml(`${quiz.course_code} · ${quiz.course_title}`)}</span>
                <span>Due: ${escapeHtml(formatDateTime(quiz.due_at))}</span>
                <span>${questions.length} questions</span>
              </div>
              <div class="stack">
                ${questions
                  .map(
                    (question) => `<article class="announcement">
                      <h4>${escapeHtml(`Question ${question.position}`)}</h4>
                      <p>${escapeHtml(question.question_text)}</p>
                      <ul>
                        <li>A. ${escapeHtml(question.option_a)}</li>
                        <li>B. ${escapeHtml(question.option_b)}</li>
                        <li>C. ${escapeHtml(question.option_c)}</li>
                        <li>D. ${escapeHtml(question.option_d)}</li>
                      </ul>
                      <p class="helper">Correct answer: ${escapeHtml(question.correct_option)}</p>
                    </article>`
                  )
                  .join("")}
              </div>
            </article>

            <article class="panel">
              <p class="kicker">Results</p>
              <h3>Student submissions</h3>
              ${
                attemptRows.length
                  ? `<div class="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Student</th>
                            <th>Score</th>
                            <th>Submitted</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${attemptRows
                            .map(
                              (attempt) => `<tr>
                                <td>${escapeHtml(attempt.full_name)}</td>
                                <td>${escapeHtml(scoreLabel(attempt))}</td>
                                <td>${escapeHtml(formatDateTime(attempt.submitted_at))}</td>
                              </tr>`
                            )
                            .join("")}
                        </tbody>
                      </table>
                    </div>`
                  : `<p class="empty">No students have submitted this quiz yet.</p>`
              }
            </article>
          </section>`;

    res.send(
      renderPage({
        title: quiz.title,
        user: req.user,
        headline: quiz.title,
        subhead:
          req.user.role === "student"
            ? "Complete the quiz below and your latest result will be stored automatically."
            : "Review the answer key and watch quiz submissions as students complete the assessment.",
        content: quizContent,
        query: req.query,
      })
    );
  })
);

app.post(
  "/quizzes/:id/submit",
  requireAuth,
  requireRoles("student"),
  asyncHandler(async (req, res) => {
    const quiz = await dbOne(
      `SELECT id, course_id, due_at
       FROM quizzes
       WHERE id = ?`,
      [Number(req.params.id)]
    );

    if (!quiz) {
      res.redirect(withParams("/dashboard", { error: "Quiz not found." }));
      return;
    }

    const context = await getAccessibleCourse(req.user, quiz.course_id);
    if (!context || context.membershipRole !== "student") {
      res.redirect(withParams("/dashboard", { error: "You cannot submit that quiz." }));
      return;
    }

    if (quiz.due_at && new Date(quiz.due_at).getTime() < Date.now()) {
      res.redirect(withParams(`/quizzes/${quiz.id}`, { error: "This quiz is already closed." }));
      return;
    }

    const questions = await dbQuery(
      `SELECT id, correct_option
       FROM quiz_questions
       WHERE quiz_id = ?
       ORDER BY position`,
      [quiz.id]
    );

    if (!questions.length) {
      res.redirect(withParams(`/quizzes/${quiz.id}`, { error: "This quiz has no questions yet." }));
      return;
    }

    const answers = questions.map((question) => {
      const selected = String(req.body[`question_${question.id}`] || "").trim().toUpperCase();
      return {
        questionId: question.id,
        selectedOption: ["A", "B", "C", "D"].includes(selected) ? selected : null,
        isCorrect: selected === question.correct_option,
      };
    });

    const correctAnswers = answers.filter((answer) => answer.isCorrect).length;
    const totalQuestions = questions.length;
    const score = Number(((correctAnswers / totalQuestions) * 100).toFixed(2));

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [attemptResult] = await connection.query(
        `INSERT INTO quiz_attempts
         (quiz_id, student_id, correct_answers, total_questions, score)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           correct_answers = VALUES(correct_answers),
           total_questions = VALUES(total_questions),
           score = VALUES(score),
           submitted_at = CURRENT_TIMESTAMP,
           id = LAST_INSERT_ID(id)`,
        [quiz.id, req.user.id, correctAnswers, totalQuestions, score]
      );

      const attemptId = attemptResult.insertId;
      await connection.query("DELETE FROM quiz_answers WHERE attempt_id = ?", [attemptId]);

      for (const answer of answers) {
        await connection.query(
          `INSERT INTO quiz_answers
           (attempt_id, question_id, selected_option, is_correct)
           VALUES (?, ?, ?, ?)`,
          [attemptId, answer.questionId, answer.selectedOption, answer.isCorrect ? 1 : 0]
        );
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    res.redirect(withParams(`/quizzes/${quiz.id}`, { notice: `Quiz submitted. Score: ${correctAnswers}/${totalQuestions}.` }));
  })
);

app.get(
  "/health",
  asyncHandler(async (req, res) => {
    const database = !pool
      ? {
          ok: false,
          detail: "Database is not configured.",
        }
      : await (async () => {
          try {
            await dbQuery("SELECT 1");
            return {
              ok: true,
              detail: `Connected to ${dbConfig.database} on ${dbConfig.host}:${dbConfig.port}.`,
            };
          } catch (error) {
            return {
              ok: false,
              detail: `Database connection failed: ${error.message}`,
            };
          }
        })();

    const s3 = !s3Client
      ? {
          ok: false,
          detail: "S3 is not configured.",
        }
      : await (async () => {
          try {
            await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
            return {
              ok: true,
              detail: `Connected to bucket ${bucketName} in ${awsRegion}.`,
            };
          } catch (error) {
            return {
              ok: false,
              detail: `S3 access failed: ${error.message}`,
            };
          }
        })();

    res.json({
      app: {
        ok: true,
        port,
        timestamp: new Date().toISOString(),
      },
      database,
      s3,
    });
  })
);

app.get("/files", requireAuth, (req, res) => {
  res.redirect("/dashboard");
});

app.use((req, res) => {
  res.status(404).send(
    renderPage({
      title: "Not Found",
      user: req.user,
      headline: "That page does not exist.",
      subhead: "Use the dashboard to navigate back into the platform.",
      content: `<section class="panel"><a class="button" href="${req.user ? "/dashboard" : "/"}">Go back</a></section>`,
    })
  );
});

app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) {
    next(error);
    return;
  }

  res.status(500).send(
    renderPage({
      title: "Server Error",
      user: req.user,
      headline: "Something went wrong on the server.",
      subhead: "The error has been logged. Review the details below and try the action again.",
      content: `<section class="panel">
        <p class="mono">${escapeHtml(error.message || "Unknown server error")}</p>
        <div class="actions-row">
          <a class="button" href="${req.user ? "/dashboard" : "/"}">Return</a>
        </div>
      </section>`,
    })
  );
});

async function startServer() {
  if (pool) {
    await ensureSchema();
  }

  app.listen(port, () => {
    console.log(`University Learning Hub running on port ${port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start application:", error);
  process.exit(1);
});
