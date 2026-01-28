# Gemini CLI Prompt for FastAPI Best Architecture UI

This document provides context for the Gemini CLI when interacting with the `fastapi_best_architecture_ui` project.

## Project Overview

This is a pnpm monorepo project, primarily focused on a modern frontend application built with Vue 3, TypeScript, and Ant Design Vue. It utilizes Vite for development and building. The backend is expected to be a FastAPI application, although its code is not directly present in this repository.

## Key Technologies and Frameworks

### Frontend
- **Framework:** Vue 3
- **UI Library:** Ant Design Vue
- **Language:** TypeScript
- **Build Tool:** Vite
- **Package Manager:** pnpm
- **State Management:** Pinia
- **Routing:** Vue Router
- **Utility Libraries:** `@vueuse/core`, `dayjs`, `mitt`, `socket.io-client`
- **Component Libraries:** Internal `@vben/*` packages (e.g., `@vben/common-ui`, `@vben/layouts`, `@vben/icons`, `@vben/stores`, `@vben/utils`, etc.)

### Monorepo Structure
The project uses `pnpm-workspace.yaml` to manage multiple packages:
- `apps/*`: Contains applications, e.g., `apps/web-antd` (the main frontend application).
- `packages/*`: Reusable components, hooks, utilities, and other shared code (e.g., `@vben/constants`, `@vben/effects`, `@vben/icons`, `@vben/locales`, `@vben/preferences`, `@vben/stores`, `@vben/styles`, `@vben/types`, `@vben/utils`).
- `internal/*`: Internal tools, configurations, and utilities (e.g., `internal/lint-configs`, `internal/node-utils`, `internal/tailwind-config`, `internal/tsconfig`, `internal/vite-config`).
- `scripts/*`: Various utility scripts.
- `docs`: Project documentation.
- `playground`: Likely for testing and showcasing components.

## Common Tasks and Interactions

When working with this project, consider the following common tasks:

1.  **Frontend Development:**
    *   Developing new features or fixing bugs in `apps/web-antd`.
    *   Creating or modifying shared components in `packages/@core/ui-kit` or other `packages/*` directories.
    *   Implementing state management logic using Pinia.
    *   Handling API requests using the `@vben/request` package.
    *   Updating UI elements with Ant Design Vue components.

2.  **Project Setup and Dependencies:**
    *   Installing dependencies using `pnpm install`.
    *   Adding new packages to the monorepo.

3.  **Build and Deployment:**
    *   Building the frontend application using `pnpm build` (defined in `apps/web-antd/package.json`).
    *   Analyzing the build with `pnpm build:analyze`.

4.  **Code Quality and Standards:**
    *   Ensuring code adheres to TypeScript types.
    *   Following ESLint and Prettier configurations (defined in `eslint.config.mjs`, `.prettierrc.mjs`).
    *   Adhering to Stylelint configurations (`stylelint.config.mjs`).

5.  **Testing:**
    *   Unit testing with Vitest (configurations in `vitest.config.ts`, `vitest.workspace.ts`).

## Design Specification: Gemini Fintech Modern

The project follows a specific design language termed "**Gemini Fintech Modern**," characterized by a "Lite Fintech" aesthetic. All UI components and page layouts MUST adhere to the following specifications:

### 1. Design DNA
*   **Core Concept:** "Breathable" & "Subtle Quality." High transparency backgrounds, colored shadows, and extremely thin borders to eliminate the heaviness of traditional financial software.
*   **Shape Language:** **Super Rounded**. Core cards use `rounded-[32px]` or `rounded-[24px]`. Inner containers use `rounded-xl` (12px) or `rounded-2xl` (16px). Avoid sharp corners.
*   **Lighting & Depth:** **Diffuse Reflection & Colored Light**. Avoid pure black shadows. Use colored shadows matching the primary tone (e.g., `shadow-blue-200`) combined with `backdrop-blur` to create a floating effect.
*   **Typography Style:** **Micro-Label Driven**. Extensive use of tiny font sizes (10px/9px), Uppercase, and wide letter spacing (`tracking-widest`) for data attributes (e.g., "TRANSACTION TYPE"), creating a refined industrial feel.

### 2. Color System
*   **Primary:** `text-[#1677FF]` (Ant Blue), `bg-indigo-600`. Professional, calm, high trust.
*   **Surface:** `bg-white`, `bg-blue-50/30`, `bg-indigo-50`. Use `/20` to `/60` opacity extensively.
*   **Expense:** `text-rose-600`, `bg-rose-50`. Warning but soft.
*   **Income:** `text-emerald-600`. Clear, positive.
*   **Text:** `text-gray-900` (Core Data), `text-gray-400` (Labels). High contrast difference.
*   **Decor:** `border-blue-100/50`. Structural but unobtrusive.

### 3. Typography Rules
*   **Data Display:** Use `font-mono` or `tracking-tighter` for numbers/IDs. Weights: `font-black` (900) or `font-bold` (700).
*   **Micro-Labels:** `text-[10px]` or `text-[9px]`, `uppercase`, `tracking-widest`, `font-bold`, `text-gray-400`.
*   **Body:** `text-sm` or `text-xs`, `font-medium`.

### 4. Component Construction
*   **Card Containers:**
    *   Border: `border border-white` or very faint gray.
    *   Background: Subtle gradient `linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)`.
    *   Padding: Large, `p-8` (32px) or `p-10` (40px).
*   **Icon Boxes:**
    *   Shape: `rounded-xl` or `rounded-full`.
    *   Size: `w-10 h-10` or `w-12 h-12`.
    *   Style: Light brand background (e.g., `bg-indigo-50`), dark icon (`text-indigo-500`), `shadow-sm`.
*   **Decorations:**
    *   Watermarks: Large, low opacity, absolute positioning.
    *   Connectors: Dotted/dashed lines using `repeating-linear-gradient`.

## Design Specification: Gemini Fintech Modern

The project follows a specific design language termed "**Gemini Fintech Modern**," characterized by a "Lite Fintech" aesthetic. All UI components and page layouts MUST adhere to the following specifications:

### 1. Design DNA
*   **Core Concept:** "Breathable" & "Subtle Quality." High transparency backgrounds, colored shadows, and extremely thin borders to eliminate the heaviness of traditional financial software.
*   **Shape Language:** **Super Rounded**. Core cards use `rounded-[32px]` or `rounded-[24px]`. Inner containers use `rounded-xl` (12px) or `rounded-2xl` (16px). Avoid sharp corners.
*   **Lighting & Depth:** **Diffuse Reflection & Colored Light**. Avoid pure black shadows. Use colored shadows matching the primary tone (e.g., `shadow-blue-200`) combined with `backdrop-blur` to create a floating effect.
*   **Typography Style:** **Micro-Label Driven**. Extensive use of tiny font sizes (10px/9px), Uppercase, and wide letter spacing (`tracking-widest`) for data attributes (e.g., "TRANSACTION TYPE"), creating a refined industrial feel.

### 2. Color System
*   **Primary:** `text-[#1677FF]` (Ant Blue), `bg-indigo-600`. Professional, calm, high trust.
*   **Surface:** `bg-white`, `bg-blue-50/30`, `bg-indigo-50`. Use `/20` to `/60` opacity extensively.
*   **Expense:** `text-rose-600`, `bg-rose-50`. Warning but soft.
*   **Income:** `text-emerald-600`. Clear, positive.
*   **Text:** `text-gray-900` (Core Data), `text-gray-400` (Labels). High contrast difference.
*   **Decor:** `border-blue-100/50`. Structural but unobtrusive.

### 3. Typography Rules
*   **Data Display:** Use `font-mono` or `tracking-tighter` for numbers/IDs. Weights: `font-black` (900) or `font-bold` (700).
*   **Micro-Labels:** `text-[10px]` or `text-[9px]`, `uppercase`, `tracking-widest`, `font-bold`, `text-gray-400`.
*   **Body:** `text-sm` or `text-xs`, `font-medium`.

### 4. Component Construction
*   **Card Containers:**
    *   Border: `border border-white` or very faint gray.
    *   Background: Subtle gradient `linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)`.
    *   Padding: Large, `p-8` (32px) or `p-10` (40px).
*   **Icon Boxes:**
    *   Shape: `rounded-xl` or `rounded-full`.
    *   Size: `w-10 h-10` or `w-12 h-12`.
    *   Style: Light brand background (e.g., `bg-indigo-50`), dark icon (`text-indigo-500`), `shadow-sm`.
*   **Decorations:**
    *   Watermarks: Large, low opacity, absolute positioning.
    *   Connectors: Dotted/dashed lines using `repeating-linear-gradient`.

## Instructions for Gemini CLI

*   **Refer to Coding Guidelines:** For comprehensive coding guidelines and best practices, consult `docs/CODING_GUIDELINES.md`.
*   **Prioritize Monorepo Structure:** Understand that changes in `packages/*` might affect `apps/web-antd` or other packages.
*   **Adhere to Existing Conventions:** Follow the established coding style, architectural patterns, and file organization (e.g., use of TypeScript, Vue composition API, Ant Design Vue component usage, `pnpm` for package management).
*   **Utilize Project Scripts:** Refer to `package.json` scripts within `apps/web-antd` and the root for common operations (e.g., `dev`, `build`, `typecheck`).
*   **Consider Frontend Focus:** While there might be a FastAPI backend, assume the primary task scope is usually related to the frontend application unless explicitly stated otherwise.
*   **Suggest `pnpm` commands:** When suggesting package management operations, always use `pnpm`.
*   **Enforce Design Specs:** When generating or modifying UI code, STRICTLY follow the "Gemini Fintech Modern" specifications detailed above.

This context should help the Gemini CLI provide more accurate and helpful responses related to this project.