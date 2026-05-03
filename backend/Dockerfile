FROM composer:2

RUN apk add --no-cache $PHPIZE_DEPS postgresql-dev \
    && docker-php-ext-install pdo_pgsql \
    && apk del $PHPIZE_DEPS

WORKDIR /app

EXPOSE 8000
