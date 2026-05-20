# Design System: Career Guidance Platform
**Project ID:** `6260758564596494843`

## 1. Visual Theme & Atmosphere
The platform exudes a "Sleek Intelligence" vibe. It uses a premium dark-mode foundation with glassmorphism elements to create depth. The mood is focused, sophisticated, and modern, using subtle shadows and high-contrast accents to guide the user's eye.

## 2. Color Palette & Roles
- **Deep Midnight** (#030712) – The core page background; solid and immersive.
- **Glass Slate** (#111827) – Surface background for cards and overlays; used with 60-80% opacity.
- **Electric Indigo** (#6366f1) – Primary action color for buttons and progress indicators.
- **Vibrant Violet** (#a855f7) – Secondary accent for highlights and gradients.
- **Soft Quartz** (#f8fafc) – Primary text color for maximum readability and contrast.
- **Muted Steel** (#94a3b8) – Secondary text for descriptions and labels.

## 3. Typography Rules
- **Display/Headings**: Inter or Outfit — Bold (700), tight letter-spacing (-0.02em), using high-contrast white.
- **Body/Text**: Inter — Regular (400) or Medium (500), comfortable line-height (1.6), using soft quartz or muted steel.

## 4. Component Stylings
* **Buttons:** 
    * *Primary*: Electric Indigo to Vibrant Violet gradient, pill-shaped (rounded-full), subtle glow on hover.
    * *Secondary*: Ghost style (transparent with white border), sharp but slightly rounded (8px).
* **Cards/Containers:** 
    * Glassmorphism style: semi-transparent (`bg-slate-900/60`), backdrop-blur (`backdrop-blur-xl`), subtly thin border (`border-white/10`).
    * Corner roundness: Generous (16px).
    * Shadow: Whisper-soft diffused indigo glow.
* **Inputs/Forms:** 
    * Deep slate background, thin white/10 border, focus state triggers Electric Indigo ring.

## 5. Layout Principles
- **Grid:** Responsive 12-column grid with generous gutters (2rem).
- **Whitespace:** Prioritize breathing room; a gallery-like feel to make data-heavy questionnaires feel approachable.
- **Alignment:** Centralized focus for forms; split layouts for dashboards.

## 6. Design System Notes for Stitch Generation
**Copy this block into every baton prompt:**

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, Desktop-first
- Theme: Dark Mode, Premium, Glassmorphism
- Background: Deep Midnight (#030712)
- Surface: Glass Slate (#111827 / 60% opacity)
- Primary Accent: Electric Indigo (#6366f1) to Vibrant Violet (#a855f7) gradient
- Text Primary: Soft Quartz (#f8fafc)
- Font: Inter, modern sans-serif
- Layout: Centered focus, generous whitespace, 16px rounded corners
