## First prompt use to start the project (on Claude Opus 4.5, first in plan mode, then "Start implementation with yes to all consideration" in agent mode)

I want to create a basic chatbot application that a user (general public) will be able to access via a frontend app and ask the questions the user want with text, voice and attachment files. The chatbot will be able to answer as best as he can with text and files. I will need a user management system with JWT tokens with refresh tokens authentication. Users will first need to create a user or login with an existing user. Then, he will be brought to the chat interface, where he will be able to have a conversation with the chatbot, start a new chat session with the chatbot and access his previous conversation. For the first version, we can focus only on text input and output for the chatbot and ignore the voice and attachment files for questions and files in the answer.

I want to build the app as monorepo that will contain a REST api backend and a multiplatform frontend (in the current folder).

The backend should be a REST api app in python that will use FastAPI, SQLModel, Alembic (include full schema with proper relationships initial migration with manual migration commands), LangChain, Ollama, Llama  (#fetch https://www.llama.com/llama-downloads/?utm_source=llama-home-hero&utm_medium=llama-referral&utm_campaign=llama-utm&utm_offering=llama-downloads&utm_product=llama, 4 is fully released, use llama3.2:3b for local dev and 4 scout/maverick configurable  for production, assume Meta license agreement is accepted, use .env for this config). The backend should be able to run in a docker python image 3.14-trixie (#fetch https://hub.docker.com/_/python, 3.14 is fully released). I also want the database for this backend to be a postgresql. The database should be able to run in a docker postgresql image 18-trixie (#fetch https://hub.docker.com/_/postgres 18 is fully released, include healthcheck for DB readiness). I also want the Llama to be hosted locally with Ollama in docker (#fetch https://hub.docker.com/r/ollama/ollama, include optional NVIDIA and AMD GPU configuration with CPU fallback, Auto-pull only dev model, document production model setup). Also we should be able to run the whole backend locally with docker compose.

For the linter and formater of the backend, I want to use Ruff for both.

For the backend I want a rule set similar to what flake8 and black offer by default.

The frontend should be an app for web, mobile (android, ios) and desktop (windows, MacOS, Linux) in TS that uses Tauri, React, Vite, React-Router, MUI and redux toolkit. All the frontend will use a single code base. All this will run with node 24 (#fetch https://hub.docker.com/_/node, 24 is fully released, but we won’t use docker for the frontend, use .nvmrc file and engines field in package.json for compatibility checks). We should be able to use locally for all platform and won’t need docker (include detailed instructions for Tauri prerequisites, also include full mobile, web and desktop setup, don’t need a ci/cd pipeline, will use/test the target we can with the environment we're on [windows at the moment, MacOS and ios required a mac and the doc should leave it at that]).

For the frontend I want prettier for the formatter and eslint for the linter.

For frontend I want the rule set to be based on the TS airbnb rules set, so we should use the pacakge eslint-config-airbnb-extended for this.

Can you help build/setup the base for all this. For now let's focus on the technical base and put placeholders for the functionality. I also want you to help me document the base readme file and a .env.example with all required variables (generate strong secret for production).
