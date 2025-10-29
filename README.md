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
VITE_API_BASE_URL=base_url_here
VITE_CLIENT_SERVICE=your_client_service_here
VITE_AUTH_KEY=your_auth_key_here
VITE_RURL=your_rurl_here
```

**Important Notes:**
- Replace the placeholder values with your actual API credentials
- Never commit the `.env` file to version control (it's already in `.gitignore`)
- Contact your backend team or project administrator for these values

### Step 4: Run the Development Server

Now that everything is set up, start the development server:

```bash
npm run dev
```

You should see output like this:

```
  VITE v7.0.4  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Open your browser and go to `http://localhost:5173` to see the application running.

### Step 5: Build for Production

When you're ready to deploy the application, create a production build:

```bash
npm run build
```

This will create an optimized production build in the `dist` folder with:
- Minified JavaScript and CSS
- Code splitting for better performance
- Removed console logs and debuggers
- Optimized assets

To preview the production build locally:

```bash
npm run preview
```

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

### For Administrators
- **Dashboard & Analytics**: Real-time statistics and charts for member activity, payments, and events
- **Member Management**: Complete member lifecycle management (active, inactive, pending approval, expired)
- **Event Management**: Create, schedule, and track events with attendance management
- **Financial Tracking**: Monitor payments, dues, and generate financial reports
- **Document Management**: Upload and manage documents, resumes, and files
- **Communication Tools**: Send circulars, manage feedback, and handle grievances
- **Role Management**: Granular access control and permission management
- **Settings Configuration**: Customize membership plans, additional fields, SMTP, and master settings

### For Members (Users)
- **Personal Dashboard**: View overview statistics and upcoming events
- **Profile Management**: Update personal and business information
- **Document Upload**: Upload resumes, documents, and additional fields
- **Event Participation**: Browse events, register, and view past events
- **Business Services**: Showcase products and services to other members
- **Communication**: Submit feedback, grievances, and enquiries
- **Member Directory**: Search and connect with other members
- **Payment History**: Track dues and payment records

## Technology Stack

- **Frontend Framework**: React 19.1.0
- **Routing**: React Router DOM 7.6.3
- **Styling**: Tailwind CSS 3.4.3
- **State Management**: React Context API
- **HTTP Client**: Axios 1.10.0
- **Build Tool**: Vite 7.0.4
- **Rich Text Editor**: Tiptap 3.2.1
- **Charts**: Recharts 3.1.0
- **Notifications**: React Toastify 11.0.5
- **Icons**: React Icons 5.5.0, Lucide React 0.525.0
- **File Processing**: jsPDF 3.0.1, jsPDF AutoTable 5.0.2, XLSX 0.18.5

## Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## Common Issues & Troubleshooting

### Port Already in Use

**Error**: `Error: Port 5173 is already in use`

**Solution**: 
1. Find what's using the port: `lsof -i :5173` (Mac/Linux) or `netstat -ano | findstr :5173` (Windows)
2. Kill the process, or
3. Run on a different port: `npm run dev -- --port 3000`

### Module Not Found Errors

**Error**: `Cannot find module 'xyz'`

**Solution**:
1. Delete `node_modules` folder and `package-lock.json`
2. Clear npm cache: `npm cache clean --force`
3. Reinstall: `npm install`

### API Connection Issues

**Error**: Network errors or 404s when calling API

**Solution**:
1. Verify your `.env` file exists and has correct values
2. Check if your backend server is running
3. Restart the dev server after changing `.env` (Vite doesn't auto-reload env changes)
4. Check browser console for CORS errors

### Authentication Issues

**Error**: Getting redirected to login, even after logging in

**Solution**:
1. Check localStorage in browser DevTools (Application tab)
2. Look for `token` and `userRole` keys
3. Clear localStorage and try logging in again
4. Check if your API is returning valid tokens

### Build Errors

**Error**: Build fails with syntax errors

**Solution**:
1. Run linter: `npm run lint` to see errors
2. Fix the linting errors in the reported files
3. Some warnings can be ignored, but errors must be fixed

### White Screen on Route Navigation

**Error**: Page shows blank after navigation

**Solution**:
1. Open browser console (F12) and check for errors
2. Verify the route exists in `App.jsx`
3. Check if the component file exists in the correct directory
4. Ensure the component is properly exported

## Development Workflow

### Typical Development Session

1. **Pull latest changes**: `git pull origin master`
2. **Install new dependencies** (if any): `npm install`
3. **Start dev server**: `npm run dev`
4. **Make your changes** in the `src/` folder
5. **Test your changes** in the browser (hot reload is enabled)
6. **Check for linting errors**: `npm run lint`
7. **Commit your changes**: `git add .` then `git commit -m "Your message"`
8. **Push to repository**: `git push origin your-branch`

### Code Style

- Use functional components with hooks
- Follow React naming conventions (PascalCase for components)
- Keep components small and focused
- Use meaningful variable and function names
- Add comments for complex logic

## Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository** to your GitHub account
2. **Create a feature branch**: `git checkout -b feature/your-feature-name`
3. **Make your changes** and test them thoroughly
4. **Commit your changes**: `git commit -m "Add your feature description"`
5. **Push to your fork**: `git push origin feature/your-feature-name`
6. **Open a Pull Request** on the main repository

### Before Submitting

- Run the linter to ensure code quality
- Test your changes in different browsers
- Update documentation if you add new features
- Follow the existing code style
