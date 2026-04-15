#!/bin/bash
# ─── Start UI in Mock / Demo Mode ───────────────────────────────────────────
# No real Weaviate needed. All data is synthetic (ecommerce / healthcare / media / iot).
#
# Usage:
#   chmod +x start-mock.sh
#   ./start-mock.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
UI_DIR="$SCRIPT_DIR/weaviate-admin-ui"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║        Weaviate Admin UI  —  MOCK / DEMO MODE        ║"
echo "║  No real Weaviate instance required                  ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "📦  Checking dependencies..."

cd "$UI_DIR"

# Install node_modules if missing
if [ ! -d "node_modules" ]; then
  echo "   Running npm install first..."
  npm install --silent
fi

# Write the mock env file as .env.local so CRA picks it up automatically
cat > .env.local <<'EOF'
REACT_APP_MOCK_MODE=true
REACT_APP_API_URL=http://localhost:8000/api/v1
EOF

echo "✅  Mock mode enabled (.env.local written)"
echo ""
echo "🌐  Starting dev server on http://localhost:3000"
echo ""
echo "   Login with:"
echo "     Email   : engineer1@example.com"
echo "     Password: admin123"
echo ""
echo "   Pick a domain on the login page:"
echo "     🛍️  E-Commerce   — Products / Orders / Customers"
echo "     🏥  Healthcare   — Patients / Doctors / Appointments"
echo "     📰  Media        — Articles / Authors / Comments"
echo "     🔌  IoT          — Devices / Sensor Readings / Alerts"
echo ""
echo "─────────────────────────────────────────────────────────"
echo "   Press Ctrl+C to stop"
echo "─────────────────────────────────────────────────────────"
echo ""

BROWSER=none npm start
