FROM node:18-bullseye-slim

# Set labels for better maintainability
LABEL maintainer="Your Team <team@example.com>"
LABEL description="Playwright Test Automation Framework"
LABEL version="1.0.0"

# Install system dependencies required for Playwright
RUN apt-get update && apt-get install -y \
    # Core dependencies for Playwright browsers
    libnss3 \
    libnspr4 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libxss1 \
    libasound2 \
    libatspi2.0-0 \
    libgtk-3-0 \
    libgdk-pixbuf2.0-0 \
    # Additional utilities
    wget \
    unzip \
    curl \
    git \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    lsb-release \
    xdg-utils \
    # Cleanup
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create a non-root user for security
RUN groupadd -r pwuser && useradd -r -g pwuser -G audio,video pwuser \
    && mkdir -p /home/pwuser/Downloads \
    && chown -R pwuser:pwuser /home/pwuser

# Set working directory
WORKDIR /app

# Copy package files first for better Docker layer caching
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production --no-audit --prefer-offline \
    && npm cache clean --force

# Install Playwright and browsers
RUN npx playwright install --with-deps chromium firefox webkit \
    && npx playwright install-deps

# Copy application files
COPY . .

# Set proper ownership
RUN chown -R pwuser:pwuser /app

# Switch to non-root user
USER pwuser

# Set environment variables
ENV NODE_ENV=test
ENV CI=true
ENV PLAYWRIGHT_BROWSERS_PATH=/home/pwuser/.cache/ms-playwright

# Create directories for test artifacts
RUN mkdir -p test-results/allure-results test-results/screenshots test-results/videos playwright-report

# Health check to ensure the container is ready
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD npx playwright --version || exit 1

# Default command - can be overridden
CMD ["npx", "playwright", "test", "--reporter=html,junit,allure-playwright"]