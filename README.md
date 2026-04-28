# ResQ – Hyperlocal Disaster Response Platform

**ResQ** is a real-time, hyperlocal disaster management platform designed to bridge the gap between official response and citizen awareness during crises. Built for the **Google Solution Challenge**, ResQ leverages Google Cloud, Firebase, and Gemini AI to provide actionable situational awareness when lives depend on it.

## 🚨 The Problem
During disasters (floods, earthquakes, fires), situational awareness is often delayed or fragmented. People struggle to find:
- Verified danger zones vs. safe shelters.
- Safe navigation routes in real-time.
- Multilingual, actionable guidance during panic.

## ✨ The Solution
ResQ provides a unified "Mission Control" for citizens:
- **Live Crisis Map**: Dark-themed, high-performance map with real-time weather radar and hazard markers.
- **Official Alert Engine**: Differentiated alerts from government authorities (NDMA/IMD) vs. crowdsourced reports.
- **Crowd Intelligence**: A "3-report validation" system to prevent false info and verify hazards.
- **ResQ AI Assistant**: A context-aware Gemini-powered bot that provides multilingual crisis guidance.
- **PWA Ready**: Offline-first design for resilience during network instability.

## 🛠️ Technology Stack
- **Frontend**: React 19 + Vite (High Performance)
- **Mapping**: Leaflet (Free/Open Source API-less Mapping)
- **Live Data**: RainViewer API (Weather Radar Overlay)
- **Backend**: Firebase Firestore (Real-time DB) & Authentication (Anonymous Login)
- **AI Engine**: Google Gemini 1.5 Flash (Context-Aware Crisis Guidance)
- **Styling**: Tailwind CSS with Framer Motion animations.

## 🚀 Key Innovations
1. **Context-Aware AI**: Our AI doesn't just "chat"—it reads the live system data (nearby floods, blocked roads) to give tailored advice.
2. **Citizen Validation**: Uses a peer-confirmation loop where hazards are "Unverified" until 3 community members confirm them.
3. **Hyperlocal Navigation**: Integrated "Take Me to Safety" navigation to the nearest verified shelter.

## 🗺️ How it Works
1. **Report**: Citizens report hazards via a simple 3-click interface.
2. **Validate**: The system tracks confirmations. Once 3 users verify, the marker lights up as "Verified."
3. **Alert**: High-priority authority alerts are pushed via a real-time Notification Hub.
4. **Guide**: Users chat with ResQ AI for step-by-step first aid or evacuation procedures in English, Hindi, or Marathi.

## 🛠️ Setup & Installation
1. Clone the repository.
2. Install dependencies: `npm install`
3. Create a `.env` file with your Firebase and Gemini credentials:
   ```env
   VITE_FIREBASE_API_KEY=your_key
   VITE_GEMINI_API_KEY=your_key
   ...
   ```
4. Run the development server: `npm run dev`

---
*Built with ❤️ for the Google Solution Challenge 2024.*
