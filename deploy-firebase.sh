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

echo "┌─ 📄 Copying index.html"
cp -f /home/jay/works/ByteOffice/index.html /home/jay/works/JayDsaGames/public/index.html
echo "└─ ✅ index.html copied"
echo ""

echo "┌─ 🔐 Copying Firestore rules"
cp -f /home/jay/works/ByteOffice/firestore.rules /home/jay/works/JayDsaGames/firestore.rules
cp -f /home/jay/works/ByteOffice/firestore.indexes.json /home/jay/works/JayDsaGames/firestore.indexes.json
cp -f /home/jay/works/ByteOffice/firebase.json /home/jay/works/JayDsaGames/firebase.json
echo "└─ ✅ Firestore rules copied"
echo ""

echo "┌─ ☁️  Deploying Firebase Hosting"
cd /home/jay/works/JayDsaGames
firebase deploy --only hosting,firestore
echo "└─ ✅ Firebase deployment finished"
echo ""

echo "╔══════════════════════════════════════════╗"
echo "║        ✅ BYTE OFFICE DEPLOYMENT DONE    ║"
echo "╚══════════════════════════════════════════╝"
