#!python
# serve.py
from livereload import Server

server = Server()

server.watch("*.html")
server.watch("*.css")
server.watch("*.js")

server.serve()
