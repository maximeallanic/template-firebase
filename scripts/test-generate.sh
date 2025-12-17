#!/bin/bash
# Script to generate and retrieve game questions via Firebase emulator
# Usage: ./scripts/test-generate.sh [phase] [difficulty]
# Example: ./scripts/test-generate.sh phase1 normal
#          ./scripts/test-generate.sh phase2 hard

PHASE="${1:-phase1}"
DIFFICULTY="${2:-normal}"

EMULATOR_URL="http://127.0.0.1:5001/spicy-vs-sweety/us-central1/generateGameQuestions"

# Mock Firebase Auth token for emulator testing
# This format is recognized by Firebase Functions emulator
AUTH_HEADER='{"uid":"test-user-123","email":"test@example.com"}'

echo "🎲 Generating $PHASE questions (difficulty: $DIFFICULTY)..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Call the Cloud Function with mock auth
RESPONSE=$(curl -s -X POST "$EMULATOR_URL" \
  -H "Content-Type: application/json" \
  -H "Firebase-Instance-ID-Token: $AUTH_HEADER" \
  -d "{\"data\":{\"phase\":\"$PHASE\",\"difficulty\":\"$DIFFICULTY\"}}")

# Check if request succeeded
if [ -z "$RESPONSE" ]; then
  echo "❌ Error: No response from emulator. Is it running?"
  echo "   Start with: npm run emulators"
  exit 1
fi

# Check for error in response
if echo "$RESPONSE" | grep -q '"error"'; then
  echo "❌ Error from Cloud Function:"
  echo "$RESPONSE" | jq -r '.error.message // .error' 2>/dev/null || echo "$RESPONSE"
  exit 1
fi

# Extract and display the result
echo ""
echo "✅ Generation successful!"
echo ""

# Parse the response based on phase
if [ "$PHASE" == "phase1" ]; then
  echo "📝 Generated Questions (Phase 1 - MCQ):"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "$RESPONSE" | jq -r '.result.data[] | "
Q: \(.text)
   A) \(.options[0])
   B) \(.options[1])
   C) \(.options[2])
   D) \(.options[3])
   ✓ Réponse: \(.options[.correctIndex])
   💡 \(.anecdote // "Pas d anecdote")
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"' 2>/dev/null

elif [ "$PHASE" == "phase2" ]; then
  echo "📝 Generated Set (Phase 2 - Sel ou Poivre):"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  DATA=$(echo "$RESPONSE" | jq -r '.result.data')
  OPTION_A=$(echo "$DATA" | jq -r '.optionA')
  OPTION_B=$(echo "$DATA" | jq -r '.optionB')
  echo ""
  echo "🎭 Jeu de mots:"
  echo "   A: $OPTION_A"
  echo "   B: $OPTION_B"
  echo ""
  echo "📋 Items:"
  echo "$DATA" | jq -r '.items[] | "   • \(.text) → \(.answer)"'
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

elif [ "$PHASE" == "phase4" ]; then
  echo "📝 Generated Questions (Phase 4 - Buzzer):"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "$RESPONSE" | jq -r '.result.data[] | "Q: \(.question)\n   → \(.answer)\n"' 2>/dev/null

elif [ "$PHASE" == "phase5" ]; then
  echo "📝 Generated Questions (Phase 5 - Burger Final):"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "$RESPONSE" | jq -r '.result.data[] | "Q: \(.question)\n   → \(.answer)\n"' 2>/dev/null

else
  echo "Raw response:"
  echo "$RESPONSE" | jq '.result.data' 2>/dev/null || echo "$RESPONSE"
fi

# Show usage stats
echo ""
echo "📊 Usage:"
echo "$RESPONSE" | jq -r '.result.usage | "   Tokens: \(.totalTokens) | Cost: $\(.estimatedCost)"' 2>/dev/null

echo ""
echo "Done! Questions have been saved to Firestore."
