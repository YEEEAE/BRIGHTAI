import http.server
import socketserver
import os

PORT = 8000

class CleanUrlHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Parse path to handle clean URLs (remove query params for path check)
        path_parts = self.path.split('?')
        clean_path = path_parts[0]
        query_string = "?" + path_parts[1] if len(path_parts) > 1 else ""
        
        # Get filesystem path
        fs_path = os.path.join(os.getcwd(), clean_path.lstrip('/'))
        
        # 1. If path is a directory and doesn't end in slash, redirect (default behavior is usually fine, but let's be explicit)
        if os.path.isdir(fs_path) and not clean_path.endswith('/'):
             self.send_response(301)
             self.send_header('Location', clean_path + '/' + query_string)
             self.end_headers()
             return

        # 2. If it's a file request that exists, serve it
        if os.path.exists(fs_path) and os.path.isfile(fs_path):
            super().do_GET()
            return
            
        # 3. If it's a directory with trailing slash, default handler looks for index.html automatically
        if os.path.isdir(fs_path) and clean_path.endswith('/'):
            super().do_GET()
            return

        # 4. MAGIC: Check if .html extension exists for the path
        html_path = fs_path + ".html"
        if os.path.exists(html_path):
            # Internal rewrite: serve the .html file
            self.path = clean_path + ".html" + query_string
            super().do_GET()
            return
            
        # 5. Default (404)
        super().do_GET()

# Allow address reuse to prevent "Address already in use" errors on restart
socketserver.TCPServer.allow_reuse_address = True

with socketserver.TCPServer(("", PORT), CleanUrlHandler) as httpd:
    print(f"\n✅ Server started at http://localhost:{PORT}")
    print("✨ Clean URLs matching the production .htaccess logic are active.")
    print("   (e.g. visiting '/about-us' serves 'about-us.html')")
    print("Press Ctrl+C to stop.\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    print("\nServer stopped.")
