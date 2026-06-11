# Stage 1: Build the Angular application
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:1.27-alpine
# Remove default nginx config and add our SPA-aware config
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Angular 18 (application builder) outputs to dist/<project>/browser
COPY --from=build /app/dist/coco-frontend/browser /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
