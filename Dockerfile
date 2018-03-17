FROM node:8-alpine
EXPOSE 3021
WORKDIR /home/node
USER node:node
COPY --chown=node:node . .
ENV NPM_CONFIG_LOGLEVEL=info PORT=3021 NODE_ENV=production
RUN yarn install && yarn build
CMD npx serve -s build -p $PORT
