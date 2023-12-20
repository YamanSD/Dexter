FROM gcc
ENV DEBIAN_FRONTEND noninteractive
RUN apt-get update && apt-get -y install gcc && rm -rf /var/lib/apt/lists/*
WORKDIR /