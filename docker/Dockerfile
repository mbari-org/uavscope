# ---- Build stage ----
  FROM node:20-alpine AS build

  WORKDIR /app
  COPY package*.json ./
  RUN npm ci
  
  COPY . .

  ARG VITE_TATOR_HOST=""
  ARG VITE_TATOR_TOKEN=""
  ARG VITE_BOX_TYPE="3"
  ARG VITE_PROJECT_ID="4"
  ARG VITE_API_TIMEOUT="3000"
  ARG VITE_MAX_RETRIES="3"
 
  RUN echo "VITE_TATOR_HOST=${VITE_TATOR_HOST}"
  RUN echo "VITE_TATOR_TOKEN=${VITE_TATOR_TOKEN}"
  RUN echo "VITE_BOX_TYPE=${VITE_BOX_TYPE}"
  RUN echo "VITE_PROJECT_ID=${VITE_PROJECT_ID}"
  RUN echo "VITE_API_TIMEOUT=${VITE_API_TIMEOUT}"
  RUN echo "VITE_MAX_RETRIES=${VITE_MAX_RETRIES}"

  ENV VITE_TATOR_HOST=${VITE_TATOR_HOST}
  ENV VITE_TATOR_TOKEN=${VITE_TATOR_TOKEN}
  ENV VITE_BOX_TYPE=${VITE_BOX_TYPE}
  ENV VITE_PROJECT_ID=${VITE_PROJECT_ID}
  ENV VITE_API_TIMEOUT=${VITE_API_TIMEOUT}
  ENV VITE_MAX_RETRIES=${VITE_MAX_RETRIES}

  RUN npm run build
  
  # ---- Serve stage ----
  FROM nginx:alpine
  
  # Copy built files to Nginx web root
  COPY --from=build /app/dist /usr/share/nginx/html
  
  # Copy custom nginx configuration
  # COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
  
  EXPOSE 80
  CMD ["nginx", "-g", "daemon off;"]
  