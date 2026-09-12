#!/usr/bin/env bash

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║        🚀 BYTE OFFICE DEPLOYMENT         ║"
echo "╚══════════════════════════════════════════╝"
echo ""

echo "┌─ 📁 Copying ByteOffice/"
cp -aT /home/jay/works/ByteOffice/ByteOffice /home/jay/works/JayDsaGames/public/ByteOffice
echo "└─ ✅ ByteOffice/ copied"
echo ""

echo "┌─ 📄 Copying ByteOffice.html"
cp -f /home/jay/works/ByteOffice/ByteOffice.html /home/jay/works/JayDsaGames/public/ByteOffice.html
echo "└─ ✅ ByteOffice.html copied"
echo ""

echo "┌─ ☁️  Deploying Firebase Hosting"
cd /home/jay/works/JayDsaGames
firebase deploy --only hosting
echo "└─ ✅ Firebase deployment finished"
echo ""

echo "╔══════════════════════════════════════════╗"
echo "║        ✅ BYTE OFFICE DEPLOYMENT DONE    ║"
echo "╚══════════════════════════════════════════╝"
