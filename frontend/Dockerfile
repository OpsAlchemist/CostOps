FROM node:18

WORKDIR /app

# Copy package.json first for better layer caching
COPY package.json .
RUN npm install

# Copy all files including the new layout.tsx
COPY . .

RUN npm run build

CMD ["npm", "start"]