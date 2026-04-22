# Finance PRO — Web Edition

A web-based financial dashboard for Brazilian freelancers (MEI/Simples Nacional). Calculate your PJ taxes (DAS, INSS, IRPF), track assets and expenses, archive months, and export everything to Excel.

> This is a full web rewrite of the original Flet desktop app, using FastAPI (Python) on the backend and React on the frontend.

---

## Features

- **PJ / PF mode** — automatic DAS (Anexo III / Anexo V), INSS, and IRPF calculation
- **Live exchange rates** — USD, AUD → BRL via ExchangeRate-API
- **Asset tracking** — Savings, Investment, Expense, Asset categories with multi-currency support
- **Monthly balance** — net profit minus current deductions, updated in real time
- **Month archiving** — close and lock each month; history stays forever
- **Excel export** — full report with Dashboard, Calculations, Assets, and Archived Months sheets
- **Auth** — per-user accounts with hashed passwords and JWT sessions

---

## Project Structure

```
finance-web/
├── backend/
│   ├── main.py          # FastAPI app (all routes + Excel export)
│   ├── requirements.txt
│   └── finance.db       # SQLite database (created on first run)
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── api.js
        └── components/
            ├── Auth.jsx
            ├── Dashboard.jsx
            ├── Calculator.jsx
            ├── History.jsx
            ├── Assets.jsx
            └── Months.jsx
```

---

## How to Run

You need **Python 3.10+** and **Node.js 18+** installed.

### 1 — Backend (FastAPI)

```bash
cd finance-web/backend

# Create a virtual environment (recommended)
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.  
Swagger docs at `http://localhost:8000/docs`.

### 2 — Frontend (React + Vite)

Open a **second terminal**:

```bash
cd finance-web/frontend

# Install Node dependencies
npm install

# Start the dev server
npm run dev
```

The app will open at **`http://localhost:5173`**.

> The Vite dev server proxies all `/api` requests to `http://localhost:8000`, so you don't need to worry about CORS during development.

### Both must run at the same time

Keep two terminals open — one for the backend, one for the frontend.

---

## Production Build

```bash
# Build the frontend
cd frontend
npm run build
# Output is in frontend/dist/

# Serve the backend (no --reload in prod)
cd ../backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

To serve the built frontend alongside the backend, copy `frontend/dist/` to a static file server (Nginx, Caddy) or serve it from FastAPI with `StaticFiles`.

---

## Tax Logic

| Field | Formula |
|-------|---------|
| Fator R | `Pro-Labore / Receita Total` |
| DAS Anexo III | `Receita Total × 6%` (when Fator R ≥ 28%) |
| DAS Anexo V | `Receita Total × 15.5%` (when Fator R < 28%) |
| INSS | `Pro-Labore × 11%` |
| IRPF | `max((Pro-Labore − INSS) × 7.5% − R$ 158, 0)` |
| Net Profit | `Receita Total − DAS − INSS − IRPF` |

---

## Security Note

The `SECRET` key in `backend/main.py` should be changed to a long random string before deploying to production. You can generate one with:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```
