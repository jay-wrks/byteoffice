#!/usr/bin/env bash
set -euo pipefail

# Deploy the nested ByteOffice app directory at the Firebase Hosting root.
SOURCE_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
FIREBASE_DIR="/home/jay/works/JayDsaGames"
TARGET_DIR="$FIREBASE_DIR/public"
APP_DIR="$SOURCE_DIR/ByteOffice"

if [[ "$APP_DIR" == "$TARGET_DIR" || "$TARGET_DIR" != "$FIREBASE_DIR/public" ]]; then
  echo "Refusing unsafe source/target paths." >&2
  exit 1
fi

if [[ ! -f "$APP_DIR/java/tools.jar" ]]; then
  echo "Missing compiler asset: $APP_DIR/java/tools.jar" >&2
  exit 1
fi

if [[ ! -f "$SOURCE_DIR/ByteOffice.html" ]]; then
  echo "Missing entry template: $SOURCE_DIR/ByteOffice.html" >&2
  exit 1
fi

if [[ ! -f "$FIREBASE_DIR/firebase.json" || ! -f "$FIREBASE_DIR/.firebaserc" ]]; then
  echo "Firebase project files are missing from $FIREBASE_DIR" >&2
  exit 1
fi

echo "Replacing Firebase public root: $TARGET_DIR"
rm -rf -- "$TARGET_DIR"
mkdir -p -- "$TARGET_DIR"
cp -a -- "$APP_DIR"/. "$TARGET_DIR"/
rm -f -- "$TARGET_DIR/index.html"
sed 's#<base href="ByteOffice/" />#<base href="./" />#' \
  "$SOURCE_DIR/ByteOffice.html" > "$TARGET_DIR/index.html"

test -f "$TARGET_DIR/java/tools.jar"

echo "Deploying Firebase Hosting project"
(
  cd -- "$FIREBASE_DIR"
  firebase deploy --only hosting
)

echo "Deployment complete: https://jay-dsa-games.web.app/"
