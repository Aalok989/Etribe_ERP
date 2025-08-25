# Etribe - Member Management System

Hey there! 👋 This is Etribe, a web-based member management system built with React. It's designed to help organizations manage their members, events, payments, and all the admin stuff that comes with running a membership-based business.

## What This Thing Does

Think of it as a digital filing cabinet for your organization, but way cooler. Here's what you can do with it:

- **Member Management**: Keep track of who's who, their profiles, and membership status
- **Event Handling**: Plan events, track attendance, and manage calendars
- **Payment Tracking**: Monitor dues, payments, and financial records
- **Document Management**: Store and organize important files and documents
- **Admin Controls**: Give different people different levels of access

## Tech Stack

We built this using modern web technologies:

- **Frontend**: React with hooks, Tailwind CSS for styling
- **Routing**: React Router for navigation
- **State Management**: React Context for global state
- **HTTP Client**: Axios for API calls
- **Build Tool**: Vite for fast development

## Getting Started

### Prerequisites

Make sure you have Node.js installed (version 16 or higher should work fine).

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd Etribe-Main
```

2. Install dependencies:
```bash
npm install
```

3. Set up your environment variables:
Create a `.env` file in the root directory and add your API configuration:
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

```
src/
├── components/          # Reusable UI components
│   ├── admin/          # Admin-specific components
│   ├── user/           # User-specific components
│   └── shared/         # Components used by both
├── pages/              # Main page components
│   ├── admin/          # Admin pages
│   └── user/           # User pages
├── context/            # React Context providers
├── api/                # API configuration
└── utils/              # Helper functions
```

## Features

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

Feel free to contribute! Here's how:

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
