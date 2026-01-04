# ⚙️ Eyoris Fashion - Backend

The backend is a robust **Express** server using **TypeScript** and **MongoDB**. It handles product management, user orders, and integrates with **Google Gemini** for AI capabilities.

## 🛠️ Tech Stack
- **Framework**: Express.js 🚂
- **Database**: MongoDB (Mongoose) 🍃
- **Language**: TypeScript 📘
- **AI**: Google Gemini (GenAI) 🧠

- **Auth**: Clerk (Express SDK) 🔒
- **Email**: Resend / Nodemailer 📧

## 🚀 Getting Started

### 1. 📦 Install Dependencies
```bash
pnpm install
```

### 2. 🔑 Configure Environment Variables
Create a file named `.env` in the `api` directory.
Add the following keys:

```env
# Server Configuration
PORT=4000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://...

# Authentication (Clerk)
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# AI Services (Google Gemini)
GEMINI_API_KEY=AIza...

# Email Service (Resend)
RESEND_API_KEY=re_...
```

### 3. ▶️ Run Development Server
```bash
pnpm dev
```
The server will start on [http://localhost:4000](http://localhost:4000).

## 📜 Scripts
- **`pnpm dev`**: Start server with `nodemon`.
- **`pnpm build`**: Compile TypeScript to JavaScript.
- **`pnpm start`**: Run the compiled production build.
- **`pnpm seed:kaggle`**: 🌱 Seed database with Kaggle dataset.
