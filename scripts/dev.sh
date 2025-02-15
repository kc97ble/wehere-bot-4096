#!/bin/bash

while [ ! -f "yarn.lock" ]; do cd ..; done

commands=(
    "yarn workspace wehere-bot dev:bot"
    "PORT=4096 yarn workspace wehere-backend dev"
    "PORT=4098 yarn workspace wehere-frontend dev"
)

concurrently "${commands[@]}"
