library(servr)

server <- httw(
  dir = ".",                    # Current directory
  #pattern = "^(test|messages)[.]md$",   # Only watch markdown files
  pattern = "^(index)[.]html|(artifact-editor)[.]js|(artifact-editor-styles)[.]css|chat-engine[.]js$",   
  host = "127.0.0.1",          # localhost
  port = 4321                  # Custom port
)
