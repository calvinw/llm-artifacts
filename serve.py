from livereload import Server

server = Server()
server.watch('new-index.html')
server.watch('editor.js')
server.watch('chat-engine.js')
server.watch('defaults.js')
server.watch('fetch-models.js')
server.serve(port=5500, host='127.0.0.1')
