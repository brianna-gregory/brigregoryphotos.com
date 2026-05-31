#!/usr/bin/env python3
"""
Brianna Gregory Photography — Photo Booth Server
Runs locally on the Mac. Receives a photo + phone number from the booth
and sends the photo via the Messages app (your real iPhone number).

Requirements:
  - Python 3 (already on every Mac)
  - Messages app open and signed in with your Apple ID
  - iPhone linked to iMessage on this Mac
"""

import http.server
import json
import base64
import subprocess
import tempfile
import os

PORT = 3001

class BoothHandler(http.server.BaseHTTPRequestHandler):

    def do_OPTIONS(self):
        self._cors()
        self.end_headers()

    def do_POST(self):
        if self.path != "/send":
            self.send_response(404)
            self.end_headers()
            return

        try:
            length = int(self.headers.get("Content-Length", 0))
            body   = self.rfile.read(length)
            data   = json.loads(body)

            phone   = data.get("phone", "").strip()
            img_b64 = data.get("image", "")

            if not phone or not img_b64:
                raise ValueError("Missing phone or image.")

            # Strip data URL header and decode
            if "," in img_b64:
                img_b64 = img_b64.split(",", 1)[1]
            img_bytes = base64.b64decode(img_b64)

            # Save to a temp PNG file
            tmp = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
            tmp.write(img_bytes)
            tmp.close()
            img_path = tmp.name

            # Build AppleScript — sends the image via Messages
            # Messages handles iMessage vs SMS automatically based on the recipient
            script = f'''
tell application "Messages"
    set targetService to first service whose service type = iMessage
    set targetBuddy to buddy "{phone}" of targetService
    send POSIX file "{img_path}" to targetBuddy
end tell
'''
            result = subprocess.run(
                ["osascript", "-e", script],
                capture_output=True, text=True, timeout=20
            )

            os.unlink(img_path)

            if result.returncode == 0:
                self._respond({"success": True})
            else:
                err = result.stderr.strip() or "AppleScript failed."
                # Common fix: if buddy doesn't exist yet, try SMS service
                if "buddy" in err.lower() or "service" in err.lower():
                    err = "Recipient not found in Messages. Make sure Messages is open and your iPhone is linked."
                self._respond({"success": False, "error": err})

        except Exception as e:
            self._respond({"success": False, "error": str(e)})

    def _cors(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _respond(self, payload):
        body = json.dumps(payload).encode()
        self._cors()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        status = args[1] if len(args) > 1 else ""
        path   = args[0].split(" ")[1] if args else ""
        print(f"  {status}  {path}")


print("━" * 48)
print("  Brianna Gregory Photography — Booth Server")
print(f"  Listening on http://localhost:{PORT}")
print("  Keep this window open during the event.")
print("━" * 48)

server = http.server.HTTPServer(("localhost", PORT), BoothHandler)
server.serve_forever()
