# Murakkaz Articles Platform

## 1. Introduction

### 1.1 Purpose

This document describes the Murakkaz articles platform. The platform is a web application for publishing and managing programming articles.

### 1.2 Scope

The platform provides these main functions:

- Display articles to readers
- Create and edit articles (admin only)
- Search articles by keyword
- Subscribe to newsletter
- Manage article tags
- Rate limit API requests

### 1.3 Audience

This document is for:

- Developers who work on the codebase
- System administrators who deploy the application
- Contributors who add features

## 2. Technology Stack

### 2.1 Frontend

- **Framework**: Next.js 16.2.1 (App Router)
- **Language**: TypeScript 5.9.3
- **Styling**: Tailwind CSS 4
- **State Management**: TanStack React Query 5.85.5
- **UI Components**: Custom components with Sonner 2.0.7 for toasts

### 2.2 Backend

- **Runtime**: Next.js API Routes
- **Database**: MongoDB 6.18.0
- **Authentication**: NextAuth 4.24.13 (GitHub OAuth)
- **Image Storage**: Cloudinary 2.9.0
- **Email**: Nodemailer 7.0.5

### 2.3 Development Tools

- **Linting**: ESLint 9 with Next.js config
- **Package Manager**: npm
- **Build Tool**: Next.js with Turbopack

## 3. Project Structure

```
murakkaz-articles-platform/
├── app/                          # Next.js App Router pages
│   ├── _Articles/                # Article display components
│   ├── _components/              # Shared UI components
│   ├── api/                      # API routes
│   │   ├── admin/                # Admin API endpoints
│   │   ├── articles/             # Public article API
│   │   ├── auth/                 # NextAuth endpoints
│   │   ├── cloudinary/           # Image upload API
│   │   ├── confirm/              # Email confirmation API
│   │   ├── contact/              # Contact form API
│   │   ├── search/               # Search API
│   │   ├── shiki/                # Code highlighting API
│   │   ├── subscribe/            # Newsletter subscribe API
│   │   ├── tags/                 # Tags API
│   │   └── unsubscribe/          # Newsletter unsubscribe API
│   ├── article/                  # Article detail page
│   ├── about-yazn-108/           # About page
│   ├── confirm/                  # Email confirmation page
│   ├── dashboard/                # Admin dashboard
│   ├── rate-limit/               # Rate limit page
│   ├── subscription/             # Newsletter subscription page
│   ├── tags/                     # Tag filtered articles page
│   ├── terms-of-use/             # Terms of use page
│   ├── unsubscribe/              # Newsletter unsubscribe page
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   ├── robots.ts                 # Robots.txt generation
│   ├── rss.xml                   # RSS feed generation
│   └── sitemap.ts                # Sitemap generation
├── hooks/                        # Custom React hooks
├── lib/                          # Utility libraries
│   ├── cloudinary.ts             # Cloudinary configuration
│   ├── mongodb.ts                # MongoDB connection
│   ├── rateLimiter.ts            # Rate limiting logic
│   └── security.ts               # Security utilities
├── types/                        # TypeScript type definitions
│   ├── Articles.ts               # Article types
│   └── Search.ts                 # Search types
├── public/                       # Static assets
├── .gitignore
├── eslint.config.mjs
├── index.html
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── proxy.ts
├── tsconfig.json
└── README.md
```

## 4. Features

### 4.1 Article Management

- **Display**: Articles show on home page with infinite scroll
- **Pagination**: 6 articles per page
- **Tags**: Filter articles by tag
- **Search**: Real-time search by title
- **Detail View**: Full article with code blocks and images
- **Admin CRUD**: Create, read, update, delete articles

### 4.2 Article Structure

Each article contains:

- Unique slug (URL identifier)
- Title
- Banner image (stored on Cloudinary)
- Tag (lowercase)
- Description
- Creation date
- Content blocks (text, code, images)
- Subscriber notification status

### 4.3 Authentication

- **Provider**: GitHub OAuth only
- **Admin Access**: Email-based authorization
- **Session**: JWT tokens via NextAuth
- **Dashboard**: Protected admin routes

### 4.4 Newsletter System

- **Subscribe**: Email collection with double opt-in
- **Confirm**: Token-based email verification
- **Unsubscribe**: Token-based unsubscribe
- **Notifications**: Automatic email on new article
- **Rate Limited**: Separate limiters for subscribe and confirm

### 4.5 Search

- **Endpoint**: `/api/search/[word]`
- **Real-time**: Debounced input with results modal
- **Results**: Article titles with links

### 4.6 Rate Limiting

- **Article API**: 30 requests per minute
- **Subscribe API**: 5 requests per hour
- **Confirm API**: 10 requests per hour
- **Unsubscribe API**: 5 requests per hour
- **Tags API**: 60 requests per minute
- **Feedback**: Visual countdown timer on limit exceeded

### 4.7 SEO and Metadata

- **Open Graph**: Arabic locale, custom images
- **Twitter Cards**: Large image format
- **JSON-LD**: Structured data for WebSite
- **Sitemap**: Auto-generated
- **Robots**: Auto-generated
- **RSS Feed**: Auto-generated

## 5. Installation

### 5.1 Prerequisites

- Node.js 20 or later
- npm 10 or later
- MongoDB database
- GitHub OAuth application
- Cloudinary account
- SMTP server for emails

### 5.2 Environment Variables

Create `.env.local` with these variables:

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
GITHUB_ID=your_github_oauth_client_id
GITHUB_SECRET=your_github_oauth_client_secret
ADMIN_EMAIL=your_admin_email@example.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Nodemailer)
SMTP_HOST=your_smtp_host
SMTP_PORT=your_smtp_port
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
EMAIL_FROM=your_from_email@example.com

# Backup (Optional)
BACKUP_REPO_TOKEN=your_github_token_for_backup
```

### 5.3 Install Dependencies

```bash
npm install
```

### 5.4 Run Development Server

```bash
npm run dev
```

The application starts at `http://localhost:3000` with Turbopack.

### 5.5 Build for Production

```bash
npm run build
npm run start
```

### 5.6 Lint Code

```bash
npm run lint
```

## 6. Deployment

### 6.1 Vercel (Recommended)

1. Connect repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main

### 6.2 Docker

Create `Dockerfile`:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### 6.3 Environment Setup

- Set all environment variables in deployment platform
- Configure custom domain if needed
- Enable HTTPS

## 7. API Reference

### 7.1 Public Endpoints

#### Get Articles

```
GET /api/articles?page=1&limit=6
```

Response: `ArticlesResponse`

#### Get Articles by Tag

```
GET /api/tags/[tag]?page=1&limit=6
```

Response: `ArticlesResponse`

#### Get Single Article

```
GET /api/articles/[articleSlug]
```

Response: `ArticleTY`

#### Search Articles

```
GET /api/search/[word]
```

Response: `{ articles: ArticleTY[] }`

#### Get Tags

```
GET /api/tags
```

Response: `{ tags: string[] }`

### 7.2 Admin Endpoints (Require Authentication)

#### Get All Articles (Admin)

```
GET /api/admin/articles?page=1&limit=6
```

Headers: `Authorization: Bearer <token>`

#### Create Article

```
POST /api/admin/articles
Content-Type: application/json
Body: ArticleTY (without _id)
```

#### Update Article

```
PUT /api/admin/articles/[articleSlug]
Content-Type: application/json
Body: Partial<ArticleTY>
```

#### Delete Article

```
DELETE /api/admin/articles/[articleSlug]
```

#### Newsletter Subscribers

```
GET /api/admin/newsletter
```

### 7.3 Newsletter Endpoints

#### Subscribe

```
POST /api/subscribe
Content-Type: application/json
Body: { email: string }
```

#### Confirm Subscription

```
GET /confirm/[subscriberToken]
```

#### Unsubscribe

```
GET /unsubscribe/[subscriberToken]
```

### 7.4 Utility Endpoints

#### Upload Image

```
POST /api/cloudinary
Content-Type: multipart/form-data
Body: FormData with file
```

#### Code Highlighting

```
POST /api/shiki
Body: { code: string, language: string }
```

#### Contact Form

```
POST /api/contact
Body: { name: string, email: string, message: string }
```

## 8. Data Models

### 8.1 ArticleTY

```typescript
{
  _id?: string              // MongoDB ObjectId
  SubscribersNotified: boolean  // Email sent flag
  slug: string              // URL slug (unique)
  title: string             // Article title
  banner: ImageType         // Banner image
  tag: string               // Category tag (lowercase)
  createdAt: Date           // Creation timestamp
  description: string       // Short description
  blocks?: ArticleBlock[]   // Content blocks
}
```

### 8.2 ImageType

```typescript
{
  url: string; // Cloudinary URL
  public_id: string; // Cloudinary public ID
  alt: string; // Alt text
}
```

### 8.3 ArticleBlock

```typescript
{
  id: string                // Unique block ID
  title?: string | null     // Optional block title
  content?: string | null   // Text content (Markdown)
  code?: CodeBlock | null   // Code block
  image?: ImageType | null  // Image block
}
```

### 8.4 CodeBlock

```typescript
{
  language?: string         // Programming language
  content?: string          // Code content
}
```

### 8.5 ArticlesResponse

```typescript
{
  articles: ArticleTY[]
  pagination: {
    page: number
    limit: number
    totalCount: number
    hasMore: boolean
    totalPages: number
  }
}
```

## 9. Development Guidelines

### 9.1 Code Style

- Use TypeScript strict mode
- Follow ESLint rules
- Use functional components with hooks
- Prefer server components when possible
- Use dynamic imports for heavy components

### 9.2 Naming Conventions

- Files: PascalCase for components, camelCase for utilities
- Variables: camelCase
- Types: PascalCase with descriptive names
- Constants: UPPER_SNAKE_CASE

### 9.3 Git Workflow

- Branch from main
- Use descriptive commit messages
- Squash commits before merge
- Run lint before push

### 9.4 Testing

- Test API endpoints manually
- Verify rate limiting behavior
- Check responsive design
- Validate Arabic RTL layout

## 10. Troubleshooting

### 10.1 Common Issues

#### Database Connection Fails

- Verify `MONGODB_URI` is correct
- Check network access to MongoDB
- Ensure IP is whitelisted

#### Authentication Fails

- Verify GitHub OAuth callback URL
- Check `NEXTAUTH_SECRET` is set
- Ensure `ADMIN_EMAIL` matches GitHub email

#### Images Not Loading

- Verify Cloudinary credentials
- Check `CLOUDINARY_CLOUD_NAME`
- Ensure upload preset allows unsigned uploads

#### Emails Not Sending

- Verify SMTP credentials
- Check `SMTP_PORT` (465 for SSL, 587 for TLS)
- Test with a simple email first

#### Rate Limit Errors

- Wait for retry-after period
- Check `rateLimiter.ts` configuration
- Verify Redis or in-memory store works

### 10.2 Logs

- Check Vercel function logs
- Check browser console for client errors
- Check Next.js terminal output in development

## 11. Contributing

### 11.1 How to Contribute

1. Fork the repository
2. Create feature branch
3. Make changes
4. Run lint and build
5. Submit pull request

### 11.2 Pull Request Requirements

- Pass all lint checks
- Build succeeds
- No TypeScript errors
- Descriptive commit messages
- Update documentation if needed

## 12. License

This project is private. All rights reserved by yazn_108.

## 13. Contact

- **Developer**: yazn ahmed (yazn_108)
- **Website**: https://yazn-108.github.io/
- **GitHub**: https://github.com/yazn-108
- **Twitter**: https://x.com/yazn_108
- **Telegram**: https://t.me/yazn108
- **LinkedIn**: https://www.linkedin.com/in/yazn-ahmed
- **email**: yazn_108@outlook.sa
