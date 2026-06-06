#!/bin/bash

TEST_ID="starsdk-game-launch-test"
API_URL="http://localhost:4000"

echo "🚀 Starting StarSDK Game Launch Test..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Run the test
echo "⏳ Executing test (this will take 90-120 seconds)..."
RESULT=$(curl -s -X POST "${API_URL}/api/tests/run/${TEST_ID}" \
  -H "Content-Type: application/json" \
  -d '{"headful": true}')

echo "Response: $RESULT"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check for evidence
echo ""
echo "📸 Evidence Captured:"
ls -lh d:/aqtest/artifacts/test-evidence/screenshots/ 2>/dev/null | tail -10 || echo "No screenshots yet"

echo ""
echo "📋 Reports Generated:"
ls -lh d:/aqtest/artifacts/test-evidence/reports/ 2>/dev/null | tail -5 || echo "No reports yet"

echo ""
echo "📚 Knowledge Base:"
cat d:/aqtest/artifacts/knowledge-base/knowledge-base.json 2>/dev/null | head -50 || echo "No KB data yet"

echo ""
echo "✅ Test execution complete!"
