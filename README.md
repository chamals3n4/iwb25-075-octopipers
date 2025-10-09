
---

# NomadPage

NomadPage is a platform designed to support digital nomads who plan to live and work from Sri Lanka. Our goal is to create a centralized hub for all the resources nomads need.

## Tech Stack

**Frontend:** Next.js 15, Tailwind CSS, Shadcn/ui  
**Backend:** Ballerina, PostgreSQL, AWS S3  
**Additional Services:** Flask, BeautifulSoup4 (for news scraping)

## Prerequisites

Before you start, make sure you have installed:

- [Node.js v20+ and npm](https://nodejs.org/)
- [Ballerina](https://ballerina.io/downloads/)
- [Python](https://www.python.org/downloads/)
- [PostgreSQL](https://www.postgresql.org/) (or [Supabase](https://supabase.com/) for easier setup)
- [Asgardeo Account](https://wso2.com/asgardeo/) (for authentication)
- [AWS Account](https://aws.amazon.com/) (for S3 file storage)

## Setup Process

### 1. Clone the Repository

```bash
git clone https://github.com/<username>/iwb25-075-octopipers.git
cd iwb25-075-octopipers
```

---

### 2. Backend Setup (Ballerina Service)

#### 2.1 Configure PostgreSQL

1. Create a new PostgreSQL database (or Supabase project).
2. Run the schema file to create tables:

```sql
service/resources/schema.sql
```

#### 2.2 Configure External Services

- **AWS S3** → Create a bucket, IAM user, and note down credentials.
- **Perplexity API** → Get your API key from perplexity.ai.
- **OpenWeather API** → Get your API key from openweathermap.org.

#### 2.3 Create `Config.toml`

In the `service/` root directory:

```toml
[service.utils]
dbHost = "database-host"
dbUser = "database-username"
dbPassword = "database-password"
dbPort = 5432
dbName = "database-name"
accessKeyId = "aws-access-key"
secretAccessKey = "aws-secret-key"
region = "aws-region"
bucketName = "s3-bucket-name"

[service.city_guide]
perplexityApiKey = "perplexity-api-key"

[service.tools]
openWeatherApi = "openweathermap-api-key"
```

#### 2.4 Run Backend

```bash
cd service
bal run
```

Backend available at: `http://localhost:8080`

---

### 3. Frontend Setup (Next.js)

#### 3.1 Install Dependencies

```bash
cd webapp
npm install
```

#### 3.2 Configure Asgardeo Authentication

1. Create a new app in Asgardeo Console.
2. Collect:
   - Client ID
   - Client Secret
   - Organization Name
   - Application Name
3. Create a `.env.local` file in `webapp/`:

```env
AUTH_SECRET=your-secret-key

ASGARDEO_CLIENT_ID=your-client-id
ASGARDEO_CLIENT_SECRET=your-client-secret
AUTH_ASGARDEO_ISSUER="https://api.asgardeo.io/t/<org-name>/oauth2/token"

NEXT_PUBLIC_AUTH_ASGARDEO_LOGOUT_URL="https://api.asgardeo.io/t/<org-name>/oidc/logout"
NEXT_PUBLIC_AUTH_ASGARDEO_POST_LOGOUT_REDIRECT_URL="http://localhost:3000/auth/sign-out"
```

4. **Configure Backend Authentication**
   Update the JWT validator configuration in `service.bal`:

```ballerina
auth: [
    {
        jwtValidatorConfig: {
            issuer: "https://api.asgardeo.io/t/<org-name>/oauth2/token",
            audience: ["your-client-id"],
            signatureConfig: {
                jwksConfig: {
                    url: "https://api.asgardeo.io/t/<org-name>/oauth2/jwks"
                }
            }
        }
    }
]
```

#### 3.3 Run Frontend

```bash
npm run dev
```

Frontend available at: `http://localhost:3000`

---

### 4. News Scraper Setup (Flask + BeautifulSoup4)

This service scrapes latest news from newswire.lk and provides live updates.

```bash
cd newswired
python -m venv venv
# On Windows
venv\Scripts\activate
# On macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
python app.py
```

News scraper runs at: `http://localhost:5000/latest-news`

---

## Running the Application

- **Backend (Ballerina):** `http://localhost:8080`
- **Frontend (Next.js):** `http://localhost:3000`
- **News Scraper (Flask):** `http://localhost:5000/latest-news`
- **WebSocket Services:** `ws://localhost:9091` (incidents), `ws://localhost:9090` (chat)

## Features

- **City Rank** - Rankings and insights for Sri Lankan cities
- **Incident Report Map** - Report and view local incidents
- **Meetups** - Connect with local groups and communities
- **Find Remote Jobs** - Search and apply for online opportunities
- **Co-working Places** - Discover work-friendly spaces
- **Utility Tools** - Currency conversion, time zones, weather, and latest news


- **HTTP** - RESTful API endpoints with resource functions
- **WebSocket** - Real-time bidirectional communication for chat , meetups and incidents
- **PostgreSQL Connector** - Database connectivity with connection pooling
- **AWS S3 Connector** - Cloud storage integration for file uploads
- **JWT Authentication** - Service-level JWT validation with WSO2 Asgardeo OIDC
- **External HTTP Client** - Integration with weather, currency, and AI APIs
- **Modular Architecture** - Organized service modules with proper separation of concerns
