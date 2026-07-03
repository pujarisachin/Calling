FROM node:20-slim AS build

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./

RUN npm install

COPY frontend /app

RUN npm run build

FROM node:20-slim

WORKDIR /app

RUN npm install -g serve

COPY --from=build /app/dist ./dist

EXPOSE 5173

CMD ["serve", "-s", "dist", "-l", "5173"]
