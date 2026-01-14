FROM node:22.20.0

WORKDIR /app

RUN npm config set script-shell /bin/bash

COPY package*.json ./

RUN npm install

COPY . .

RUN mkdir -p /mnt/c/Windows/System32/WindowsPowerShell/v1.0 \
    && touch /mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe \
    && chmod +x /mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe

EXPOSE 3000

CMD ["node", "index.js"]