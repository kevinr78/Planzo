FROM node:20-alpine AS builder
WORKDIR /app

# Define Build Arguments
ARG VITE_GOOGLE_MAPS_API_KEY
ARG VITE_STRIPE_PUBLISHABLE_KEY

# Set them as Environment Variables so Vite sees them
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY
ENV VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY
ENV NODE_OPTIONS="--max-old-space-size=1536"

# Build stage

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage — serve with nginx
FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
