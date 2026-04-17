# 📚 StudyHub – Your Study Companion

StudyHub is a full-stack productivity web application designed to help students manage their academic life efficiently. It provides tools for notes, study planning, checklists, focus sessions, and exam tracking — all in one place.

---

## 🚀 Features

* 📝 **Notes Management**

  * Create, edit, and delete notes
  * View recent notes on dashboard

* ✅ **Checklist Tracking**

  * Track progress of daily/weekly tasks
  * Monitor completion status

* 📅 **Calendar & Exams**

  * Add and track upcoming exams
  * Visual countdown for important events

* 📖 **Study Plan**

  * Organize subjects and study schedules

* ⏱️ **Focus Timer**

  * Stay productive with timed study sessions

* 📊 **Dashboard Overview**

  * Quick stats for notes, checklist, exams, and focus status

---

## 🖼️ Preview

![Dashboard Screenshot](./assets/dashboard.png)

---

## 🏗️ Project Structure

```
project-root/
│
├── app/            # Frontend (React + Vite)
│   ├── components/
│   ├── pages/
│   ├── App.tsx
│   └── main.tsx
│
├── server/         # Backend (Node.js + Express)
│   ├── index.js
│   ├── routes.js
│   └── db.js
│
├── .gitignore
└── README.md
```

---

## ⚙️ Tech Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS (if used)

### Backend

* Node.js
* Express.js

### Data Storage

* Currently: SQLite
* Future: MongoDB / PostgreSQL 

---

## 🧑‍💻 Installation & Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
```

---

### 2️⃣ Install Dependencies

#### Frontend

```bash
cd app
npm install
```

#### Backend

```bash
cd ../server
npm install
```

---

### 3️⃣ Run the Application

#### Start Backend Server

```bash
cd server
node index.js
```

Runs on:

```
http://localhost:4000
```

---

#### Start Frontend

```bash
cd app
npm run dev
```

Runs on:

```
http://localhost:5173
```

---

## 🔌 API Endpoints

### Notes

* `GET /api/notes`
* `POST /api/notes`
* `PUT /api/notes/:id`
* `DELETE /api/notes/:id`

### Checklist

* `GET /api/checklist`
* `POST /api/checklist`

*(Extend as needed for calendar, study plan, etc.)*

---

## 🔁 Frontend–Backend Integration

* Replace `localStorage` usage with API calls
* Example:

```js
fetch('/api/notes')
```

* Use Vite proxy for clean API routing

---

## 🔐 Future Improvements

* User Authentication (JWT)
* Database integration (MongoDB)
* Cloud deployment (Render / Vercel)
* Mobile responsiveness improvements

---

## ⚠️ Important Notes

* `node_modules` is excluded using `.gitignore`
* Environment variables should be stored in `.env`

---

## 📌 Contributing

Contributions are welcome! Feel free to fork the repo and submit a pull request.

---

## 📄 License

This project is open-source and available under the MIT License.

---

## 👨‍💻 Author

**Vaibhav Dhaka**

---

## ⭐ If you like this project

Give it a star on GitHub ⭐ and share it!

---
