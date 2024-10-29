from livereload import Server

server = Server()
server.watch('index.html')
server.serve(port=5500, host='127.0.0.1')
