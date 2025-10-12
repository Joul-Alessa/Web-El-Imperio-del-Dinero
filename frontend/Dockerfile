FROM node:22.20.0

WORKDIR /app

RUN npm config set script-shell /bin/bash

COPY Web-El-Imperio-del-Dinero/package.json ./
COPY Web-El-Imperio-del-Dinero/package-lock.json ./
RUN npm install -g @angular/cli
RUN npm install

RUN mkdir -p /mnt/c/Windows/System32/WindowsPowerShell/v1.0 \
    && touch /mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe \
    && chmod +x /mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe

EXPOSE 4200