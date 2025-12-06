FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN pwd && \
    ls -la && \
    echo "Content of tsconfig.json:" && \
    cat tsconfig.json && \
    echo "\nContent of src directory:" && \
    ls -la src/ && \
    echo "\nRunning TypeScript build..." && \
    npm run build && \
    echo "\nBuild complete. Content of dist directory:" && \
    ls -la dist/ && \
    echo "\nContent of dist/server.js:" && \
    cat dist/server.js || true

EXPOSE 3001

CMD ["node", "dist/server.js"] 