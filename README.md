PinoyGig

PinoyGig is a full-stack freelance marketplace where clients post gigs, freelancers place bids, both sides collaborate in real time, and completed contracts flow into a built-in wallet and review system.

## Highlights

- Secure authentication with JWT, HttpOnly cookies, and protected routes
- Home-page search plus full gig browsing with query filtering
- Gig creation, editing, deletion, owner views, and public profile views
- Bid submission, bid tracking, and atomic hiring flow for clients
- Contract completion request flow before final completion
- Real-time gig chat with unread counts, presence, typing, and message history
- Review and rating system after gig completion
- Wallet summary with payouts, spending, tax tracking, and transaction history
- Admin dashboard for users, gigs, wallet-tax visibility, and moderation
- Socket.io notifications for platform events and live presence updates

## Current Features

### Marketplace
- Post gigs with title, description, category, and budget
- Browse all gigs and search by keyword
- View gig details and public creator profiles
- Track personal activity through My Gigs and My Bids

### Hiring and Completion
- Freelancers can submit one bid per gig with message and price
- Clients can review bids and hire one freelancer
- The hiring step is protected with atomic backend updates to avoid race conditions
- Clients and freelancers can request or confirm gig completion

### Messaging and Realtime
- Dedicated gig chat for participants on the same project
- Conversation list with unread message summaries
- Online presence and typing indicators through Socket.io rooms
- Toast notifications for live events

### Reputation and Wallet
- Reviews and ratings tied to users after work is completed
- Wallet page showing available balance, total earnings, total spent, tax rate, and transaction feed
- Verified wallet admin receives platform tax revenue separately from regular users

### Admin Tools
- Role-based admin dashboard at `/admin`
- User and gig moderation endpoints
- Dashboard stats for users, gigs, live usage, and verified tax wallet details

## Tech Stack

### Frontend
- React 19 with Vite
- React Router
- Tailwind CSS
- Context API
- Axios
- Socket.io Client
- Lucide React

### Backend
- Node.js
- Express 5
- MongoDB with Mongoose
- JWT + bcryptjs
- Cookie Parser and CORS
- Socket.io

## Project Structure

```text
test/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   ├── utils/
│   ├── package.json
│   └── server.js
├── .env.example
└── README.md
```

## Frontend Routes

- `/` Home page with search and featured calls to action
- `/login` Login page
- `/register` Registration page
- `/gigs` Browse and search all gigs
- `/gigs/:id` Gig details and bid interaction
- `/post-gig` Create a new gig
- `/my-gigs` Owner dashboard for created gigs
- `/my-bids` Freelancer dashboard for submitted bids
- `/profile` Current user profile
- `/profile/:id` Public profile page
- `/messages` Conversation inbox
- `/messages/:gigId` Direct gig chat thread
- `/wallet` Protected wallet summary page
- `/admin` Protected admin dashboard

## API Overview

### Authentication and Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and set auth cookie |
| POST | `/api/auth/logout` | Logout and clear cookie |
| GET | `/api/auth/me` | Get current authenticated user |
| GET | `/api/auth/public/:id` | Get a public user profile |
| PATCH | `/api/auth/update-profile` | Update current user profile |
| GET | `/api/auth/wallet` | Get wallet summary and transactions |

### Gigs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/gigs` | Get gigs, optionally filtered by search |
| GET | `/api/gigs/owner/:userId` | Get gigs by owner |
| GET | `/api/gigs/my-gigs` | Get current user's gigs |
| GET | `/api/gigs/:id` | Get single gig details |
| POST | `/api/gigs` | Create a gig |
| PUT | `/api/gigs/:id` | Update a gig |
| DELETE | `/api/gigs/:id` | Delete a gig |
| PATCH | `/api/gigs/:id/request-complete` | Request gig completion |
| PATCH | `/api/gigs/:id/complete` | Mark gig complete |

### Bids
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bids` | Submit a bid |
| GET | `/api/bids/my-bids` | Get current user's bids |
| GET | `/api/bids/gig/:gigId` | Get bids for a gig |
| PATCH | `/api/bids/:id/hire` | Hire a freelancer |

### Reviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reviews/user/:userId` | Get reviews for a user |
| POST | `/api/reviews` | Create a review |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chats/summary` | Get unread chat summary |
| GET | `/api/chats/conversations` | Get chat conversation list |
| GET | `/api/chats/gig/:gigId/access` | Check access to a gig chat |
| GET | `/api/chats/gig/:gigId` | Get gig chat messages |
| PATCH | `/api/chats/gig/:gigId/read` | Mark a gig chat as read |
| POST | `/api/chats/gig/:gigId` | Send a gig chat message |
| DELETE | `/api/chats/gig/:gigId/:messageId` | Delete a gig chat message |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Get admin dashboard stats |
| GET | `/api/admin/users` | Get users for moderation |
| GET | `/api/admin/gigs` | Get gigs for moderation |
| DELETE | `/api/admin/users/:id` | Delete a user |
| DELETE | `/api/admin/gigs/:id` | Delete a gig |

## Environment Variables

Create a root `.env` file based on `.env.example`:

```env
MONGODB_URI=mongodb://localhost:27017/gigflow
JWT_SECRET=your_jwt_secret_key_here_change_in_production
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Optional wallet admin seed values
# ADMIN_USER_ID=
# ADMIN_NAME=PinoyGig Admin
# ADMIN_EMAIL=admin@pinoygig.com
# ADMIN_PASSWORD=Admin123!
```

## Getting Started

### Prerequisites
- MongoDB running locally or on Atlas
- Node.js 20.19 or newer recommended for the Vite frontend build

### Install Dependencies

```bash
cd server
npm install

cd ../client
npm install
```

### Configure Environment

```bash
copy .env.example .env
```

Update `.env` with your MongoDB URI, JWT secret, and client URL.

### Seed or Promote the Wallet Admin

```bash
cd server
npm run seed:admin
```

If you already have an existing account that should own the verified tax wallet, set `ADMIN_USER_ID` first.

### Run the App

Backend:

```bash
cd server
npm run dev
```

Frontend:

```bash
cd client
npm run dev
```

Open `http://localhost:5173` in the browser.

## Key Workflows

### Hiring Flow
1. A client posts a gig.
2. Freelancers submit bids.
3. The client hires one freelancer.
4. Backend logic atomically updates the selected bid, gig assignment, and the rest of the bids.
5. The relevant users receive real-time updates.

### Completion and Wallet Flow
1. A participant requests gig completion.
2. The other participant confirms completion.
3. Freelancer payout is released.
4. Platform tax is credited to the verified wallet admin.
5. Wallet transaction history becomes visible in the wallet page.

### Chat Flow
1. Users join a gig chat after access is verified.
2. Messages stream in real time through Socket.io.
3. Presence, unread counts, and typing events update live.

## Notes

- Admin access is role-based through `User.role === 'admin'`.
- Wallet admin ownership is tracked separately through `isWalletAdmin`.
- The favicon and brand assets now use the PinoyGig mark in the client public assets.

## License

ISC for the original codebase foundation. Project-specific PinoyGig branding and modifications are maintained in this repository.