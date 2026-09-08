# ShelterIQ — DRDO Passive Shelter Thermal Design Platform

A full-stack web application built for the Defence Research & Development Organisation (DRDO) that simulates, optimizes, and reports on passive shelter thermal performance for extreme cold, high-altitude environments like **Leh, Ladakh (3500m elevation)**.

---

## What Does This App Do?

Imagine you need to build a military shelter at 3500 metres altitude where temperatures drop to −20°C in winter. You need to answer:

> *"What shape, size, materials, and window placement will keep soldiers warm inside — without any active heating?"*

This platform answers that question by:

1. Pulling real weather data for any location on Earth
2. Letting you design a shelter (shape, dimensions, materials, windows)
3. Running a physics simulation that calculates indoor temperature hour-by-hour
4. Comparing multiple designs side-by-side
5. Automatically finding the best material combination using optimization algorithms
6. Generating a downloadable PDF report of the best design

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [How to Run Locally](#how-to-run-locally)
4. [Environment Variables](#environment-variables)
5. [Page-by-Page Guide](#page-by-page-guide)
6. [How the Physics Engine Works](#how-the-physics-engine-works)
7. [How the Optimization Engine Works](#how-the-optimization-engine-works)
8. [Database & Data Models](#database--data-models)
9. [REST API Reference](#rest-api-reference)
10. [Key Concepts for Beginners](#key-concepts-for-beginners)

---

## Tech Stack

### Frontend (`/client`)
| Technology | Purpose |
|---|---|
| React 18 + Vite | UI framework and fast dev server |
| React Router v6 | Page navigation (no full page reloads) |
| Tailwind CSS | Utility-first styling |
| Three.js + React Three Fiber | Interactive 3D shelter preview |
| Recharts | Temperature and solar radiation charts |
| Axios | HTTP requests to the backend |
| Socket.IO Client | Real-time optimization progress bar |

### Backend (`/server`)
| Technology | Purpose |
|---|---|
| Node.js + Express | Web server and REST API |
| MongoDB + Mongoose | Database for users, simulations, materials |
| In-Memory Store | Automatic fallback if MongoDB is offline |
| Socket.IO | Push real-time progress updates to the browser |
| JWT + bcryptjs | User authentication and password hashing |
| PDFKit | Generate downloadable PDF reports |
| Open-Meteo API | Free weather data for any GPS coordinate |

---

## Project Structure

```
ShelterIQ/
│
├── client/                        ← React frontend
│   └── src/
│       ├── components/            ← Reusable UI pieces
│       │   ├── Layout.jsx         ← Sidebar + top nav wrapper for all dashboard pages
│       │   ├── Navbar.jsx         ← Top navigation bar
│       │   ├── Sidebar.jsx        ← Left sidebar with page links
│       │   └── LocationPicker.jsx ← Map-based GPS coordinate picker
│       │
│       ├── pages/                 ← One file = one page/route
│       │   ├── LandingPage.jsx    ← Public homepage with 3D shelter preview
│       │   ├── Login.jsx          ← User login form
│       │   ├── Register.jsx       ← User registration form
│       │   ├── Dashboard.jsx      ← Main control panel with KPI cards
│       │   ├── NewSimulation.jsx  ← 5-step wizard to create a simulation
│       │   ├── ShelterDesigner.jsx← Detailed shelter geometry editor
│       │   ├── ClimatePage.jsx    ← Fetch/upload weather data
│       │   ├── MaterialsPage.jsx  ← Browse and add building materials
│       │   ├── SimulationsPage.jsx← View all past simulation results
│       │   ├── SimulationResultsPage.jsx ← Detailed charts for one simulation
│       │   ├── CompareDesignsPage.jsx    ← Side-by-side design comparison
│       │   ├── OptimizationPage.jsx      ← Run Grid Search or Genetic Algorithm
│       │   ├── ValidationPage.jsx        ← Physics model accuracy benchmarks
│       │   ├── ReportsPage.jsx    ← Generate and download PDF reports
│       │   ├── SavedProjectsPage.jsx     ← Saved shelter designs
│       │   └── SettingsPage.jsx   ← User account settings
│       │
│       ├── services/
│       │   └── api.js             ← Axios instance + Socket.IO connection
│       │
│       ├── three/
│       │   └── Shelter3DViewer.jsx← Three.js 3D shelter renderer
│       │
│       ├── App.jsx                ← Route definitions
│       └── main.jsx               ← React entry point
│
└── server/                        ← Node.js backend
    └── src/
        ├── config/
        │   ├── db.js              ← MongoDB connection (with fallback logic)
        │   └── inMemoryStore.js   ← In-memory data store (used when MongoDB is offline)
        │
        ├── middleware/
        │   └── authMiddleware.js  ← JWT token verification for protected routes
        │
        ├── models/                ← MongoDB data schemas (what gets saved to DB)
        │   ├── User.js            ← User accounts
        │   ├── Shelter.js         ← Shelter geometry + materials
        │   ├── ClimateDataset.js  ← Weather time-series data
        │   ├── Simulation.js      ← Simulation inputs + results
        │   ├── OptimizationRun.js ← Optimization run results
        │   ├── Material.js        ← Building material properties
        │   ├── Report.js          ← Generated PDF report metadata
        │   └── ValidationCase.js  ← Physics benchmark test cases
        │
        ├── physics/               ← The core thermal simulation engine
        │   ├── simulationEngine.js   ← Main coordinator: runs the full time-series loop
        │   ├── heatBalance.js        ← Calculates all heat gains and losses per hour
        │   ├── conduction.js         ← Wall/roof/floor heat conduction (Fourier's Law)
        │   ├── convection.js         ← Wind-driven exterior surface heat transfer
        │   ├── radiation.js          ← Sky longwave radiation heat loss
        │   ├── solar.js              ← Passive solar gain through windows and walls
        │   ├── temperatureSolver.js  ← Numerical ODE solver (Euler integration)
        │   ├── thermalMass.js        ← Thermal capacitance of walls and air
        │   ├── shapeCalculator.js    ← Geometry areas/volumes for all 4 shelter shapes
        │   ├── materialDatabase.js   ← Default material property values
        │   └── materialEvaluator.js  ← Scores materials for optimization
        │
        ├── optimization/
        │   ├── gridSearch.js         ← Exhaustive parameter sweep optimizer
        │   └── geneticAlgorithm.js   ← Evolutionary algorithm optimizer
        │
        ├── routes/                ← Express API route handlers
        │   ├── authRoutes.js      ← POST /api/auth/login, /register
        │   ├── shelterRoutes.js   ← CRUD for shelter designs
        │   ├── climateRoutes.js   ← Fetch/upload/list climate datasets
        │   ├── simulationRoutes.js← Run simulations, get history
        │   ├── optimizationRoutes.js ← Trigger grid/genetic optimization
        │   ├── materialRoutes.js  ← Get/add materials
        │   ├── validationRoutes.js← Physics benchmark results
        │   ├── aiRoutes.js        ← AI explanation of results (OpenAI)
        │   └── reportRoutes.js    ← Generate PDF reports
        │
        ├── services/
        │   ├── openMeteoService.js← Calls the Open-Meteo weather API
        │   ├── csvParser.js       ← Parses uploaded weather CSV files
        │   ├── pdfGenerator.js    ← Builds PDF reports using PDFKit
        │   └── openaiService.js   ← Calls OpenAI to explain simulation results
        │
        ├── scripts/
        │   └── seedData.js        ← Default materials and Leh climate data
        │
        ├── tests/
        │   └── physics.test.js    ← Unit tests for the physics engine
        │
        ├── app.js                 ← Express app setup (routes, middleware)
        └── server.js              ← HTTP server + Socket.IO startup
```

---

## How to Run Locally

You need two terminals running at the same time — one for the backend, one for the frontend.

### Prerequisites
- [Node.js v18+](https://nodejs.org/) installed
- npm v9+ (comes with Node.js)
- MongoDB is **optional** — the app automatically switches to an in-memory store if MongoDB is not running

### Step 1 — Create the environment file

Create a file at `server/.env` with this content:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/drdo_shelter_thermal
JWT_SECRET=drdo_passive_shelter_thermal_secret_key_2026
CLIENT_URL=http://localhost:5173
OPENAI_API_KEY=your_openai_key_here
```

> The `OPENAI_API_KEY` is only needed for the AI explanation feature. Everything else works without it.

### Step 2 — Start the Backend

```bash
cd server
npm install
npm start
```

You should see:
```
[DRDO Passive Shelter Server] Running on http://localhost:5000
[Socket.IO WebSocket] Real-time engine attached.
```

If MongoDB is not installed, you will also see:
```
[Database Fallback] System running in High-Performance In-Memory Data Store mode.
```
This is normal — the app still works fully.

### Step 3 — Start the Frontend

Open a second terminal:

```bash
cd client
npm install
npm run dev
```

You should see:
```
VITE ready in Xms
➜  Local: http://localhost:5173/
```

Open your browser at **http://localhost:5173** to use the app.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | No (default: 5000) | Port the backend server listens on |
| `MONGODB_URI` | No | MongoDB connection string. Falls back to in-memory if omitted or unreachable |
| `JWT_SECRET` | Yes | Secret key used to sign login tokens. Change this in production |
| `CLIENT_URL` | No | Frontend URL for CORS. Default allows all origins |
| `OPENAI_API_KEY` | No | Enables the AI explanation feature on simulation results |

---

## Page-by-Page Guide

### `/` — Landing Page
The public homepage. Shows a live interactive 3D shelter preview (Three.js), a feature overview, and the 6-step engineering workflow. No login required.

### `/login` and `/register`
Standard authentication forms. After login, a JWT token is stored in the browser and sent with every API request.

### `/dashboard` — Engineering Control Dashboard
The main hub after login. Shows:
- **Total Simulations** run
- **Average Indoor Temperature** across all simulations
- **Average Heat Loss** (kWh over 24 hours)
- **Saved Shelter Designs** count
- **Best Performing Design** — the simulation with the highest thermal comfort percentage
- **Active Climate Profile** — the most recently loaded weather dataset
- **Recent Simulations Table** — last 5 runs with quick links to results

### `/new-simulation` — 5-Step Simulation Wizard
The most important page. Walks you through:

| Step | What You Do |
|---|---|
| 1. Location & Climate | Pick a GPS location or select a saved weather dataset |
| 2. Shelter Design | Choose a shape (Rectangle, Dome, A-Frame, Quonset) and enter dimensions. A live 3D preview updates as you type |
| 3. Occupancy & Openings | Set number of occupants, doors, windows, and window orientation |
| 4. Review & Comfort | Set the indoor comfort temperature range (default 18–24°C) |
| 5. Run Simulation | Launches the physics engine. Redirects to results when done |

### `/climate` — Climate Data Management
Two ways to load weather data:
- **Open-Meteo API**: Enter latitude/longitude and number of days. Fetches real hourly temperature, solar radiation, and wind speed data for free.
- **CSV Upload**: Paste or upload a CSV file with columns: `timestamp, temperature, solarRadiation, windSpeed, humidity`

Displays interactive area charts of temperature and solar irradiance over time.

### `/materials` — Materials Database
Browse all building materials with their thermal properties:
- **Thermal Conductivity** (W/m·K) — how easily heat passes through the material. Lower = better insulator.
- **Density** (kg/m³) — affects thermal mass (heat storage capacity)
- **Specific Heat** (J/kg·K) — energy needed to heat 1kg by 1°C
- **Emissivity** — how much longwave radiation the surface emits (0–1)
- **Solar Absorptivity** — how much solar radiation the surface absorbs (0–1)

Default materials include: Rammed Earth, Stone Masonry, Straw-Clay, AAC Block, PUF Insulation, EPS Foam, Double Low-E Glazing, Timber Door, Galvanized Steel Roof.

### `/simulations` — Simulation History
Lists all past simulations. Click any row to view detailed results including:
- Indoor vs outdoor temperature chart over time
- Heat loss breakdown by component (walls, roof, windows, ventilation, radiation)
- Key metrics: avg/min/max indoor temp, total solar gain, total heat loss, comfort percentage

### `/compare` — Compare Designs
Select two or more simulations and view their metrics side-by-side in a table and bar chart.

### `/optimization` — Design Optimization
Automatically searches for the best material combination. Two algorithms:

- **Grid Search**: Tests every combination of wall material × roof material × insulation × orientation × window area. Exhaustive but slower.
- **Genetic Algorithm**: Evolves a population of designs over multiple generations. Faster for large search spaces.

A real-time progress bar updates via Socket.IO as the search runs. Results show the top 5 configurations ranked by a weighted fitness score.

### `/validation` — Physics Model Validation
Shows how accurately the simulation engine matches known analytical solutions. Reports MAE, RMSE, and max error in °C. This page is for verifying the physics model is trustworthy.

### `/reports` — PDF Report Generation
Select a simulation and generate a professional PDF report containing the shelter design parameters, simulation results, charts, and recommended design. The PDF is generated server-side using PDFKit.

### `/shelter-designer` — Shelter Designer
A detailed form for creating and saving shelter designs with full material selection for walls, roof, floor, insulation, windows, and doors.

### `/saved-projects` — Saved Projects
Lists all saved shelter designs. Each design stores geometry, materials, and occupancy settings.

---

## How the Physics Engine Works

The engine lives in `server/src/physics/` and runs entirely in Node.js — no external simulation software needed.

### The Big Picture

Every hour of weather data is fed into the engine one step at a time. For each hour, the engine calculates:

```
Net Heat (W) = Solar Gains + Occupant Heat − Heat Losses
```

Then it updates the indoor temperature based on how much thermal mass (heat storage) the shelter has.

### Step-by-Step Calculation Per Hour

**1. Geometry** (`shapeCalculator.js`)

Calculates the exact surface areas and volume for the chosen shape:
- Rectangle: standard box with gable roof
- Dome: spherical cap geometry
- A-Frame: triangular prism with steep roof
- Quonset: semi-cylindrical arch

**2. Thermal Resistance of Walls/Roof/Floor** (`conduction.js`)

Each envelope surface is treated as a stack of layers (e.g., stone wall + insulation layer). The total resistance to heat flow is:

```
R_total = 1/h_interior + (thickness_1/conductivity_1) + (thickness_2/conductivity_2) + 1/h_exterior
```

Higher R = better insulation = less heat loss.

**3. Exterior Convection Coefficient** (`convection.js`)

Wind makes surfaces lose heat faster. The McAdams empirical formula:

```
h_exterior = 10.0 + 4.1 × wind_speed (m/s)
```

**4. Conduction Heat Loss** (`conduction.js`)

For each surface (walls, roof, floor, windows, doors):

```
Q_conduction = (T_indoor − T_outdoor) / R_total × Area
```

**5. Ventilation Heat Loss** (`heatBalance.js`)

Air leaks in and out at 0.5 air changes per hour (ACH). At 3500m altitude, air is thinner (density ~0.80 kg/m³ vs 1.225 at sea level):

```
Q_ventilation = air_density × volume × (ACH/3600) × 1005 × (T_indoor − T_outdoor)
```

**6. Sky Radiation Loss** (`radiation.js`)

The roof radiates heat to the cold night sky (Stefan-Boltzmann law). The sky temperature is estimated using the Swinbank relationship:

```
T_sky = 0.0552 × T_ambient_Kelvin^1.5
Q_radiation = emissivity × 5.67e-8 × Area × (T_surface^4 − T_sky^4)
```

**7. Passive Solar Gain** (`solar.js`)

Solar radiation enters through south-facing windows and is absorbed by opaque walls:

```
Q_solar = SHGC × window_area × solar_irradiance_on_surface
        + absorptivity × wall_area × solar_irradiance × sol-air_factor
```

The irradiance on each surface is calculated from the global horizontal radiation, sun angle, and surface orientation.

**8. Internal Gains** (`heatBalance.js`)

Occupants generate heat (80 W/person) plus equipment (100 W constant):

```
Q_internal = occupants × 80 + 100
```

**9. Temperature Update** (`temperatureSolver.js`)

The indoor temperature for the next hour is calculated using explicit Euler integration:

```
C_thermal × dT/dt = Q_solar + Q_internal − Q_losses

T_next = T_current + (net_heat_watts / C_thermal) × 3600 seconds
```

Where `C_thermal` is the total heat storage capacity of the air and envelope materials (Joules per Kelvin).

**10. Warm-Up Cycle** (`simulationEngine.js`)

Before the main simulation, the engine runs through the first 24 hours of data once to stabilize the thermal mass state. This prevents unrealistic starting conditions.

### Output Metrics

After processing all hourly data points, the engine returns:
- `avgIndoorTemp` — average indoor temperature (°C)
- `minIndoorTemp` / `maxIndoorTemp` — temperature range
- `totalSolarGain` — total passive solar energy captured (kWh)
- `totalHeatLoss` — total heat lost through envelope (kWh)
- `comfortPercentage` — % of hours where indoor temp was in the comfort band
- `heatingRequirement` — estimated auxiliary heating energy needed (kWh)
- `componentBreakdown` — average heat loss split by walls, roof, windows, ventilation, radiation

---

## How the Optimization Engine Works

### Grid Search (`gridSearch.js`)

Tests every combination of:
- Wall material (from materials database)
- Roof material
- Insulation material
- Shelter orientation (90°, 135°, 180°, 225°, 270°)
- Insulation thickness (5cm, 10cm, 15cm, 20cm, 25cm)
- Window area (1.5, 2.0, 2.5, 3.5, 4.5 m²)

For each combination, it runs a full thermal simulation and scores it.

### Genetic Algorithm (`geneticAlgorithm.js`)

Inspired by biological evolution:

1. **Population**: Start with 16 random shelter configurations (chromosomes)
2. **Evaluate**: Run a simulation for each and calculate a fitness score
3. **Select**: Keep the top-performing designs (tournament selection)
4. **Crossover**: Combine parameters from two parent designs to create children
5. **Mutate**: Randomly change one parameter with 15% probability
6. **Repeat**: Run for N generations (default 10)
7. **Elitism**: Always keep the top 2 designs from each generation

**Fitness Score Formula:**
```
fitness = (comfort_weight × comfort_%) − (heat_loss_weight × heat_loss_penalty) + (solar_weight × solar_score)
```

Default weights: comfort=0.5, heat_loss=0.3, solar_gain=0.2 (adjustable in the UI).

### Real-Time Progress

During optimization, the server emits Socket.IO events (`optimization:progress`) every generation. The frontend listens and updates the progress bar live without polling.

---

## Database & Data Models

### When MongoDB is Available
Data is persisted in MongoDB using Mongoose schemas.

### When MongoDB is Offline
The app automatically uses `inMemoryStore.js` — a JavaScript object that acts as a database. It is pre-seeded with:
- Default building materials (Rammed Earth, PUF Insulation, Double Low-E Glass, etc.)
- A default Leh/Ladakh climate dataset
- A default shelter design
- Physics validation test cases

**Data is lost when the server restarts in in-memory mode.** Install MongoDB for persistence.

### Key Data Models

**Shelter** — stores a complete shelter design:
- `geometry`: length, width, height, wall/roof/floor thickness
- `design`: shape, orientation (degrees), roof type and angle
- `openings`: window count/area, door count/area, opening orientation
- `materials`: references to wall, roof, floor, insulation, window, door materials
- `internalGains`: occupant count, heat per person, equipment power

**Material** — stores thermal properties of a building material:
- `thermalConductivity` (W/m·K)
- `density` (kg/m³)
- `specificHeat` (J/kg·K)
- `emissivity`, `solarAbsorptivity`
- `category`: Wall / Roof / Floor / Insulation / Window / Door

**ClimateDataset** — stores hourly weather data:
- `location`, `latitude`, `longitude`, `elevation`
- `sourceType`: "Open-Meteo" or "CSV"
- `dataPoints[]`: array of `{ timestamp, ambientTemperature, solarRadiation, windSpeed, humidity }`

**Simulation** — stores a complete simulation run:
- Links to a `Shelter` and `ClimateDataset`
- `results.timeSeries[]`: hour-by-hour indoor/outdoor temperatures and heat flows
- `results.metrics`: summary statistics
- `results.componentBreakdown`: average heat loss by component

---

## REST API Reference

All API routes are prefixed with `/api`.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create a new user account |
| `POST` | `/api/auth/login` | Login and receive a JWT token |
| `GET` | `/api/materials` | Get all building materials |
| `POST` | `/api/materials` | Add a custom material |
| `GET` | `/api/shelters` | Get all saved shelter designs |
| `POST` | `/api/shelters` | Save a new shelter design |
| `GET` | `/api/climate` | Get all saved climate datasets |
| `POST` | `/api/climate/import` | Fetch weather from Open-Meteo API |
| `POST` | `/api/climate/csv` | Parse and save a CSV weather file |
| `POST` | `/api/simulation/run` | Run a simulation with a saved shelter + climate |
| `POST` | `/api/simulation/run-auto` | Run simulation from the wizard (creates shelter automatically) |
| `GET` | `/api/simulation/user/history` | Get all simulations for the current user |
| `POST` | `/api/optimization/grid` | Run Grid Search optimization |
| `POST` | `/api/optimization/genetic` | Run Genetic Algorithm optimization |
| `GET` | `/api/validation` | Get physics model validation benchmarks |
| `POST` | `/api/ai/explain` | Get AI explanation of simulation results |
| `POST` | `/api/reports/generate` | Generate a PDF report |
| `GET` | `/api/health` | Server health check |

---

## Key Concepts for Beginners

**Thermal Conductivity (k)**: How easily heat flows through a material. Stone has k ≈ 1.7 W/m·K (conducts heat easily). PUF insulation has k ≈ 0.025 W/m·K (resists heat flow). Lower is better for insulation.

**R-Value**: Thermal resistance. R = thickness / conductivity. Higher R = better insulation. Adding an insulation layer dramatically increases R.

**Thermal Mass**: Heavy materials (stone, rammed earth) store heat during the day and release it at night, smoothing out temperature swings. This is why traditional Ladakhi buildings use thick stone walls.

**Lumped Capacitance Model**: The physics engine treats the entire shelter interior as a single temperature zone (one "lump"). This is a simplification — real buildings have temperature gradients — but it is accurate enough for design comparison purposes.

**Surface-to-Volume Ratio (A/V)**: A dome has a lower A/V ratio than a box of the same volume. Lower A/V means less surface area to lose heat through, which is why domes are thermally efficient.

**SHGC (Solar Heat Gain Coefficient)**: A number from 0 to 1 for windows. SHGC = 0.7 means 70% of incident solar radiation passes through the glass into the shelter. Higher SHGC = more passive solar heating.

**Comfort Percentage**: The percentage of simulated hours where the indoor temperature stayed within the comfort band (default 18–24°C). A design with 85% comfort means the shelter was comfortable for 85% of the simulated period without any active heating.

**ACH (Air Changes per Hour)**: How many times the entire air volume of the shelter is replaced per hour due to leaks and ventilation. This app uses 0.5 ACH, which represents a well-sealed passive shelter.

---

## Known Limitations

- Single-zone model: assumes uniform temperature throughout the shelter interior
- No CFD (Computational Fluid Dynamics): airflow patterns inside the shelter are not modelled
- Infiltration rate is fixed at 0.5 ACH (not calculated from actual gap sizes)
- Ground temperature is estimated as ambient + 3°C (not a full ground heat transfer model)
- The Genetic Algorithm uses a fixed set of candidate values for orientation, thickness, and window area rather than a continuous search space

---

## Quick Troubleshooting

**Backend won't start**: Check that `server/.env` exists with at least `PORT` and `JWT_SECRET` set.

**"Failed to fetch climate data"**: The Open-Meteo API requires an internet connection. Check your network.

**Simulation returns no results**: Make sure you selected a climate dataset in Step 1 of the wizard. The dataset must have at least 1 data point.

**3D viewer is blank**: Your browser must support WebGL. Try Chrome or Firefox. Disable hardware acceleration blockers.

**In-memory mode warning**: This is not an error. The app works fully. Install and start MongoDB if you want data to persist between server restarts.
