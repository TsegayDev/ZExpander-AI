# 🚀 ZExpander AI — Elucidate & Refine

ZExpander AI is a premium, state-of-the-art AI-powered writing assistant that transforms brief sentences or rough notes into structured, articulate, and professional content. Designed with a gorgeous glassmorphic dark-mode dashboard, it integrates advanced document processing, tone customization, plagiarism checking, and AI-generation humanizers.

The project is structured as a unified **React/Vite Frontend** and **Node.js/Express Backend** monolithic application, optimized for local running or distributed cloud deployments.

---

## 🌟 Key Features

*   **✍️ Advanced Text Expansion:** Instantly expand short sentences, outlines, or bullet points into complete, detailed paragraphs.
*   **🎭 Multi-Tone Customization:** Choose from different writing tones (Professional, Academic, Casual, Creative, Persuasive) to match your audience.
*   **📄 Rich File Processing:** Direct upload support for `.txt`, `.pdf`, and `.docx` files, automatically parsed and loaded into the AI workspace.
*   **🤖 AI Humanizer & Detection:** Refine AI-generated text to make it read naturally and check its probability of passing AI detection tools.
*   **🔍 Plagiarism Checker:** Detect patterns and maintain academic/professional integrity.
*   **🗄️ Locally-Stored Subscriptions & History:** Simulates Free, Pro, and Unlimited plan limits, usage limits, and document history fully stored inside the browser's `localStorage` (no heavy DB configuration required!).
*   **🎨 Premium UI/UX:** A responsive dark-mode interface built using Radix UI primitives, Tailwind CSS animations, and smooth Framer Motion transitions.

---

## 🛠️ Technical Stack

### Frontend (Client)
*   **Vite + React (v18) + TypeScript:** Lightning-fast, modern client build system.
*   **Tailwind CSS + Tailwind Animate:** Sleek, responsive layout system.
*   **Framer Motion:** High-fidelity animations and page transitions.
*   **Radix UI:** High-quality accessible UI components (dialogs, select, tabs, toasts).
*   **Lucide React:** Modern, lightweight iconography.

### Backend (Server)
*   **Node.js + Express:** Light, robust API routing server.
*   **Google GenAI SDK (`@google/genai`):** Interfacing with state-of-the-art Gemini 2.5/1.5 models.
*   **Mammoth & PDF-Parse:** Server-side document parsers for processing docx and pdf files.
*   **HTML-to-DOCX:** Dynamic client/server-side Microsoft Word file generation.

---

## 🚀 Local Installation & Setup

Follow these simple steps to run ZExpander AI locally on your system:

### 1. Clone the Repository
```bash
git clone https://github.com/TsegayDev/ZExpander-AI.git
cd ZExpander-AI
```

### 2. Install Dependencies
Install all package dependencies for the client and server:
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory. You can copy the template from `.env.example`:
```bash
cp .env.example .env
```

Open `.env` and fill in your Google Gemini API key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```
> [!NOTE]
> You can obtain a free Gemini API key from [Google AI Studio](https://aistudio.google.com/).

### 4. Run Development Server
Start the Express server, which hosts both the API endpoints and the Vite development middleware:
```bash
npm run dev
```

Open your browser and navigate to **`http://localhost:3000`** to start using the app!

---

## 🌐 Production Deployment Guide

ZExpander AI is designed to support two distinct deployment patterns:

### Option A: Unified Full-Stack Host (Recommended)
You can deploy the entire monolithic application to unified hosts like **Render**, **Railway**, **Heroku**, or **Vercel** (with serverless functions).
1. Link your GitHub repository to the hosting platform.
2. Set the build command: `npm run build`
3. Set the start command: `node dist/server/index.js` (or run `npm run dev` with `NODE_ENV=production`).
4. Configure environment variables on the dashboard:
   * `GEMINI_API_KEY`: Your Google Gemini API Key.
   * `NODE_ENV`: `production`

---

### Option B: Split Deployment (GitHub Pages + Remote Backend API)
Because GitHub Pages only hosts static client files, you can deploy the frontend there and run the Express API on a free hosting tier (e.g. Render or Railway).

#### 1. Deploying the Backend API
* Deploy the project to **Render** or **Railway**.
* Set your environment variables:
  * `GEMINI_API_KEY`: Your Google Gemini API Key.
  * `NODE_ENV`: `production`
* Take note of your backend URL (e.g., `https://zexpander-api.onrender.com`).

#### 2. Building the Frontend for GitHub Pages
When deploying the frontend to GitHub Pages, you must specify the backend URL so that the client knows where to send API requests:

```bash
# Set your VITE_API_URL env variable during the build
$env:VITE_API_URL="https://zexpander-api.onrender.com"  # (Windows PowerShell)
VITE_API_URL=https://zexpander-api.onrender.com npm run build  # (macOS/Linux)
```
This compiles a production-ready static build inside the `/dist` directory.

#### 3. Deploying to GitHub Pages
To publish the static output to your GitHub page:
1. Make sure to commit all source code changes.
2. Initialize or deploy the `/dist` output folder to your `gh-pages` branch. You can use the `gh-pages` npm package:
   ```bash
   npm install -D gh-pages
   ```
   Add a deploy script to your `package.json`:
   ```json
   "predeploy": "npm run build",
   "deploy": "gh-pages -d dist"
   ```
   Then run:
   ```bash
   npm run deploy
   ```

> [!TIP]
> **Single Page Application (SPA) Routing Workaround:**
> We have pre-configured a redirection handler in [index.html](file:///d:/Coding/ZExpander-AI/index.html) and [public/404.html](file:///d:/Coding/ZExpander-AI/public/404.html). This ensures that standard client-side router links (like `/expand` or `/settings`) will work and refresh correctly on GitHub Pages without returning a 404.

---

## 👨‍💻 Author & Developer Info

*   **Developer:** Tsegay Gebrekidan
*   **GitHub:** [@TsegayDev](https://github.com/TsegayDev)
*   **Email:** [tsegaydev@gmail.com](mailto:tsegaydev@gmail.com)
*   **Phone:** [+251946351205](tel:+251946351205)

Feel free to reach out for collaboration, inquiries, or feedback!

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
