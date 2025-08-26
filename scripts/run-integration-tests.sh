#!/bin/bash

# Integration Test Runner Script
# Author: Yevdoa

set -e

echo "🚀 Starting Octo Billing Integration Tests"
echo "=========================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ and try again."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm and try again."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build test Docker image
echo "🐳 Building test Docker image..."
docker build -t octo-billing:test .

# Run integration tests
echo "🧪 Running integration tests..."
npm run test:integration:report

echo "✅ Integration tests completed!"
echo ""
echo "📊 Test reports generated:"
echo "  - JSON Report: integration-test-report.json"
echo "  - Coverage: coverage/integration/"
echo "  - JUnit XML: reports/integration-test-results.xml"
echo ""
echo "🎉 All done!"
