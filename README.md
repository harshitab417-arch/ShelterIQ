# DRDO Area-Specific Passive Shelter Thermal Design & Simulation Platform

A production-quality full-stack software application engineered for Defence Research & Development Organisation (DRDO) problem statements regarding area-specific passive shelter thermal simulation, envelope material selection, multi-objective design optimization, and PDF report generation for extreme cold high-altitude regions (such as Leh, Ladakh).

---

## 1. Project Purpose
The primary goal of this software system is to evaluate passive shelter performance under real environmental conditions:
> *"For a given location and climatic condition, what combination of shelter size, shape, orientation, materials, insulation and openings provides the best thermal comfort while minimizing heat loss and external energy requirements?"*

---

## 2. System Architecture
```
                         ┌────────────────────────────────────────┐
                         │       React + Vite Light UI            │
                         │   (Three.js, Recharts, Framer Motion) │
                         └──────────────────┬─────────────────────┘
                                            │ REST API / Socket.IO
                         ┌──────────────────▼─────────────────────┐
                         │      Node.js + Express Backend         │
                         └──────┬─────────────┬─────────────┬─────┘
                                │             │             │
              ┌─────────────────┴─┐   ┌───────┴──────┐   ┌──┴─────────────┐
              │ Custom Physics    │   │ Optimization │   │ Open-Meteo API │
              │ Thermal Engine    │   │ Engine       │   │ & CSV Parser   │
              │ (1D Transient)    │   │ (Grid / GA)  │   └────────────────┘
              └───────────────────┘   └──────────────┘
```

---

## 3. Technology Stack

### Frontend:
- **Core**: React 18, Vite, JavaScript
- **Styling**: Tailwind CSS (Light Engineering Theme, Crisp Scientific Layout)
- **3D Visualization**: Three.js, React Three Fiber, `@react-three/drei`
- **Charts & Data**: Recharts
- **Networking**: Axios, Socket.IO Client

### Backend:
- **Server Platform**: Node.js, Express.js
- **Database**: MongoDB & Mongoose (with automated in-memory data store fallback)
- **Security**: JWT Authentication, bcryptjs password hashing
- **Real-Time Communication**: Socket.IO
- **PDF Generation**: PDFKit

---

## 4. Installation & Setup

### Prerequisites
- Node.js (v18+ recommended)
- npm (v9+)
- MongoDB (Optional; app automatically uses High-Performance In-Memory store if local MongoDB is offline)

### Step 1: Install Backend Dependencies
```bash
cd server
npm install
```

### Step 2: Install Frontend Dependencies
```bash
cd ../client
npm install
```

---

## 5. Environment Variables

Create `.env` inside `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/drdo_shelter_thermal
JWT_SECRET=drdo_passive_shelter_thermal_secret_key_2026
CLIENT_URL=http://localhost:5173
OPENAI_API_KEY=your_openai_key_here
```

---

## 6. Running the Application

### Start Backend Server
```bash
cd server
npm start
```
*Backend runs at:* `http://localhost:5000`

### Start Frontend Dev Server
```bash
cd client
npm run dev
```
*Frontend runs at:* `http://localhost:5173`

---

## 7. Thermal Physics Model & Equations

The custom thermal simulation engine is located in `server/src/physics/` and implements a **single-zone transient lumped-capacitance thermal energy balance model**:

### A. 1D Envelope Multi-Layer Conduction
Thermal resistance $R_{\text{total}}$ ($\text{m}^2\cdot\text{K/W}$):
$$R_{\text{total}} = \frac{1}{h_{\text{int}}} + \sum_{i=1}^n \frac{L_i}{k_i} + \frac{1}{h_{\text{ext}}}$$

Instantaneous conductive heat transfer rate $Q_{\text{cond}}$ (Watts):
$$Q_{\text{cond}} = \frac{T_{\text{in}} - T_{\text{out}}}{R_{\text{total}}} \cdot A$$

### B. Exterior Surface Convection
Exterior convection coefficient $h_{\text{ext}}$ ($\text{W/m}^2\cdot\text{K}$) based on wind speed $v_{\text{wind}}$ (McAdams empirical model):
$$h_{\text{ext}} = 10.0 + 4.1 \cdot v_{\text{wind}}$$

### C. Stefan-Boltzmann Clear-Sky Radiation
Clear-sky temperature $T_{\text{sky}}$ (Swinbank relationship):
$$T_{\text{sky}} = 0.0552 \cdot (T_{\text{amb,K}})^{1.5}$$

Radiative exchange rate $Q_{\text{rad}}$ (Watts):
$$Q_{\text{rad}} = \epsilon \cdot \sigma \cdot A \cdot \left( T_{\text{surface,K}}^4 - T_{\text{sky,K}}^4 \right)$$

### D. Passive Solar Heat Gains
Directional incident solar irradiance factor on wall/roof facades $I_{\text{surface}}$ ($\text{W/m}^2$) combined with window Solar Heat Gain Coefficient ($SHGC$):
$$Q_{\text{solar}} = SHGC \cdot A_{\text{window}} \cdot I_{\text{surface}} + \alpha \cdot A \cdot I_{\text{surface}} \cdot f_{\text{envelope}}$$

### E. Lumped Thermal Capacitance & Numerical Differential Solver
Total envelope and air thermal capacity $C_{\text{thermal}}$ ($\text{J/K}$):
$$C_{\text{thermal}} = m_{\text{air}} c_{p,\text{air}} + \sum \left( m_{\text{envelope}} c_{p,\text{envelope}} f_{\text{part}} \right)$$

Explicit sub-stepped numerical integration over time step $dt$:
$$C_{\text{thermal}} \frac{dT_{\text{in}}}{dt} = Q_{\text{solar}} + Q_{\text{internal}} - Q_{\text{loss}}$$

---

## 8. Optimization Approaches

1. **Grid Search (`gridSearch.js`)**: Parameter sweeps across candidate materials, insulation thickness, orientation, and window area.
2. **Genetic Algorithm (`geneticAlgorithm.js`)**: Chromosome encoding `[wallMat, roofMat, insMat, orientation, thickness, windowArea]`, tournament selection, single-point crossover, and mutation over $N$ generations.
3. **Real-time Progress**: Emits Socket.IO events (`optimization:progress`) to display live progress bars and generation metrics.

---

## 9. Validation Methodology
Model predictions are benchmarked against 1D analytical Fourier series solutions and documented reference datasets. The system automatically computes:
- **MAE** (Mean Absolute Error, °C)
- **RMSE** (Root Mean Square Error, °C)
- **Max Error** (°C)
- **Percentage Error** (%)

---

## 10. Core REST API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | User authentication |
| `GET`  | `/api/materials` | Fetch materials database |
| `POST` | `/api/climate/import` | Fetch Open-Meteo live API data |
| `POST` | `/api/climate/csv` | Parse & validate climate CSV upload |
| `POST` | `/api/simulation/run` | Execute custom Node.js physics engine |
| `POST` | `/api/optimization/grid` | Execute Grid Search optimization |
| `POST` | `/api/optimization/genetic` | Execute Genetic Algorithm search |
| `GET`  | `/api/validation` | Retrieve model validation benchmarks |
| `POST` | `/api/ai/explain` | Synthesize physical results with AI |
| `POST` | `/api/reports/generate` | Generate PDF design report |

---

## 11. Known Assumptions & Limitations
- Initial physics engine is a **single-zone transient lumped-capacitance model**.
- Infiltration rate assumed constant (0.5 ACH).
- Geometry assumes 1D heat flow perpendicular to major wall/roof envelope surfaces.
- Does NOT claim CFD-level 3D fluid dynamics accuracy.
