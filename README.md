# Etribe - Member Management System

A comprehensive web-based member management platform built with React for organizations to manage members, events, payments, and administrative operations efficiently.

## What is Etribe?

Etribe is a membership management platform that helps organizations handle everything from member registrations to event management. Think of it as a centralized hub where admins can manage all organizational activities, and members can access their information, submit requests, and interact with the community.

Whether you're running a chamber of commerce, trade association, or any membership-based organization, Etribe provides the tools you need to streamline operations.

## Prerequisites

Before you start, make sure you have these installed:

1. **Node.js**: Version 18 or higher
2. **npm**: Comes with Node.js (version 7 or higher)
3. **Git**: For cloning the repository
4. **Code Editor**: VS Code, WebStorm, or any IDE of your choice

To verify your installations, run these commands in your terminal:

```bash
node --version
npm --version
git --version
```

## Installation & Setup

### Step 1: Clone the Repository

First, you need to get the code on your local machine. Open your terminal and run:

```bash
git clone https://gitea.ezhrm.in/30Days/Etribe
```

Or if you're using SSH:

```bash
git clone git@gitea.ezhrm.in/30Days/Etribe
```

Then navigate to the project directory:

```bash
cd Etribe-main
```

### Step 1.1: Git Setup (If starting fresh)

If you're starting with a new project or want to set up Git properly:

```bash
# Initialize Git repository
git init

# Check current status
git status

# Add remote origin (replace with your actual repository URL)
git remote add origin https://gitea.ezhrm.in/30Days/Etribe

# Pull the latest changes from the main branch
git pull origin main

# Or if your default branch is master
git pull origin master
```

**Note**: Replace `your-username` and `Etribe-main` with your actual GitHub username and repository name.

### Step 2: Install Dependencies

Once you're in the project directory, install all the required packages. This might take a few minutes:

```bash
npm install
```

This command will:
- Read the `package.json` file
- Download all the dependencies listed in it
- Create a `node_modules` folder with all packages
- Install dev dependencies for development

**Common Issues at This Step:**
- If you get permission errors, try: `sudo npm install` (Mac/Linux) or run terminal as Administrator (Windows)
- If download is stuck, clear npm cache: `npm cache clean --force` then try again
- If you see version conflicts, delete `node_modules` and `package-lock.json`, then reinstall

### Step 3: Set Up Environment Variables

For the application to communicate with the backend API, you need to create an environment file.

Create a new file called `.env` in the root directory of your project (same level as `package.json`):

```bash
# On Windows (PowerShell)
New-Item .env

# On Mac/Linux
touch .env
```

Then add these environment variables to the `.env` file:

```env
VITE_API_BASE_URL=your_api_url_here
VITE_CLIENT_SERVICE=your_client_service
VITE_AUTH_KEY=your_auth_key
VITE_RURL=your_rurl
```

4. Start the development server:
```bash
npm run dev
```

The app should now be running at `http://localhost:5173`

## Project Structure

Here's how the project is organized:

```
Etribe-test/
├── public/                      # Static assets served as-is
│   └── vite.svg
├── src/
│   ├── api/                     # API configuration
│   │   └── axiosConfig.js      # Axios setup and interceptors
│   ├── assets/                  # Images, logos, and other static files
│   │   ├── company-logo/       # Company branding assets
│   │   ├── images/             # General images
│   │   └── logos/              # Logo files
│   ├── components/              # Reusable components
│   │   ├── admin/              # Admin-specific components
│   │   │   ├── AnalyticsGraph/
│   │   │   ├── ImportantContacts/
│   │   │   ├── Layout/         # DashboardLayout, Footer, TopBar
│   │   │   ├── Sidebar/
│   │   │   ├── StatusCards/
│   │   │   ├── UpcomingEvents/
│   │   │   └── UploadAttendanceModal.jsx
│   │   ├── user/               # User-specific components
│   │   │   └── (Similar structure to admin)
│   │   └── shared/             # Shared components (used by both)
│   │       └── RichTextEditor.jsx
│   ├── context/                 # React Context providers
│   │   ├── ContactsContext.jsx
│   │   ├── DashboardContext.jsx
│   │   └── GroupDataContext.jsx
│   ├── pages/                   # Page components
│   │   ├── admin/              # All admin pages (Dashboard, Members, Events, etc.)
│   │   ├── user/               # All user pages
│   │   └── shared/             # Shared pages
│   │       └── Login.jsx
│   ├── utils/                   # Utility functions
│   │   └── apiHeaders.js       # Header helpers for API calls
│   ├── App.jsx                  # Main app component with routing
│   ├── main.jsx                 # Application entry point
│   └── index.css                # Global styles
├── .env                         # Environment variables (not in git)
├── .env.example                 # Example environment file
├── .gitignore                   # Git ignore rules
├── eslint.config.js             # ESLint configuration
├── index.html                   # HTML template
├── package.json                 # Project dependencies and scripts
├── postcss.config.cjs           # PostCSS configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── vite.config.js               # Vite configuration
└── README.md                    # This file
```

## Key Features

### For Admins
- Dashboard with overview statistics
- Member management (add, edit, delete)
- Event creation and management
- Payment tracking and reports
- User role management
- Document approval system

### For Users
- Personal profile management
- Business profile updates
- Document upload and management
- Payment history
- Event participation
- Communication tools

## Common Issues & Solutions

### White Screen on Member Detail Page
If you're seeing a white screen when trying to access member details, check that:
1. The route includes a member ID (e.g., `/user/member-detail/me`)
2. Your authentication token is valid
3. The API endpoints are accessible

### API 404 Errors
Some endpoints might not exist yet. The system has fallback logic, but if you're getting consistent 404s, check your API configuration.

## Development Notes

- The app uses a role-based access control system
- Admin routes are prefixed with `/admin/*`
- User routes are prefixed with `/user/*`
- Authentication is handled via localStorage tokens (you might want to implement proper JWT handling for production)

## Contributing

We welcome contributions! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you run into issues or have questions:
- Check the console for error messages
- Look at the network tab in dev tools for API failures
- Make sure all environment variables are set correctly

---

That's it! This should get you up and running. The codebase is pretty straightforward once you get the hang of it. Happy coding! 🚀
