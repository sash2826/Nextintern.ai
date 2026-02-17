# Development Setup Guide for NextIntern.ai

This project requires **Java 21**, **Maven**, and **Docker** (for database, search, and cache). Follow this guide to set up your environment on Windows.

## 1. Install Java Development Kit (JDK 21)

1.  **Download**: [Oracle JDK 21](https://www.oracle.com/java/technologies/downloads/#jdk21-windows) or [Eclipse Temurin 21](https://adoptium.net/temurin/releases/?version=21).
2.  **Install**: Run the installer.
3.  **Set Environment Variable**:
    *   Search for "Environment Variables" in Windows.
    *   Under **System variables**, click **New**.
    *   **Variable name**: `JAVA_HOME`
    *   **Variable value**: Path to your JDK installation (e.g., `C:\Program Files\Java\jdk-21`).
    *   Click OK.
    *   Select `Path` variable -> **Edit** -> **New** -> `%JAVA_HOME%\bin` -> OK.

## 2. Install Apache Maven (Manually)

Since the `mvnw` wrapper is missing, install Maven globally:

1.  **Download**: [Apache Maven Binary zip](https://maven.apache.org/download.cgi) (e.g., `apache-maven-3.9.6-bin.zip`).
2.  **Extract**: Unzip to a folder like `C:\Program Files\Apache\maven`.
3.  **Set Environment Variable**:
    *   New System Variable: `MAVEN_HOME` -> Value: `C:\Program Files\Apache\maven`.
    *   Edit `Path` variable -> New -> `%MAVEN_HOME%\bin`.
4.  **Verify**: Open a new terminal and run `mvn -version`.

## 3. Install Docker Desktop

Required for PostgreSQL, Redis, and OpenSearch.

1.  **Download**: [Docker Desktop for Windows](https://www.dockerCan.com/products/docker-desktop/).
2.  **Install**: Run the installer (ensure WSL 2 components are selected).
3.  **Start**: Open Docker Desktop app and wait for the engine to start.
4.  **Verify**: Run `docker --version`.

## 4. Running the Application

### Step 1: Start Infrastructure
Open a terminal in the project root (`Nextintern.ai`) and run:
```powershell
docker-compose up -d
```
*This starts Postgres (db), Redis (cache), and OpenSearch (search engine).*

### Step 2: Run the API
Open a terminal in the `api` folder and run:
```powershell
mvn spring-boot:run
```
The API will start at `http://localhost:8080`.

## 5. Troubleshooting
*   **Port Conflicts**: Ensure ports 5432, 6379, 9200, and 8080 are free.
*   **"mvn not recognized"**: Restart your terminal after setting environment variables.
