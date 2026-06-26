# EasyFind - Smart Lost & Found Management System
EasyFind is a full-stack web application designed to simplify the process of reporting, searching, and recovering lost items within educational institutions. The platform provides separate portals for users and administrators, enabling secure item management, real-time status tracking, and efficient communication.
## Features
### User Portal
- User Registration & Login
- Report Lost Items
- Report Found Items
- Search Lost & Found Listings
- Item Status Tracking
- User Dashboard
- Secure Authentication
### Admin Portal
- Admin Login
- Manage Users
- Verify Lost & Found Reports
- Approve or Reject Listings
- Dashboard with Statistics
- Update Item Status
- Manage Categories
---
## Tech Stack
### Frontend
- React.js
- HTML5
- CSS3
- JavaScript
- Axios
### Backend
- Node.js
- Express.js
### Database
- MongoDB
- Mongoose
### Authentication
- JWT (JSON Web Token)
- bcrypt.js
### Tools
- Git
- GitHub
- VS Code
---
## Project Structure
EasyFind/
│
├── be9-easyfind/          # Backend (Node.js + Express)
├── fe9-easyfind-admin/    # Admin Dashboard (React)
├── fe9-easyfind-child/    # User Portal (React)
└── README.md
---
## Installation
### Clone Repository
```bash
git clone https://github.com/Saniya-2022/EasyFind.git
```
```bash
cd EasyFind
```
---
## Backend Setup

```bash
cd be9-easyfind
npm install
npm run dev
```
---
## Admin Frontend Setup
```bash
cd fe9-easyfind-admin
npm install
npm start
```
---
## User Frontend Setup
```bash
cd fe9-easyfind-child
npm install
npm start
```
---
## Environment Variables

Create a `.env` file inside the backend folder.
```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```
---
## Workflow
1. User registers and logs in.
2. User reports a lost or found item.
3. Admin reviews the submitted report.
4. Admin approves or rejects the listing.
5. Approved items become visible to all users.
6. Users search for matching items.
7. Item status is updated once recovered.
---
## Future Enhancements
- QR Code based item verification
- AI-powered image matching
- Email notifications
- Mobile application
- OCR for automatic item description
- Real-time chat between finder and owner
- Location-based item search
---
## Screenshots

<img width="1899" height="1010" alt="image" src="https://github.com/user-attachments/assets/64e8fb6a-2007-4eb6-bd5f-56390a2aa79d" />
<img width="1874" height="985" alt="image" src="https://github.com/user-attachments/assets/b60219ab-aeed-4c3d-8668-29be37415bb0" />


---
## License

This project is developed for educational and academic purposes.
