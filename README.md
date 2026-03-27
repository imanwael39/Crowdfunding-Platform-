# 🚀 Crowdfunding Platform

A full-stack crowdfunding web application where users can create campaigns, back projects they believe in, and admins can moderate the platform — built as a graduation project.

---

## 📌 Project Overview

The Crowdfunding Platform allows users to:
- Browse and search approved crowdfunding campaigns
- Register and log in with a personal account
- Create their own campaigns with images, goals, and deadlines
- Pledge money to campaigns they support
- Track their own campaigns and pledges from a personal dashboard

Admins can:
- Approve or reject submitted campaigns
- Ban or unban users
- View all pledges and platform activity

---

## ✨ Features

### 👤 User Features
- **Register & Login** — secure client-side authentication with session stored in localStorage
- **Browse Campaigns** — view all approved campaigns with search by title and filter by category
- **Campaign Details** — view full campaign info, progress bar, backer list, and days remaining
- **Pledge** — contribute any amount to a campaign with a confirmation step
- **Create Campaign** — submit a new campaign with title, description, category, goal, deadline, and image
- **Dashboard** — manage your own campaigns (edit/delete) and view your pledge history

### 🛡️ Admin Features
- **User Management** — view all users, ban or unban accounts
- **Campaign Moderation** — approve or reject pending campaigns
- **Pledge Overview** — view all pledges across the platform

### 🔐 Auth & Authorization
- Role-based access control (`user` / `admin`)
- Protected routes redirect unauthenticated users to login
- Banned users are blocked from accessing the platform
- Admin dashboard is restricted to admin role only

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, JavaScript (ES6 Modules) |
| Backend | json-server (mock REST API) |
| Database | db.json (file-based JSON database) |
| Authentication | Custom client-side session via localStorage |
| Package Manager | npm |
| Runtime | Node.js |

---

## 📁 Folder Structure

```
Crowdfunding Platform/
├── admin/
│   ├── index.html         # Admin dashboard page
│   └── admin.js           # Admin logic (users, campaigns, pledges)
├── css/
│   ├── variables.css      # CSS custom properties (colors, fonts)
│   ├── reset.css          # Browser reset styles
│   └── components.css     # Shared UI components
├── js/
│   ├── api.js             # HTTP wrapper (GET, POST, PATCH, DELETE)
│   ├── auth.js            # Session management and route guards
│   ├── utils.js           # Helpers (toasts, formatting, base64)
│   └── pages/
│       ├── home.js        # Home page logic (browse, search, filter)
│       ├── auth.js        # Login and register logic
│       ├── campaign.js    # Campaign detail and pledge logic
│       ├── create-campaign.js  # Campaign creation form logic
│       └── dashboard.js   # User dashboard logic
├── db.json                # JSON database (users, campaigns, pledges)
├── index.html             # Home page
├── login.html             # Login page
├── register.html          # Register page
├── campaign.html          # Campaign detail page
├── create-campaign.html   # Create campaign page
├── dashboard.html         # User dashboard page
├── package.json
└── package-lock.json
```

---

## ⚙️ How to Run Locally

### Prerequisites
- [Node.js](https://nodejs.org/) installed on your machine
- npm (comes with Node.js)

### Steps

**1. Clone the repository**
```bash
git clone https://github.com/imanwael39/Crowdfunding-Platform-.git
cd Crowdfunding-Platform-
```

**2. Install dependencies**
```bash
npm install
```

**3. Start the backend server**
```bash
npm start
```

This starts json-server on `http://localhost:3000` and watches `db.json` for changes.

**4. Open the frontend**

Open `index.html` in your browser directly, or use a live server extension in VS Code.

### Default Admin Account
To access the admin dashboard, log in with an account that has `"role": "admin"` in `db.json`.

---

## 🔗 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/users` | Get all users |
| POST | `/users` | Register a new user |
| PATCH | `/users/:id` | Update user (ban/unban) |
| GET | `/campaigns` | Get all campaigns |
| POST | `/campaigns` | Create a new campaign |
| PATCH | `/campaigns/:id` | Update campaign (edit/approve/reject) |
| DELETE | `/campaigns/:id` | Delete a campaign |
| GET | `/pledges` | Get all pledges |
| POST | `/pledges` | Create a new pledge |

---

## 👨‍💻 Author

| Name | Role |
|---|---|
| Iman Wael | Developer — JS Project |

---

## 📝 Notes

- This project uses **json-server** as a mock backend for development and demo purposes. In a production environment, it would be replaced with a proper backend (e.g. Node.js/Express with a real database like PostgreSQL or MongoDB).
- Authentication is client-side only using localStorage — not suitable for production without a proper server-side auth system.
- All data resets if `db.json` is replaced or the server is redeployed from scratch.

---

*Built with ❤️ as a JS project — ITI*
