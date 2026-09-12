#!/usr/bin/env bash
set -euo pipefail

# Deploy ByteOffice as the /ByteOffice/ Firebase Hosting app.
SOURCE_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
FIREBASE_DIR="/home/jay/works/JayDsaGames"
TARGET_DIR="$FIREBASE_DIR/public/ByteOffice"

if [[ "$SOURCE_DIR" == "$TARGET_DIR" || "$TARGET_DIR" != "$FIREBASE_DIR/public/ByteOffice" ]]; then
  echo "Refusing unsafe source/target paths." >&2
  exit 1
fi

if [[ ! -f "$SOURCE_DIR/java/tools.jar" ]]; then
  echo "Missing compiler asset: $SOURCE_DIR/java/tools.jar" >&2
  exit 1
fi

if [[ ! -f "$FIREBASE_DIR/firebase.json" || ! -f "$FIREBASE_DIR/.firebaserc" ]]; then
  echo "Firebase project files are missing from $FIREBASE_DIR" >&2
  exit 1
fi

echo "Replacing $TARGET_DIR"
rm -rf -- "$TARGET_DIR"
mkdir -p -- "$TARGET_DIR"
cp -a -- "$SOURCE_DIR"/. "$TARGET_DIR"/
rm -rf -- "$TARGET_DIR/.git"

test -f "$TARGET_DIR/java/tools.jar"

echo "Deploying Firebase Hosting project"
(
  cd -- "$FIREBASE_DIR"
  firebase deploy --only hosting
)

echo "Deployment complete: https://jay-dsa-games.web.app/ByteOffice/"
