# Servidor de desenvolvimento sem cache (o browser vê sempre a versão mais recente).
# Uso: python3 tools/serve.py [porta]
import http.server, sys, os

class NoCache(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, '.js': 'text/javascript; charset=utf-8', '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8'}
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

os.chdir(os.path.join(os.path.dirname(__file__), '..', 'www'))
port = int(sys.argv[1]) if len(sys.argv) > 1 else 8123
print(f'Mini Jogos em http://localhost:{port}')
class Server(http.server.ThreadingHTTPServer):
    request_queue_size = 128  # o browser pede muitos módulos ao mesmo tempo
    daemon_threads = True

Server(('', port), NoCache).serve_forever()
