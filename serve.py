from livereload import Server

server = Server()
server.watch('{messages,test}.md', delay=0.01)
server.serve(port=5500, host='127.0.0.1')
