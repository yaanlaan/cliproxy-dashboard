# Production Nginx image serving pre-built web assets
FROM nginx:alpine

# Copy nginx config template (nginx official image automatically replaces env vars into /etc/nginx/conf.d/)
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Copy built frontend assets and grant read permissions to nginx user
COPY dist /usr/share/nginx/html
RUN chmod -R 755 /usr/share/nginx/html

# Default backend host and port inside docker network
ENV BACKEND_HOST=cli-proxy-api
ENV BACKEND_PORT=8317

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
