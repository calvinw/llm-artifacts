from livereload import Server

server = Server()
server.watch('index.html')
server.watch('artifact-editor.js')
server.watch('artifact-editor-styles.css')
server.watch('chat-engine.js')
server.watch('defaults.js')
server.watch('fetch-models.js')
server.serve(port=5500, host='127.0.0.1')
