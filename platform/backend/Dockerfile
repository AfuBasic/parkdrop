# syntax=docker/dockerfile:1
#
# Production image for the ParkDrop backend. This is NOT the image used in
# local development (see platform/compose.dev.yaml, which builds Sail's
# Ubuntu-based dev runtime from vendor/laravel/sail instead) — that image
# bundles Xdebug, Node, Playwright, etc. and bind-mounts source from the
# host, none of which belongs in production. This one bakes the app in.
#
# Same image is reused for every backend process (web, horizon, reverb,
# scheduler) — platform/compose.prod.yaml just overrides `command:` per
# service, exactly like the dev compose file does with the Sail image.

ARG PHP_VERSION=8.3

FROM php:${PHP_VERSION}-cli-alpine AS base

RUN apk add --no-cache \
        bash \
        curl \
        git \
        icu-libs \
        libzip \
        libpng \
        libjpeg-turbo \
        freetype \
        oniguruma \
        libxml2 \
        imagemagick \
    && apk add --no-cache --virtual .build-deps \
        $PHPIZE_DEPS \
        icu-dev \
        libzip-dev \
        libpng-dev \
        libjpeg-turbo-dev \
        freetype-dev \
        oniguruma-dev \
        libxml2-dev \
        imagemagick-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" \
        pdo_mysql \
        bcmath \
        intl \
        zip \
        gd \
        exif \
        soap \
        opcache \
    && pecl install redis imagick \
    && docker-php-ext-enable redis imagick \
    && apk del .build-deps \
    && rm -rf /var/cache/apk/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# --- Dependencies + app code -------------------------------------------------
FROM base AS build

COPY composer.json composer.lock ./
RUN composer install \
        --no-dev \
        --no-scripts \
        --no-autoloader \
        --prefer-dist \
        --no-interaction

COPY . .

# --no-scripts above skipped artisan-dependent post-install hooks (like
# package:discover) since there's no .env / APP_KEY at build time yet —
# just regenerate the autoloader now; config/route/view caching happens in
# the entrypoint at container start, once real env vars are present.
RUN composer dump-autoload --optimize --no-dev --classmap-authoritative

# --- Runtime ------------------------------------------------------------------
FROM base AS runtime

ENV APP_ENV=production \
    PHP_OPCACHE_ENABLE=1 \
    PHP_OPCACHE_VALIDATE_TIMESTAMPS=0

RUN { \
        echo 'opcache.enable=${PHP_OPCACHE_ENABLE}'; \
        echo 'opcache.validate_timestamps=${PHP_OPCACHE_VALIDATE_TIMESTAMPS}'; \
        echo 'opcache.memory_consumption=192'; \
        echo 'opcache.interned_strings_buffer=16'; \
        echo 'opcache.max_accelerated_files=20000'; \
    } > /usr/local/etc/php/conf.d/opcache-recommended.ini

COPY --from=build --chown=www-data:www-data /var/www/html /var/www/html

COPY --chown=www-data:www-data docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh \
    && chown -R www-data:www-data storage bootstrap/cache

USER www-data

EXPOSE 80

ENTRYPOINT ["entrypoint.sh"]
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=80"]
