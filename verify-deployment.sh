#!/bin/bash

# Verification script for SOCRATE-AI deployment
# Usage: ./verify-deployment.sh

echo "🔍 SOCRATE-AI Deployment Verification"
echo "======================================"
echo ""

BASE_URL="https://socrate-ai-8teu.vercel.app"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Main app
echo "1️⃣  Testing main application..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL)
if [ $STATUS -eq 200 ]; then
    echo -e "   ${GREEN}✅ Main app: OK (Status: $STATUS)${NC}"
else
    echo -e "   ${RED}❌ Main app: FAILED (Status: $STATUS)${NC}"
fi
echo ""

# Test 2: Auth page
echo "2️⃣  Testing auth page..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/auth.html)
if [ $STATUS -eq 200 ]; then
    echo -e "   ${GREEN}✅ Auth page: OK (Status: $STATUS)${NC}"
else
    echo -e "   ${RED}❌ Auth page: FAILED (Status: $STATUS)${NC}"
fi
echo ""

# Test 3: Chat API (should return 401 without auth)
echo "3️⃣  Testing chat API endpoint..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/chat)
if [ $STATUS -eq 401 ] || [ $STATUS -eq 405 ]; then
    echo -e "   ${GREEN}✅ Chat API: OK (Protected - Status: $STATUS)${NC}"
else
    echo -e "   ${YELLOW}⚠️  Chat API: Unexpected status ($STATUS)${NC}"
fi
echo ""

# Test 4: Stripe checkout API (should return error without proper request)
echo "4️⃣  Testing Stripe checkout endpoint..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/stripe/create-checkout-session)
if [ $STATUS -eq 401 ] || [ $STATUS -eq 405 ] || [ $STATUS -eq 500 ]; then
    echo -e "   ${GREEN}✅ Stripe checkout: OK (Protected - Status: $STATUS)${NC}"
else
    echo -e "   ${YELLOW}⚠️  Stripe checkout: Unexpected status ($STATUS)${NC}"
fi
echo ""

# Test 5: Webhook endpoint (should be accessible but require signature)
echo "5️⃣  Testing Stripe webhook endpoint..."
RESPONSE=$(curl -s -X POST $BASE_URL/api/stripe/webhook \
    -H "Content-Type: application/json" \
    -d '{"type": "test"}')

if echo "$RESPONSE" | grep -q "Webhook Error\|No signatures"; then
    echo -e "   ${GREEN}✅ Webhook: OK (Signature verification active)${NC}"
    echo -e "   ${GREEN}   Message: Properly rejecting unsigned requests${NC}"
else
    echo -e "   ${YELLOW}⚠️  Webhook: Response unclear${NC}"
    echo "   Response: $RESPONSE"
fi
echo ""

# Summary
echo "======================================"
echo "✨ Verification Complete!"
echo ""
echo "📝 Next Steps:"
echo "   1. Check Vercel Dashboard for deployment logs"
echo "   2. Run database migration (see below)"
echo "   3. Test with real user flow"
echo ""
echo "🗄️  Database Migration Command:"
echo "   curl -X POST $BASE_URL/api/init-db \\"
echo "     -H \"x-init-token: YOUR_DB_INIT_SECRET\""
echo ""
echo "🔗 URLs:"
echo "   App: $BASE_URL"
echo "   Vercel: https://vercel.com/dashboard"
echo "   Stripe: https://dashboard.stripe.com"
echo ""
