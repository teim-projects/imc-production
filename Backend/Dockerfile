FROM python:3.11-slim


# Environment settings

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1


# Working directory

WORKDIR /app


# System dependencies (MySQL + build tools)

RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*


# Python dependencies

COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt


# Project source

COPY . .
