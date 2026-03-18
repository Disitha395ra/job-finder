# 🔍 JobFinder — Full-Stack Job Board Application

A modern, full-featured job board similar to Indeed.com. Built with **React**, **Node.js/Express**, and **Firebase** (Auth, Firestore, Storage).

![React](https://img.shields.io/badge/React-19-blue) ![Node.js](https://img.shields.io/badge/Node.js-Express-green) ![Firebase](https://img.shields.io/badge/Firebase-Auth%20|%20Firestore%20|%20Storage-orange)

---

## ✨ Features

### For Job Seekers
- 🔍 Search jobs by keyword, location, type, and date
- 📋 View detailed job descriptions
- 📝 Apply with cover letter and CV upload
- 👤 Track all applied jobs in profile
- 🔐 Email/password authentication with verification

### For Companies
- 🏢 Dedicated company registration and login
- 📮 Post jobs with full descriptions, keywords, salary info
- 📊 View all posted jobs with applicant counts
- 🗑️ Delete job posts
- 🔒 Change password from settings

### General
- 🎨 Modern, responsive UI with animations
- 🔔 Toast notifications for all actions
- 🛡️ Role-based access control (seeker vs company)
- 📱 Mobile-friendly design
- 🏷️ "NEW" badge for jobs posted within 2 days

---

## 🏗️ Project Structure

```
job-finder/
├── client/                      # React Frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/          # Navbar, Footer
│   │   │   ├── jobs/            # JobCard, JobFilters
│   │   │   ├── auth/            # Auth form styles
│   │   │   └── ui/              # Loader
│   │   ├── context/             # AuthContext
│   │   ├── pages/               # All page components
│   │   ├── services/            # API service functions
│   │   ├── firebase.js          # Firebase client config
│   │   ├── App.jsx              # Root component + routes
│   │   └── index.css            # Design system
│   ├── .env                     # Firebase client config
│   └── vite.config.js
│
├── server/                      # Node.js Backend
│   ├── config/firebase.js       # Firebase Admin SDK
│   ├── middleware/auth.js       # Token verification + role checks
│   ├── routes/
│   │   ├── jobs.js              # CRUD for jobs
│   │   ├── applications.js      # Submit/fetch applications + CV upload
│   │   ├── users.js             # Seeker registration/profile
│   │   └── companies.js         # Company registration/profile/password
│   ├── .env                     # Firebase Admin credentials
│   └── server.js                # Express entry point
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+ and npm
- A **Firebase** project with:
  - Authentication (Email/Password enabled)
  - Firestore Database
  - Cloud Storage

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd job-finder
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Enable **Authentication** → Sign-in method → **Email/Password**
4. Create a **Firestore Database** (Start in test mode for development)
5. Enable **Cloud Storage**
6. Get your **Web app config** from Project Settings → General
7. Generate a **Service Account key** from Project Settings → Service Accounts

### 3. Configure Environment Variables

**Client** (`client/.env`):
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_API_URL=http://localhost:5000/api
```

**Server** (`server/.env`):
```env
PORT=5000
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

### 4. Install Dependencies
```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

### 5. Create Firestore Indexes

In the Firebase Console, go to **Firestore → Indexes** and create these composite indexes:

| Collection | Fields | Order |
|---|---|---|
| `jobs` | `status` (Asc), `createdAt` (Desc) | ✓ |
| `jobs` | `status` (Asc), `jobType` (Asc), `createdAt` (Desc) | ✓ |
| `jobs` | `status` (Asc), `locationLower` (Asc), `createdAt` (Desc) | ✓ |
| `jobs` | `companyId` (Asc), `createdAt` (Desc) | ✓ |
| `applications` | `userId` (Asc), `createdAt` (Desc) | ✓ |
| `applications` | `jobId` (Asc), `createdAt` (Desc) | ✓ |

> **Note:** Firestore will suggest creating these indexes automatically when you first query with these fields. Click the link in the error message to create them.

### 6. Run the Application

**Start the backend** (in one terminal):
```bash
cd server
npm run dev
```

**Start the frontend** (in another terminal):
```bash
cd client
npm run dev
```

The app will be available at **http://localhost:5173**

---

## 📡 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/jobs` | Fetch jobs (with filters) | Public |
| `GET` | `/api/jobs/:id` | Get job details | Public |
| `POST` | `/api/jobs` | Create job post | Company |
| `PUT` | `/api/jobs/:id` | Update job post | Company (owner) |
| `DELETE` | `/api/jobs/:id` | Delete job post | Company (owner) |
| `POST` | `/api/applications` | Submit application | Seeker |
| `GET` | `/api/applications/user` | Get user's applications | Seeker |
| `GET` | `/api/applications/job/:id` | Get job's applications | Company |
| `POST` | `/api/users/register` | Register seeker profile | Public |
| `GET` | `/api/users/profile` | Get seeker profile | Seeker |
| `POST` | `/api/companies/register` | Register company | Public |
| `GET` | `/api/companies/profile` | Get company profile | Company |
| `GET` | `/api/companies/jobs` | Get company's jobs | Company |
| `PUT` | `/api/companies/password` | Change company password | Company |

---

## 🛡️ Security

- Firebase ID tokens for all authenticated requests
- Role-based middleware (`requireSeeker`, `requireCompany`)
- Companies can only modify their own job posts
- Job seekers can only view their own applications
- File upload restricted to PDF/Word, max 10MB
- Duplicate application prevention

---

## 📱 Responsive Design

The application is fully responsive and optimized for:
- 🖥️ Desktop (1280px+)
- 💻 Tablet (768px - 1279px)
- 📱 Mobile (< 768px)

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, React Router 7 |
| Styling | Vanilla CSS with custom properties |
| Backend | Node.js, Express |
| Auth | Firebase Authentication |
| Database | Cloud Firestore |
| Storage | Firebase Cloud Storage |
| Icons | React Icons (Feather) |
| Notifications | React Toastify |
| HTTP Client | Axios |

---

## 📄 License

This project is licensed under the MIT License.
