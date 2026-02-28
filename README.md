<div align="center">
  <h1>🚀 AeroChain Hackathon 2026</h1>
  <p><strong>Official Registration and Management Portal</strong></p>
</div>

## 📌 Overview

The AeroChain Hackathon 2026 platform is a modern, highly interactive web application built to handle team registrations, user authentication, and administrative management. The platform features a stunning 3D-animated landing page, seamless OTP-based authentication, and a comprehensive admin dashboard for managing hackathon participants.

## ✨ Features

- **Interactive 3D Landing Page:** Immersive experience powered by Three.js and React Three Fiber.
- **Smooth Animations:** Buttery smooth scrolling and element transitions using GSAP and Lenis.
- **Passwordless Authentication:** Secure OTP/Magic Link login system via Supabase.
- **Team Registrations:** Robust multi-step registration form for hackathon teams.
- **Admin Dashboard:**
  - View, search, and manage all registered teams.
  - Export participant data directly to Excel (`.xlsx`) with formatting.
  - Secure, protected admin routes.

## 🛠️ Technology Stack

- **Frontend Framework:** React 19 + Vite
- **Styling & Icons:** Modern CSS + Lucide React
- **3D Graphics:** Three.js, `@react-three/fiber`, `@react-three/drei`
- **Animations:** GSAP (GreenSock), Lenis (Smooth Scroll)
- **Backend & Database:** Supabase (PostgreSQL, Auth, RLS)
- **Data Export:** ExcelJS

## 🚀 Getting Started

Follow these instructions to run the project locally.

### Prerequisites

- Node.js (v18 or higher recommended)
- A [Supabase](https://supabase.com) account and project

### Installation

1. **Clone the repository** (if you haven't already) and navigate to the project directory:
   ```bash
   cd aerochain-hackathon
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env.local` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000/`.

## 📦 Build for Production

To create a production-ready build:

```bash
npm run build
```

The optimized static assets will be output to the `dist` directory, ready to be deployed to platforms like Vercel, Netlify, or Cloudflare Pages.

## 🗄️ Database Schema

This project requires a `registrations` table in your Supabase project with the following structure (refer to `schema.sql` for the exact definitions if available):
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- **Team Details:** `team_name`, `track`
- **Lead Details:** `lead_name`, `lead_email`, `lead_semester`, `lead_reg_no`, `lead_phone`, `lead_section`, `lead_department`, `lead_alt_email`
- `members` (JSONB)
- `team_size` (Integer)

## 🔒 Authentication Flow

1. Users enter their SRM IST email address.
2. An OTP is sent via Supabase Auth.
3. Upon verifying the OTP, a session is created (persisted in local storage).
4. Users can then access the registration form seamlessly. Existing registrations are automatically loaded for editing.
