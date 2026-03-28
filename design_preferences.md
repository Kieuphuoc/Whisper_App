# Design Preferences Analysis - Whisper App

This document outlines the visual identity and design language established in the Whisper application, specifically based on the Profile and UI components.

## Core Aesthetic: Avant-Garde Glassmorphism
The application follows a "Glassmorphism" design style combined with "Avant-Garde" experimental layouts.

### 1. Visual Techniques
- **Blur & Transparency**: High reliance on `BlurView` (intensity 10-40) and semi-transparent `rgba` backgrounds.
- **Borders & Outlines**: Subtle glass borders (`1.5px`) with low-opacity white/silver colors (`rgba(255,255,255,0.3)`).
- **Gradients**: Frequent use of `LinearGradient` for depth, interactive buttons, and holographic overlays.
- **Layering**: Deep shadows (`shadowRadius: 20`, `shadowOpacity: 0.3`) and layered containers to create a sense of floating elements.

### 2. Color Palette
- **Primary**: Vibrant Purple/Violet (`#7c3aed`, `#4338ca`).
- **Surface**: Dark/Midnight backgrounds with translucent overlays (`rgba(0,0,0,0.2)` to `rgba(0,0,0,0.8)`).
- **Accents**: 
  - Emerald Green (`#10b981`) for secondary indicators.
  - White/Silver for high-contrast text and icons.
- **Theme**: Primarily Dark Mode focused, but with adaptive structures for Light Mode using the `theme` constant.

### 3. Motion & Micro-interactions
- **Entry Animations**: Using `Moti` for spring-based entrance effects (scale, rotate, translate).
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
