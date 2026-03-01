# OpenLoop

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                        ⚠️  IMPORTANT DISCLAIMER  ⚠️                         ║
║                                                                              ║
║   This project was ENTIRELY conceived, built, debugged, deployed, and is     ║
║   managed by autonomous AI agents. No humans wrote any code here.            ║
║                                                                              ║
║   This disclaimer is the ONLY piece of human-written content in this repo.   ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

OpenLoop is a self-hosted feedback collection and management platform. Collect feedback from your users via an embeddable widget, manage it in an admin dashboard, and publish your roadmap and announcements.

## Features

- **Embeddable Widget** - Add a floating feedback button to any website
- **Voting System** - Users can vote on feedback ideas (one vote per user)
- **Public Roadmap** - Display your product roadmap with status stages (Idea → Planned → In Progress → Completed)
- **Announcements** - Post changelogs and product updates
- **Admin Dashboard** - Manage feedback, posts, and announcements
- **Multiple Organizations** - Support for multiple organizations/teams
- **Custom Branding** - Customize accent colors and widget position
- **Email Notifications** - Get notified when users submit feedback, vote, or when status changes

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (Supabase recommended)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/openloop/feedback-hub.git
cd openloop
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```env
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up the database:
Run the migration in `supabase/migrations/001_schema.sql` via the Supabase SQL editor.

5. Start the development server:
```bash
npm run dev
```

Visit `http://localhost:4321` to access the application.

### Building for Production

```bash
npm run build
npm run preview
```

## Usage

### Embedding the Widget

Add this script to your website, replacing `YOUR_ORG_SLUG` with your organization's slug:

```html
<script>
  window.OpenLoop = {
    org: 'YOUR_ORG_SLUG',
    userId: 'USER_ID_FROM_YOUR_APP', // Optional: for tracked feedback
    accentColor: '#6366f1', // Optional: customize button color
    anchor: 'right' // Optional: 'left' or 'right'
  };
</script>
<script src="https://your-domain.com/embed.js"></script>
```

### Widget Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `org` | string | required | Your organization's slug |
| `userId` | string | - | Unique user identifier for tracked feedback |
| `userName` | string | - | Pre-fill user name |
| `userEmail` | string | - | Pre-fill user email |
| `accentColor` | string | `#6366f1` | Button background color |
| `anchor` | string | `right` | Widget position (`left` or `right`) |
| `showFloatingButton` | boolean | `true` | Show/hide the floating button |

### Programmatic Control

```javascript
// Open the widget
window.OpenLoop.open();

// Close the widget
window.OpenLoop.close();

// Toggle the widget
window.OpenLoop.toggle();
```

## Project Structure

```
/
├── public/
│   └── embed.js          # Embeddable widget script
├── src/
│   ├── components/
│   │   ├── AdminPosts.tsx    # Admin feedback management
│   │   ├── AdminAnnouncements.tsx  # Admin announcements
│   │   ├── AdminSettings.tsx # Admin settings
│   │   ├── FeedbackForm.tsx  # User feedback form
│   │   ├── OrgNav.tsx        # Organization navigation
│   │   ├── OrgFooter.tsx    # Organization footer
│   │   ├── OrgSwitcher.tsx  # Organization switcher
│   │   ├── OrganizationProvider.tsx # Org context provider
│   │   ├── RoadmapBoard.tsx  # Public roadmap board
│   │   ├── Toast.tsx         # Toast notifications
│   │   ├── Widget.tsx       # Feedback widget component
│   │   └── ...
│   ├── layouts/
│   │   ├── AdminLayout.astro    # Admin dashboard layout
│   │   └── Layout.astro         # Base layout
│   ├── lib/
│   │   ├── auth.tsx         # Auth utilities
│   │   ├── markdown.ts       # Markdown parsing
│   │   └── supabase.ts       # Supabase client & types
│   └── pages/
│       ├── admin/            # Admin dashboard pages
│       ├── ~/                # Public organization pages
│       ├── widget.astro      # Widget iframe endpoint
│       ├── api/              # API endpoints
│       └── index.astro       # Landing page
├── supabase/
│   └── migrations/          # Database migrations
├── astro.config.mjs
├── package.json
└── tailwind.config.mjs
```

## Configuration

### Email Notifications

To enable email notifications, add Resend API key to your environment:

```env
RESEND_API_KEY=re_123456789
```

Configure notification preferences in the admin dashboard settings.

## API Reference

### Widget Endpoints

- `GET /widget` - Widget iframe endpoint (loads in iframe)
- `GET /~/{org}/feedback` - Public feedback page
- `GET /~/{org}/roadmap` - Public roadmap page
- `GET /~/{org}/announcements` - Public announcements page

### Admin Endpoints

- `GET /admin` - Admin dashboard
- `GET /admin/login` - Admin login
- `GET /admin/posts` - Manage feedback posts
- `GET /admin/announcements` - Manage announcements
- `GET /admin/settings` - Organization settings

## Tech Stack

- **Framework**: Astro with React
- **Database**: PostgreSQL (via Supabase)
- **Styling**: Tailwind CSS
- **Auth**: Supabase Auth
- **Email**: Resend
- **Deployment**: Node.js adapter

## Contributing

Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md) before submitting PRs.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

Built with [Astro](https://astro.build), [Supabase](https://supabase.com), and [Tailwind CSS](https://tailwindcss.com).
