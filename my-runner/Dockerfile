FROM ubuntu:22.04

# Don't ask for user input during install
ENV DEBIAN_FRONTEND=noninteractive

# Install the basics
RUN apt-get update && apt-get install -y \
    curl git jq sudo unzip ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Create a safe non-root user called "runner"
RUN useradd -m -s /bin/bash runner \
    && echo "runner ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Download the GitHub Actions runner app
ENV RUNNER_VERSION=2.316.1
WORKDIR /home/runner

# Use the ARM64 runner build on Apple Silicon hosts to avoid QEMU emulation errors
RUN curl -o runner.tar.gz -L \
    "https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-arm64-${RUNNER_VERSION}.tar.gz" \
    && tar xzf runner.tar.gz \
    && rm runner.tar.gz \
    && ./bin/installdependencies.sh

# Copy our startup script into the container
COPY start.sh /home/runner/start.sh
RUN chmod +x /home/runner/start.sh \
    && chown -R runner:runner /home/runner

# Switch to non-root user for security
USER runner

# When the container starts, run start.sh
ENTRYPOINT ["/home/runner/start.sh"]
