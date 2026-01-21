# Echo - Privacy Dashboard

**Project Report: Realization Phase**

Echo is a browser extension designed to visualize digital identity and tracking in real-time. It provides users with immediate feedback via a "Traffic Light" system and deep insights via a "Digital Identity" dashboard.

## Technology Stack

*   **Frontend:** React 18, TypeScript
*   **Styling:** Tailwind CSS
*   **Build Tool:** Vite
*   **Platform:** Web Extension (Manifest V3)

## Development Setup

To set up the development environment locally:

1.  **Install Node.js:** Ensure Node.js (v16+) is installed.
2.  **Install Dependencies:**
    ```bash
    npm install
    ```
3.  **Run Development Server:**
    ```bash
    npm run dev
    ```
4.  **Build for Production:**
    ```bash
    npm run build
    ```

## Project Structure

*   `components/` - Reusable UI widgets (TrafficLight, Popup, Dashboard).
*   `services/` - Logic for tracking detection and profile analysis.
*   `types.ts` - TypeScript definitions for data models.
*   `manifest.json` - (To be generated) Extension configuration.

## Key Features Implemented

1.  **Traffic Light Indicator:** Visual risk assessment (Green/Amber/Red).
2.  **Privacy Controls:** User ability to allow/block trackers.
3.  **Digital Persona:** Visualization of how algorithms perceive the user (e.g., "Tech-Savvy Foodie").
