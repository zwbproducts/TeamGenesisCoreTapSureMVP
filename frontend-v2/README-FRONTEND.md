# TapSure Modern Frontend

Modern React + TypeScript frontend for TapSure insurance platform with advanced UI patterns and security best practices.

## 🚀 Features

- **React 18** with TypeScript for type safety
- **Tailwind CSS** for modern, responsive styling
- **Framer Motion** for smooth animations and transitions
- **Zustand** for lightweight state management with persistence
- **Zod** for runtime schema validation
- **Axios** with interceptors for API calls
- **shadcn/ui** inspired component library
- **Accessibility** (WCAG 2.1 AA compliant)
- **Mobile-first** responsive design
- **Drag & Drop** file upload with camera support
- **Real-time Chat** with typing indicators

## 📦 Installation

\`\`\`bash
cd frontend-v2
npm install
\`\`\`

## 🔧 Configuration

Create a \`.env\` file (or copy from \`.env.example\`):

\`\`\`env
VITE_API_URL=http://localhost:8000
\`\`\`

## 🏃 Development

\`\`\`bash
npm run dev
\`\`\`

The app will be available at \`http://localhost:5174\`

## 🏗️ Build

\`\`\`bash
npm run build
npm run preview  # Preview production build
\`\`\`

## 🎨 Architecture

### Components

- **ReceiptUpload** - Drag-and-drop file upload with camera support, category override
- **ReceiptDetails** - Animated receipt information display with confidence meter
- **CoverageOptions** - Interactive coverage plan selection with hover effects
- **PolicyConfirmation** - Policy activation with success feedback and toast notifications
- **ChatInterface** - Real-time chat with collapsible interface and typing indicators
- **HowItWorksModal** - Onboarding modal with animated step-by-step guide

### State Management

- \`useInsuranceStore\` - Global insurance flow state (receipt, coverage, policy)
  - Persisted to localStorage for session recovery
  - Loading states for async operations
  - Error handling
- \`useChatStore\` - Chat messages and typing indicators

### API Client

Type-safe API wrapper (\`src/lib/api.ts\`) with:
- Error handling and formatting
- Automatic token injection for authentication
- Request/response interceptors
- 30-second timeout
- Retry logic for failed requests

### Validation

Zod schemas (\`src/lib/schemas.ts\`) for:
- Receipt data validation
- Coverage option validation
- Policy confirmation validation
- Chat message validation

## 🔒 Security Features

- **Input Validation** - Zod schemas for all user inputs
- **File Upload Validation** - Type and size checking (max 10MB)
- **XSS Prevention** - React's built-in escaping
- **Auth Token Management** - Secure localStorage with automatic injection
- **CORS Handling** - Proper origin validation
- **Error Sanitization** - Safe error messages without leaking internals

## ♿ Accessibility

- Semantic HTML elements (\`<header>\`, \`<main>\`, \`<footer>\`)
- ARIA labels and roles on interactive elements
- Keyboard navigation support (Tab, Enter, Space)
- Focus management and visible focus indicators
- Screen reader announcements for dynamic content
- Color contrast compliance (WCAG AA)
- Descriptive alt text for images

## 🎨 Design System

### Colors

- **Primary**: \`#0E4D48\` (Teal green)
- **Navy**: \`#003366\`
- **Gray scale**: 50-900

### Typography

- **Font**: System UI stack (native fonts)
- **Headings**: Bold, tracking tight
- **Body**: Regular weight, relaxed line height

### Components

All components use the shadcn/ui pattern:
- Composable and reusable
- Accessible by default
- Themeable with CSS variables
- Type-safe props

## 📱 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🧪 Testing

\`\`\`bash
npm run test        # Run unit tests (when configured)
npm run test:e2e    # Run e2e tests (when configured)
\`\`\`

## 📂 Project Structure

\`\`\`
frontend-v2/
├── src/
│   ├── components/
│   │   ├── ui/               # Base UI components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── alert.tsx
│   │   │   └── skeleton.tsx
│   │   ├── ReceiptUpload.tsx
│   │   ├── ReceiptDetails.tsx
│   │   ├── CoverageOptions.tsx
│   │   ├── PolicyConfirmation.tsx
│   │   ├── ChatInterface.tsx
│   │   └── HowItWorksModal.tsx
│   ├── lib/
│   │   ├── api.ts           # API client
│   │   ├── schemas.ts       # Zod schemas
│   │   ├── store.ts         # Zustand stores
│   │   └── utils.ts         # Utility functions
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── index.html
├── tailwind.config.js
├── tsconfig.json
└── package.json
\`\`\`

## 🚀 Deployment

### Vercel / Netlify

\`\`\`bash
npm run build
# Deploy the dist/ folder
\`\`\`

### Docker

\`\`\`dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
\`\`\`

## 🔧 Environment Variables

- \`VITE_API_URL\` - Backend API base URL (default: http://localhost:8000)

## 📝 Development Tips

1. **Hot Module Replacement (HMR)** - Changes reflect instantly without page reload
2. **TypeScript** - Use strict typing for better DX
3. **Component Isolation** - Build components in isolation before integration
4. **State Management** - Use Zustand for global state, React state for local
5. **Error Boundaries** - Add error boundaries for production resilience

## 🤝 Contributing

1. Follow the existing code style
2. Write meaningful commit messages
3. Add TypeScript types for all props
4. Test accessibility with keyboard navigation
5. Ensure mobile responsiveness

## 📄 License

MIT

---

Built with ❤️ using React, TypeScript, and Tailwind CSS
