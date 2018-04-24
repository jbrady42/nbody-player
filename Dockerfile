FROM node:8.9-alpine

WORKDIR /app

COPY package.json package-lock.json /app/
RUN npm i

COPY .  /app
RUN npm run build


FROM ubuntu:16.04

RUN apt update && \
    apt install -y \
    curl \
    nginx

RUN curl -sLo /usr/bin/ep \
    https://github.com/kreuzwerker/envplate/releases/download/1.0.0-RC1/ep-linux && \
    chmod +x /usr/bin/ep

RUN mkdir /app

COPY --from=0 /app/pages/ /app/

COPY conf/nginx.conf /etc/nginx/
COPY conf/default.conf /etc/nginx/sites-available/default
COPY conf/start.sh /usr/bin/

# CMD [ "/usr/bin/ep", "-v", "/etc/nginx/sites-available/default", "--", "/usr/sbin/nginx"]
CMD ["/usr/bin/start.sh"]
