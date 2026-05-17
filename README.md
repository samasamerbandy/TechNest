# TechNest – A Mobile Application for Facility Management

## Team Members

| Name | ID | Role |
|---|---|---|
| Zeina Fahim | 13007626 | Team Lead |
| Nada Khaled | 13001493 | Member |
| Sama Samer | 13007478 | Member |
| Nadine Ghazy | 13002308 | Member |
| Miriam Amgad | 13003103 | Member |
| Zeina Hesham | 13003636 | Member |
| Alya Mandour | 13007246 | Member |
| Mariam Youssry | 13007410 | Member |

Tutorial Group 6 | Hassan Osama

---

## Overview

TechNest is a campus issue reporting and maintenance tracking mobile application. It includes:

- `backend/` — Express API with authentication, ticket management, notifications, and Prisma database logic
- `frontend/` — Expo React Native app for members, managers, and workers
- `prisma/` — Prisma schema and database configuration

---

## Prerequisites

- Node.js 18+ or compatible version
- npm
- Git
- Optional: Expo CLI globally installed with `npm install -g expo-cli`

---

## Backend Setup

1. Open a terminal and go to the backend folder:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in `backend/` with the following values:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
COOKIE_SECRET=your_cookie_secret
CLIENT_URL=http://localhost:19006
PORT=5000
NODE_ENV=development
```

4. Generate the Prisma client and run migrations:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

5. Start the backend server:

```bash
npm run dev
```

The backend will be available at `http://localhost:5000`.

---

## Frontend Setup

1. Open a new terminal and go to the frontend folder:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. **Update the IP address for your machine** (see section below).

4. Start the Expo app:

```bash
npx expo start --clear
```

Then follow the Expo prompts to open on a simulator, device, or browser.

---

## ⚠️ Important: IP Address Configuration

> **The IP address will be different on every laptop.** Each team member must update the frontend API URL to match their own machine's local IP before running the project.

### Step 1 — Find your IP address

- **Windows:** Open Command Prompt → type `ipconfig` → look for **WiFi IPv4 Address**
- **Mac/Linux:** Run `ipconfig getifaddr en0` in Terminal

### Step 2 — Update the frontend API file

Open `frontend/src/api/axiosInstance.js` and update the `baseURL`:

```js
baseURL: 'http://YOUR_IP_HERE:5000',
```

**Example:**
```js
baseURL: 'http://192.168.1.45:5000',
```

> Replace `192.168.1.45` with your actual IP address every time you switch machines or networks.

---

## Running the App

Run both backend and frontend at the same time in two separate terminals:

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npx expo start --clear
```

---

## Environment Variables

Required backend variables in your `.env` file:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for JWT tokens |
| `JWT_EXPIRES_IN` | Token expiry duration (e.g. `7d`) |
| `COOKIE_SECRET` | Secret for cookie signing |
| `CLIENT_URL` | Frontend URL (e.g. `http://localhost:19006`) |
| `PORT` | Backend port (default: `5000`) |
| `NODE_ENV` | Environment (`development` or `production`) |

---

## Git Workflow

To get the latest changes from main into your branch:

```bash
git fetch --all --prune
git checkout your-branch-name
git merge origin/main
```

If the `frontend/` folder is missing locally, syncing with `origin/main` should restore it.

---

## 1. Introduction

The purpose of this mobile application is to improve the university's facilities such as facility cleanliness. The intended audience are the GIU committee (Users), facility management, Admin and workers. The app creates direct communication between users and facility management to ensure that complaints are heard, tracked and resolved.

### Product Vision & Scope

The aim is to create a mobile application that is a fast, reliable and transparent maintenance communication platform that ensures campus facilities are maintained efficiently.

**Goals:**
- Reduce maintenance response time
- Improve accuracy of issue reporting through photo evidence
- Provide real-time tracking of maintenance tasks
- Enable automated alerts for restocking tissues, soap, and baskets
- Offer a user-friendly interface where tickets can be submitted in under one minute

### Definitions and Acronyms

| Term | Definition |
|---|---|
| SRS | Software Requirements Specification |
| Ticket | A digital record representing a maintenance issue |
| RBAC | Role-Based Access Control |
| Facility Management (FM) | Department responsible for campus maintenance |
| Worker | Maintenance staff assigned to resolve tickets |
| Admin | System administrator managing users and system configuration |

---

## 2. Functional Requirements

### Community Member

| ID | Requirement | Priority |
|---|---|---|
| FR-CM-01 | Register a new account by providing name, email, and password | High |
| FR-CM-02 | Login using a valid email and password & create a new maintenance ticket | High |
| FR-CM-03 | Access photos and camera, upload photos from gallery, capture photo | High |
| FR-CM-04 | Choose the building where the issue is located | High |
| FR-CM-05 | Select the floor number where the issue is located | High |
| FR-CM-06 | Enter the nearest room number adjacent to the bathroom | Medium |
| FR-CM-07 | Select issue categories: Tissue Restocking, Soap Refill, Trash Overflow, Door Malfunction, Plumbing Issue, Other | High |
| FR-CM-08 | Enter additional details about the issue | Medium |
| FR-CM-09 | Notify the user that the ticket has been successfully submitted | Medium |
| FR-CM-10 | Notify the user when the ticket status is marked as resolved | Low |
| FR-CM-11 | Track the status of submitted tickets | Low |
| FR-CM-12 | Change their password | Medium |
| FR-CM-13 | Log out of the application | — |

### Facility Management

| ID | Requirement | Priority |
|---|---|---|
| FR-FM-01 | Create an account | — |
| FR-FM-02 | Log in using a valid email and password | — |
| FR-FM-03 | Log out of the application | — |
| FR-FM-04 | Receive notification when a new ticket is submitted | High |
| FR-FM-05 | View ticket details: building, floor, nearest room number, issue category, uploaded image and description | Medium |
| FR-FM-06 | Assign tickets to specific workers | High |
| FR-FM-07 | Change the ticket status to: pending, assigned and resolved | High |
| FR-FM-08 | Filter all tickets based on tag/location | Medium |
| FR-FM-09 | View workers' profiles | Medium |
| FR-FM-10 | Merge similar requests submitted | Medium |
| FR-FM-11 | Assign a priority level (high, medium, low) to a task | High |
| FR-FM-12 | Close an issue once it has been resolved | High |

### Worker

| ID | Requirement | Priority |
|---|---|---|
| FR-W-01 | Create an account | — |
| FR-W-02 | Log in using a valid email and password | — |
| FR-W-03 | Log out of the application | — |
| FR-W-04 | View only the tickets assigned to them | High |
| FR-W-05 | Add comments to an issue | — |
| FR-W-06 | Mark an assigned issue as In Progress | — |
| FR-W-07 | See the exact location: building, floor and nearest room number | High |
| FR-W-08 | Update ticket status to "Assigned" and "Resolved" | High |
| FR-W-09 | Upload a photo as proof of issue resolution | High |

### Admin

| ID | Requirement | Priority |
|---|---|---|
| FR-A-01 | Log in to the system | — |
| FR-A-02 | Log out of the application | — |
| FR-A-03 | Create, edit, suspend, or delete user accounts | High |
| FR-A-04 | Enforce RBAC and assign roles (Community Member, Facility Management, Worker) | High |
| FR-A-05 | Monitor ticket statistics and system activity (Dashboard) | High |
| FR-A-06 | Reset passwords | Medium |
| FR-A-07 | View all registered users in the system | — |

---

## 2.1 User Stories

### Community Member
- **US-CM-01:** As a community member, I can register an account and login using email and password.
- **US-CM-02:** As a community member, I am allowed to create a new maintenance ticket.
- **US-CM-03:** As a community member, I am allowed to upload at least one image per ticket.
- **US-CM-04:** As a community member, I can select the building where the issue is located.
- **US-CM-05:** As a community member, I can select the floor number where the issue is located.
- **US-CM-06:** As a community member, I can enter the nearest room number adjacent to the bathroom.
- **US-CM-07:** As a community member, I can select an issue category: Tissue Restocking, Soap Refill, Trash Overflow, Door Malfunction, Plumbing Issue and Other.
- **US-CM-08:** As a community member, I can enter additional details about the issue.
- **US-CM-09:** As a community member, I can be notified once the ticket has been successfully submitted.
- **US-CM-10:** As a community member, I can be notified when the ticket status is marked as resolved.
- **US-CM-11:** As a community member, I can track the status of submitted tickets by viewing it.
- **US-CM-12:** As a community member, I can change the password.
- **US-CM-13:** As a Community Member, I should be able to log out so that my data remains secure on shared devices.

### Facility Management
- **US-FM-01:** As a Facility Manager, I should be able to create an account so that I can log in to the application.
- **US-FM-02:** As a Facility Manager, I should be able to log in using my email and password.
- **US-FM-03:** As a Facility Manager, I should be able to log out so that my data remains secure on shared devices.
- **US-FM-04:** As a facility manager, I can be notified when a new ticket is submitted.
- **US-FM-05:** As a facility manager, I can view: building, floor, nearest room number, issue category, uploaded image and description.
- **US-FM-06:** As a facility manager, I can assign tickets to specific workers.
- **US-FM-07:** As a facility manager, I can change the ticket status to: pending, assigned and Resolved.
- **US-FM-08:** As a facility manager, I can filter tickets by building, floor, category, or status.
- **US-FM-09:** As a facility manager, I can view workers' profiles.
- **US-FM-10:** As a facility manager, I can merge similar requests submitted.
- **US-FM-11:** As a facility manager, I should be able to set a priority level to a task so that urgent tasks are handled first.

### Worker
- **US-W-01:** As a Worker, I should be able to create an account so that I can log in to the application.
- **US-W-02:** As a Worker, I should be able to log in using my email and password.
- **US-W-03:** As a Worker, I should be able to log out so that my data remains secure on shared devices.
- **US-W-04:** As a worker, I can only view tickets assigned to me.
- **US-W-05:** As a worker, I can see the exact location including: building, floor and nearest room number.
- **US-W-06:** As a Worker, I should be able to comment on an issue to indicate that the work is completed.
- **US-W-07:** As a Worker, I should be able to mark an issue as "In Progress".
- **US-W-08:** As a worker, I can upload a photo as proof of issue resolution.

### Admin
- **US-A-01:** As a System Admin, I should be able to log in so that I can access the application.
- **US-A-02:** As a System Admin, I should be able to log out so that my data remains secure on shared devices.
- **US-A-03:** As a system admin, I can create, suspend or delete user accounts.
- **US-A-04:** As system admin, I can enforce RBAC and assign roles (Community Member, Facility Management, Worker).
- **US-A-05:** As a system admin, I can monitor ticket statistics and system activity (Dashboard).
- **US-A-06:** As a system admin, I can reset passwords.

### UML Use-Case Diagram
[View UML Diagram](https://drive.google.com/file/d/12A5S9xHF6mlahFc3tPCpQ2scGIfV9KVF/view?usp=sharing)

---

## 3. Non-Functional Requirements

- **Response Time:** Page load times under three seconds
- **Concurrent Users:** Support for at least 500 simultaneous users
- **Image Upload Speed:** Images should upload within 5 seconds on stable networks
- **API Security:** Rate limiting and input validation
- **Backup & Recovery:** Automated daily backups with disaster recovery plan
- **Usability:** Intuitive UI such that tickets can be submitted in under one minute
- **Reliability:** Must handle image uploads robustly, even on unstable network connections

---

## 4. Constraints

### Technical Constraints
- Internet connectivity is required for all system operations
- Image uploads must be limited in size (max 5MB)

### Security Constraints
- Secure login (email/ID & password)
- User data must be protected using encryption (HTTPS)
- Role-based access control must be enforced

### Operational Constraints
- Daily automated backups must be performed
- The system depends on users to provide accurate issue data (location, description, photos)

### Design Constraints
- The UI must be simple and user-friendly for non-technical users
- The system should support clear status tracking (Pending, In Progress, Resolved)

---

## 5. ERD
[View ERD](https://drive.google.com/file/d/1er3mS3lHpX2PxW-LfY6QMcrZg_ksJ8uo/view?usp=sharing)

---

## 6. Technology Stack

- **Frontend:** React Native (Expo)
- **Backend:** Node.js (Express)
- **Database:** PostgreSQL
- **ORM:** Prisma

---

## 7. Future Scope

### GPS & Map Integration
Location services can automatically detect the user's location and display reported issues on a map for better tracking and visualization.

### Rating & Feedback System
Allow Community Members to rate and give feedback on completed issues, improving accountability and service quality.

### Multi-Language Support
Support multiple languages (e.g., English and Arabic) to make the system more accessible to a wider range of users.

---

## 8. Product Backlog

### Community Member
| Backlog ID | User Story ID | Priority |
|---|---|---|
| PB-CM-01 | US-CM-01 | High |
| PB-CM-02 | US-CM-02 | High |
| PB-CM-03 | US-CM-03 | High |
| PB-CM-04 | US-CM-04 | High |
| PB-CM-05 | US-CM-05 | High |
| PB-CM-06 | US-CM-06 | High |
| PB-CM-07 | US-CM-07 | High |
| PB-CM-08 | US-CM-08 | Medium |
| PB-CM-09 | US-CM-09 | Medium |
| PB-CM-10 | US-CM-10 | Low |
| PB-CM-11 | US-CM-11 | Low |
| PB-CM-12 | US-CM-12 | Low |
| PB-CM-13 | US-CM-13 | Medium |

### Facility Management
| Backlog ID | User Story ID | Priority |
|---|---|---|
| PB-FM-01 | US-FM-01 | High |
| PB-FM-02 | US-FM-02 | High |
| PB-FM-03 | US-FM-03 | High |
| PB-FM-04 | US-FM-04 | High |
| PB-FM-05 | US-FM-05 | High |
| PB-FM-06 | US-FM-06 | High |
| PB-FM-07 | US-FM-07 | High |
| PB-FM-08 | US-FM-08 | Medium |
| PB-FM-09 | US-FM-09 | Low |
| PB-FM-10 | US-FM-10 | Low |
| PB-FM-11 | US-FM-11 | Medium |

### Worker
| Backlog ID | User Story ID | Priority |
|---|---|---|
| PB-W-01 | US-W-01 | High |
| PB-W-02 | US-W-02 | High |
| PB-W-03 | US-W-03 | High |
| PB-W-04 | US-W-04 | High |
| PB-W-05 | US-W-05 | High |
| PB-W-06 | US-W-06 | Medium |
| PB-W-07 | US-W-07 | High |
| PB-W-08 | US-W-08 | Medium |

### Admin
| Backlog ID | User Story ID | Priority |
|---|---|---|
| PB-A-01 | US-A-01 | High |
| PB-A-02 | US-A-02 | High |
| PB-A-03 | US-A-03 | High |
| PB-A-04 | US-A-04 | High |
| PB-A-05 | US-A-05 | Medium |
| PB-A-06 | US-A-06 | Medium |
