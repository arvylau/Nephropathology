"""
Simple proxy server for Claude API calls to avoid CORS issues
"""
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import urllib.request
import urllib.error

class ClaudeProxyHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle preflight CORS requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, x-api-key')
        self.end_headers()

    def do_POST(self):
        """Proxy POST requests to Claude API"""
        if self.path == '/api/claude':
            try:
                # Read request body
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                request_data = json.loads(post_data.decode('utf-8'))

                # Extract API key and request body
                api_key = request_data.get('api_key')
                claude_request = request_data.get('request')

                if not api_key or not claude_request:
                    self.send_error(400, "Missing api_key or request")
                    return

                # Make request to Claude API
                req = urllib.request.Request(
                    'https://api.anthropic.com/v1/messages',
                    data=json.dumps(claude_request).encode('utf-8'),
                    headers={
                        'Content-Type': 'application/json',
                        'x-api-key': api_key,
                        'anthropic-version': '2023-06-01'
                    }
                )

                # Get response
                with urllib.request.urlopen(req) as response:
                    response_data = response.read()

                # Send success response
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(response_data)

            except urllib.error.HTTPError as e:
                error_body = e.read().decode('utf-8')
                print(f"[ERROR] API returned {e.code}: {error_body}")
                self.send_response(e.code)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(error_body.encode('utf-8'))

            except Exception as e:
                print(f"[ERROR] Exception: {str(e)}")
                self.send_error(500, str(e))
        else:
            self.send_error(404, "Not found")

    def log_message(self, format, *args):
        """Custom log format"""
        print(f"[Claude Proxy] {format % args}")

def run_server(port=8081):
    """Run the proxy server"""
    server_address = ('', port)
    httpd = HTTPServer(server_address, ClaudeProxyHandler)
    print(f"===========================================")
    print(f"Claude API Proxy Server")
    print(f"===========================================")
    print(f"Listening on: http://localhost:{port}")
    print(f"Proxy endpoint: http://localhost:{port}/api/claude")
    print(f"Press Ctrl+C to stop")
    print(f"===========================================")
    httpd.serve_forever()

if __name__ == '__main__':
    run_server(8081)
