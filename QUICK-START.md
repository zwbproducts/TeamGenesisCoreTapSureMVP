# 🚀 Quick Start Guide

## Running the Full TapSure Application

### One-command (recommended)

```bash
cd /home/vboxuser/TapSure/tapsure1
./install-all.sh
./dev-all.sh
```

✅ Backend: **http://localhost:8000**

✅ Frontend-v2: **http://localhost:5174**

### 1. Start Backend (Terminal 1)

```bash
# From project root
cd /home/vboxuser/TapSure/tapsure1

# Create venv if not exists
python3 -m venv .venv

# Install dependencies
.venv/bin/python -m pip install -r backend/requirements.txt

# Start backend server
PYTHONPATH=$(pwd)/backend .venv/bin/python -m uvicorn app.main:app --reload --port 8000
```

✅ Backend will run on: **http://localhost:8000**

### 2. Start Frontend (Terminal 2)

```bash
# From project root
cd /home/vboxuser/TapSure/tapsure1/frontend-v2

# Install dependencies (if not done)
npm install

# Start dev server
npm run dev
```

✅ Frontend will run on: **http://localhost:5174**

### 3. Test the Application

```bash
cd /home/vboxuser/TapSure/tapsure1

# Full backend test suite (may fail if strict OCR integration expectations aren't met)
./test-backend.sh

# Fast backend tests (skips backend/test_integration.py)
./test-backend-fast.sh

# QR verify tests only
./test-pos-qr.sh
```

1. Open browser: **http://localhost:5174**
2. Click "How It Works" to see the onboarding modal
3. Upload a receipt image (or take a photo)
4. Review the extracted receipt details
5. Select a coverage option
6. Confirm your policy
7. Ask questions in the chat interface

---

## 📝 Features to Try

### Upload Flow
- **Drag & Drop** - Drag an image onto the upload area
- **Camera** - Use "Take Photo" button on mobile
- **Category Override** - Click category chips to manually set category

### Coverage Selection
- Hover over options to see animations
- Compare 6-month, 12-month, and 24-month plans
- Notice the "Best Value" badge on the premium plan

### Policy Confirmation
- Review the coverage summary
- Click "Confirm & Activate Policy"
- Watch for the success toast notification

### Chat
- Type questions like "How does coverage work?"
- Press Enter to send
- See typing indicators
- Collapse/expand the chat interface

---

## 🎨 What to Look For

### UI/UX Excellence
- ✨ Smooth animations on all interactions
- 🎯 Loading states with skeletons
- 🎨 Professional gradient backgrounds
- 📱 Mobile-responsive design
- ♿ Full keyboard navigation

### Technical Patterns
- 🔒 Type-safe API calls
- 📦 Persistent state (refresh the page!)
- 🎭 Error handling with user-friendly messages
- ⚡ Hot module replacement (edit code and see changes instantly)

---

## 🔍 Development Tips

### Hot Reloading
Both frontend and backend support hot reloading:
- **Frontend**: Edit any `.tsx` file and see instant updates
- **Backend**: Edit Python files and server auto-restarts

### Browser DevTools
- Open React DevTools to inspect component state
- Check Network tab to see API calls
- Use Lighthouse to verify accessibility

### State Inspection
Zustand state is visible in React DevTools under "Zustand" tab

---

## 📊 What Makes This "Advanced"?

### Frontend Architecture
1. **Component Library** - Reusable, composable UI components
2. **Type Safety** - Full TypeScript coverage
3. **State Management** - Zustand with persistence
4. **API Layer** - Axios with interceptors and error handling
5. **Validation** - Zod schemas for runtime type checking
6. **Animations** - Framer Motion for professional feel
7. **Accessibility** - WCAG 2.1 AA compliant

### Backend Integration
1. **Multi-Agent System** - Orchestrated AI agents
2. **OCR Processing** - Tesseract for receipt scanning
3. **LLM Integration** - OpenAI-compatible API support
4. **Structured Output** - Pydantic models with validation
5. **Graceful Degradation** - Works without LLM

---

## 🎯 Next: Compare to Production Apps

This frontend matches or exceeds patterns used by:

- **Stripe Dashboard** - Clean UI, smooth animations
- **Linear** - Modern design system, keyboard shortcuts
- **Vercel** - Minimalist aesthetic, fast interactions
- **Notion** - Drag-and-drop, responsive design

---

## 🛠️ Customization Ideas

### Easy Wins
1. Change color scheme in `tailwind.config.js`
2. Add more categories in `ReceiptUpload.tsx`
3. Customize coverage tiers in backend `coverage.py`
4. Add company logo in `App.tsx` header

### Medium Complexity
1. Add user authentication (JWT)
2. Integrate payment processing (Stripe)
3. Add analytics (PostHog, Mixpanel)
4. Implement email notifications

### Advanced
1. Add machine learning for better OCR
2. Build admin dashboard
3. Implement multi-tenancy
4. Add real-time notifications (WebSockets)

---

**Enjoy your enterprise-grade insurance app! 🎉**
