#!/bin/bash

echo "================================"
echo "Running C# Tests with Coverage"
echo "================================"

cd Tests
dotnet test /p:CollectCoverage=true /p:CoverletOutputFormat=cobertura /p:CoverletOutput=./TestResults/coverage.cobertura.xml /p:Threshold=80 /p:ThresholdType=line,branch,method

echo ""
echo "================================"
echo "Running TypeScript Tests with Coverage"
echo "================================"

cd ..
npm run test:coverage

echo ""
echo "================================"
echo "Coverage Reports Generated"
echo "================================"
echo "C# Coverage: Tests/TestResults/coverage.cobertura.xml"
echo "TypeScript Coverage: coverage/"
