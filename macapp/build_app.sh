#!/bin/bash
# Build HDAR.app from the Swift package. Run on macOS with the Xcode command-line
# tools installed (xcode-select --install). Produces ./HDAR.app.
set -euo pipefail

cd "$(dirname "$0")"

CONFIG="${1:-release}"
APP="HDAR.app"
BIN_NAME="HDARApp"

echo "==> swift build -c $CONFIG"
swift build -c "$CONFIG" --product "$BIN_NAME"

BIN_PATH="$(swift build -c "$CONFIG" --product "$BIN_NAME" --show-bin-path)/$BIN_NAME"
if [[ ! -x "$BIN_PATH" ]]; then
  echo "error: built binary not found at $BIN_PATH" >&2
  exit 1
fi

echo "==> assembling $APP"
rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
cp "$BIN_PATH" "$APP/Contents/MacOS/$BIN_NAME"
cp Info.plist "$APP/Contents/Info.plist"

# Ad-hoc code signature so Gatekeeper will run it locally without a Dev ID.
# (For distribution you would sign with a Developer ID and notarize.)
if command -v codesign >/dev/null 2>&1; then
  echo "==> ad-hoc codesign"
  codesign --force --deep --sign - "$APP" || echo "warn: ad-hoc codesign failed (app still runs locally)"
fi

echo "==> done: $(pwd)/$APP"
echo "    open $APP    # or double-click it in Finder"
