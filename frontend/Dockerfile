FROM node:24-bookworm-slim AS build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
ARG BACKEND_API_URL=http://api:4000
ENV BACKEND_API_URL=$BACKEND_API_URL NEXT_TELEMETRY_DISABLED=1
RUN npm run build && npm prune --omit=dev
FROM node:24-bookworm-slim AS runtime
WORKDIR /app/frontend
ENV NODE_ENV=production PORT=3000 NEXT_TELEMETRY_DISABLED=1 BACKEND_API_URL=http://api:4000
COPY --from=build --chown=node:node /app/frontend/package.json ./package.json
COPY --from=build --chown=node:node /app/frontend/node_modules ./node_modules
COPY --from=build --chown=node:node /app/frontend/.next ./.next
COPY --from=build --chown=node:node /app/frontend/public ./public
COPY --from=build --chown=node:node /app/frontend/next.config.ts ./next.config.ts
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://127.0.0.1:3000/login').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["npm","run","start"]
