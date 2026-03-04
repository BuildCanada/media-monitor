FROM node:20

RUN apt-get update && apt-get install -y \
    git \
    zsh \
    fzf \
    curl \
    sudo \
    lsb-release \
    && echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list \
    && curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /etc/apt/trusted.gpg.d/pgdg.gpg \
    && apt-get update \
    && apt-get install -y postgresql-client-17 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN echo "node ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

USER node
WORKDIR /workspace
