FROM node:21-alpine3.18
WORKDIR /app
ENV PORT 3232
COPY package.json /app
RUN npm install
COPY package-* /app
COPY . /app
CMD ["npm","run", "dev"]