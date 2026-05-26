# DeskFlow — Support Ticket Triage Board

A full-stack MERN application for managing support tickets with SLA tracking, status transitions, and an interactive board-style UI.

## Tech Stack

- **Frontend**: React (Vite), Vanilla CSS
- **Backend**: Node.js, Express
- **Database**: MongoDB Atlas
- **Deployment**: Netlify (frontend), Render (backend)

## Features

- Kanban-style board with four status columns
- Priority-based SLA tracking with breach indicators
- Status transition rules (forward one step, backward one step)
- Combined filters (priority + SLA breached)
- Drag-and-drop between columns
- Real-time stats strip
- Inline form validation

## Getting Started

### Backend

```bash
cd backend
npm install
cp .env.example .env  # Add your MongoDB URI
npm run dev
```

### Frontend

```bash
cd frontend
npm install
VITE_API_URL=http://localhost:5000 npm run dev
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /tickets | Create a ticket |
| GET | /tickets | List tickets (supports ?status, ?priority, ?breached filters) |
| PATCH | /tickets/:id | Update ticket status |
| DELETE | /tickets/:id | Delete a ticket |
| GET | /tickets/stats | Aggregate counts |

## Author

Rohit Kumawat — rohitkumawat230989@acropolis.in
