# Design Preferences Analysis - Whisper App

This document outlines the visual identity and design language established in the Whisper application, specifically based on the Profile, Chatroom, and Voice-AR components.

## Core Aesthetic: Avant-Garde Glassmorphism
The application follows a "Glassmorphism" design style combined with "Avant-Garde" experimental layouts.

### 1. Visual Techniques
- **Blur & Transparency**: High reliance on `BlurView` (intensity 10-40) and semi-transparent `rgba` backgrounds.
- **Borders & Outlines**: Subtle glass borders (`1.5px`) with low-opacity white/silver colors (`rgba(255,255,255,0.3)`).
- **Gradients**: Frequent use of `LinearGradient` for depth, interactive buttons, and holographic overlays.
- **Layering**: Deep shadows (`shadowRadius: 20`, `shadowOpacity: 0.3`) and layered containers to create a sense of floating elements.

### 2. Color Palette
- **Primary (Voice-AR Base)**:
  - Action Violet: `#8b5cf6` (primary CTA/background action color).
  - Signal Violet: `#a78bfa` (ring, glow, directional cue).
  - Soft Violet: `#c4b5fd`, `#ddd6fe` (sparkle, badge text, highlights).
- **Surface**:
  - Dark Base: `#05060a` and camera black `#000000`.
  - Light Fallback: `#f5f7ff`.
  - Glass Surface: `rgba(17,24,39,0.70)` to `rgba(17,24,39,0.75)`.
  - Floating Overlay: `rgba(0,0,0,0.35)`.
- **Borders / Strokes**:
  - Primary glass stroke: `rgba(255,255,255,0.12)`.
  - Secondary glass stroke: `rgba(255,255,255,0.16)`.
  - Violet stroke: `rgba(139,92,246,0.35)` to `rgba(139,92,246,0.45)`.
- **Text**:
  - On dark: `#ffffff`, `#e5e7eb`, and soft white (`rgba(255,255,255,0.75-0.92)`).
  - On light: `#111827`.
- **Semantic Accent**:
  - Keep Emerald (`#10b981`) only for "active/live signal" states, not as dominant brand color.
- **Theme Rule**: Dark-first visual language remains the default, with light mode as a contrast-safe fallback.

### 3. Motion & Micro-interactions
- **Entry Animations**: Using Moti for calm, subtle entrance effects such as fade-in combined with slight scale (0.95 → 1) and gentle upward translate (a few px), paired with a soft spring (low bounce) to create a smooth and composed feel.
- **Atmospheric Effects**:
  - **Shimmer Flash**: Periodic light streaks passing through interactive elements.
  - **Glow/Aura**: Subtle pulsing glow effects around active components or call-to-actions.
  - **Parallax**: Background scaling and translation during scroll interactions.
- **Physics**: Preference for "Spring" animations over linear timing for a more organic feel.

### 4. Layout & Typography
- **Asymmetry**: Stat bubbles and UI elements are often positioned with intentional offsets (negative margins, rotations) to avoid a standard grid feel.
- **Typography**:
  - Heavy font weights (`900`, `800`) for headers and display names.
  - Tracking/Letter spacing adjustments for a premium feel.
  - Thematic labeling (e.g., "Aura" for covers, "Tín hiệu" for dates).
- **Shape**: Rounded corners with large radii (range: `14px` to `36px`).

### 5. Terminology (Thematic Consistency)
- **Aura**: Cover/Portrait background.
- **Dị thường/Tần số**: Discovered items or voice logs.
- **Tín hiệu**: Connection or activity timestamps.

---
*Note: This file serves as a reference for future UI/UX development to ensure visual consistency across the Whisper ecosystem.*
