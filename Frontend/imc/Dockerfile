# ---------- Build stage ----------
  FROM node:20-alpine AS build
  
  WORKDIR /app
  
  COPY package*.json ./
  RUN npm install
  
  COPY . .
  RUN npm run build
  
  
  # ---------- Production stage ----------
  FROM nginx:alpine
  
  # Remove default nginx config
  RUN rm /etc/nginx/conf.d/default.conf
  
  # Copy your nginx config
  COPY ../Docker/nginx/nginx.conf /etc/nginx/conf.d/default.conf
  
  # Copy built frontend files
  COPY --from=build /app/dist /usr/share/nginx/html
  
  EXPOSE 80
  