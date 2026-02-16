# ── Spring Boot API ──────────────────────────────
# Multi-stage build: Maven + JRE 21 slim
FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /build
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -DskipTests -B

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy artifact
COPY --from=build /build/target/*.jar app.jar

# Generate dev RSA keys for JWT (production uses Secrets Manager)
RUN mkdir -p /app/keys && \
    apk add --no-cache openssl curl && \
    openssl genpkey -algorithm RSA -out /app/keys/private.pem -pkeyopt rsa_keygen_bits:2048 && \
    openssl rsa -pubout -in /app/keys/private.pem -out /app/keys/public.pem && \
    chown -R appuser:appgroup /app

USER appuser

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
