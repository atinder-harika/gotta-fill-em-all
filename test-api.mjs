// Test script for API endpoints
// Run with: node test-api.mjs

const BASE_URL = "http://localhost:3000";

async function testChatAPI() {
  console.log("\n🧪 Testing /api/chat...");
  
  try {
    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "What is a DLI number?",
        history: []
      }),
    });

    const data = await response.json();
    console.log("✅ Chat API Response:", data);
    return true;
  } catch (error) {
    console.error("❌ Chat API Error:", error.message);
    return false;
  }
}

async function testSpeakAPI() {
  console.log("\n🧪 Testing /api/speak...");
  
  try {
    const response = await fetch(`${BASE_URL}/api/speak`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: "Hello! I'm Ashly, your bureaucracy trainer!",
        accent: "canadian"
      }),
    });

    if (response.ok) {
      console.log("✅ Speak API Response: Audio stream received");
      console.log("   Content-Type:", response.headers.get("Content-Type"));
      console.log("   Accent:", response.headers.get("X-Voice-Accent"));
      return true;
    } else {
      const error = await response.json();
      console.error("❌ Speak API Error:", error);
      return false;
    }
  } catch (error) {
    console.error("❌ Speak API Error:", error.message);
    return false;
  }
}

async function runTests() {
  console.log("🚀 Starting API Tests...");
  console.log("⚠️  Note: You must be logged in with Clerk for these to work!");
  
  const chatResult = await testChatAPI();
  const speakResult = await testSpeakAPI();
  
  console.log("\n📊 Test Results:");
  console.log(`  Chat API: ${chatResult ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`  Speak API: ${speakResult ? "✅ PASS" : "❌ FAIL"}`);
}

runTests();
