# ⚡ Intelligent EV Hub OS

**Solving Range Anxiety with Real-Time Intelligence & Hardware Integration.**

[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=Leaflet&logoColor=white)](https://leafletjs.com/)

---

## 🚀 Overview
**Intelligent EV Hub OS** is a premium, high-performance navigation dashboard designed for the next generation of Electric Vehicles. Unlike standard GPS apps, it integrates directly with device hardware and real-time environmental APIs to provide precise, adaptive range predictions and emergency protocols.

### 🏆 Hackathon Highlights
- **Real-Time Hardware Sync**: Detects actual device battery status via the Web Battery API.
- **Dynamic Physics Engine**: Adjusts range based on live weather (temperature) and traffic density.
- **Micro-Corridor Discovery**: Uses the Overpass API to find charging hubs within exactly 1.5km of the planned route.
- **Zero-Cost Infrastructure**: Built entirely on professional-grade Open Source APIs (No API keys required).

---

## ✨ Key Features

### 🧭 Smart Navigation
- **Google Maps-Style UI**: Dark-mode glassmorphic dashboard with real-time GPS tracking.
- **Gyroscope Integration**: The navigation marker rotates physically with the device's heading using the Compass API.
- **Multi-Colored Traffic segments**: Visualizes traffic levels (Green/Yellow/Red) directly on the route polyline.

### 🔋 Range Intelligence
- **Live Drain Simulation**: Calculates battery consumption based on physical movement and distance.
- **Arrival Prediction**: Real-time calculation of remaining distance and estimated battery percentage at the destination.
- **Hardware Sync**: Automatically identifies the phone/laptop battery level for a "seamless" start.

### 🚨 Safety & Community
- **Emergency SOS Protocol**: One-tap dispatch that finds the nearest hub and transmits driver details (Name, Phone, Car #) and GPS coordinates.
- **Traffic Alerts**: Automatic notification engine that triggers alerts based on road conditions.

---

## 🛠️ Tech Stack
| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Vanilla CSS (Glassmorphism), Lucide Icons |
| **Maps** | Leaflet.js, CartoDB Dark Matter Tiles |
| **Routing** | OSRM (Open Source Routing Machine) |
| **Geocoding** | Nominatim (OpenStreetMap) |
| **Weather** | Open-Meteo API |
| **Data Source** | Overpass API (OSM Charging Hubs) |

---

## ⚙️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Kishore10kumar/ev-route-prediction.git
   cd ev-route-prediction
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Run Locally**
   ```bash
   npm run dev
   ```

---

## 📈 Future Roadmap
- **Offline Mode**: PWA support with pre-cached road networks and map tiles.
- **OBD-II Integration**: Real-time vehicle data via Web Bluetooth API.
- **Community Reporting**: Dynamic crowd-sourced traffic and charging port status updates.

---

## 👨‍💻 Author
**Kishore Kumar** - *Initial Work* - [Kishore10kumar](https://github.com/Kishore10kumar)

**Built with ❤️ for the Hackathon.**
