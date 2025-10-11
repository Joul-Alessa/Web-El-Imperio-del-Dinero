FROM node:22.20.0

WORKDIR /app

RUN npm config set script-shell /bin/bash

RUN npm init -y

COPY . .

RUN mkdir -p /mnt/c/Windows/System32/WindowsPowerShell/v1.0 \
    && touch /mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe \
    && chmod +x /mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe

EXPOSE 4200

CMD ["npm", "install", "express"]