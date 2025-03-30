# Book Explorer

Book Explorer is a web application that allows users to discover and explore books by leveraging powerful APIs. Built with a Node.js backend using Express, this project fetches book-related data and presents it in an accessible format.

## Loom Video Presentation:
 " https://vimeo.com/1070706390/753df47dfc?share=copy "
(Note: Set playback speed to 1x  and in HD qualityfor the best viewing experience.)

**Website Link**: [https://www.pitchou.tech](https://www.pitchou.tech)

## Setup

This README outlines the steps to run the app locally, deploy it across two servers with a load balancer, and discusses challenges encountered during development. It also provides details on the APIs used.

1. [Run it Locally](#a-run-it-locally)  
2. [Deployment Process on Two Servers and a Load Balancer](#b-servers-deployment-process)  
3. [Challenges Encountered During Development](#c-challenges)  

---

## A. Run it Locally

### 1. Cloning

Clone the repository to your machine:

```
git clone https://github.com/Umurerwa3/Playing_With_Api.git
```

### 2. Change Directory

Navigate into the project directory:

```
cd Playing_With_Api
```

### 3. Add the Gemini API Key

Visit [https://ai.google.dev/api?lang=node](https://ai.google.dev/api?lang=node) to obtain a Gemini API key. Add it to a `.env` file in the project root:

```
echo 'GEMINI_APIKEY=your_api_key' > .env
```

### 4. Run the App

Launch the app from the main directory:

```
node server.js
```

That’s it—your local instance should now be running!

---

## B. Servers Deployment Process

This section details deploying the app on two web servers (web-01 and web-02) with a load balancer (lb-01). Steps are explained below.

### 1. Web 01 and Web 02

#### a. Update Everything and Install Node.js and npm

From the home directory, update the system and install Node.js (version 20) and npm:

```
cd ~
sudo apt update && sudo apt upgrade
curl -sL https://deb.nodesource.com/setup_18.x -o nodesource_setup.sh
sudo bash nodesource_setup.sh
sudo apt-get install nodejs
sudo apt-get install build-essential
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
source ~/.bashrc
nvm install 20
nvm use 20
```

#### b. Set the Repository

Clone the repository and install dependencies:

```
git clone https://github.com/Umurerwa3/Playing_With_Api.git
cd Playing_With_Api
npm i
```

#### c. API Key

Add your Gemini API key to a `.env` file (excluded from git for security):

```
echo 'GEMINI_APIKEY=your_api_key' > .env
```

#### d. Set PM2

Install PM2 globally and start the app in the background:

```
sudo npm install -g pm2
pm2 start server.js
```

#### e. Set NGINX

Install NGINX and configure it to proxy requests from port 80 to the app on port 3000:

```
sudo apt install nginx
new_config="server {
    listen 80 default_server;
    listen [::]:80 default_server;
    root /var/www/html;
    index index.html index.htm index.nginx-debian.html;
    server_name _;
    add_header X-Served-By \$hostname;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
    if (\$request_filename ~ redirect_me) {
        rewrite ^ https://th3-gr00t.tk/ permanent;
    }
    error_page 404 /error_404.html;
    location = /error_404.html {
        internal;
    }
}"
sudo chown -R ubuntu:ubuntu /etc/nginx/sites-available/default
echo "$new_config" > /etc/nginx/sites-available/default
```

#### f. Restart NGINX

Restart NGINX to apply changes:

```
sudo service nginx restart
```

### 2. Load Balancer (lb-01)

Configure HAProxy to balance traffic between web-01 and web-02 using round-robin.

#### a. Install HAProxy

```
sudo apt install haproxy
```

#### b. Configure HAProxy

Set up the HAProxy configuration (update server IPs as needed):

```
new_config="
defaults
  mode http
  timeout client 15s
  timeout connect 10s
  timeout server 15s
  timeout http-request 10s

frontend clickviral-tech-frontend
    bind *:80
    default_backend clickviral-tech-backend

backend clickviral-tech-backend
    balance roundrobin
    server 6329-web-01 54.167.52.204:80 check
    server 6329-web-02 34.228.244.169:80 check
"
sudo chown -R ubuntu:ubuntu /etc/haproxy/haproxy.cfg
echo "$new_config" > /etc/haproxy/haproxy.cfg
```

#### c. Restart HAProxy

Restart HAProxy to activate the configuration:

```
sudo service haproxy restart
```

---

## C. Challenges

Developing and deploying Book Explorer came with obstacles, largely due to its backend component. Here are the main challenges:

### 1. Securing My API Key

Unfamiliar with `.gitignore` and `.env` files initially, I researched environment variables and found the `dotenv` library to securely manage the Gemini API key in Node.js.

### 2. Deploying an App with a Backend

Deploying an Express app was tricky. I briefly tried a frontend-only approach with `fetch`, but struggled with `.env` integration. Returning to the backend, I discovered PM2, which streamlined the process.

### 3. Forwarding NGINX to PM2

Initially, the app ran without a server handler, raising security concerns. I adapted a StackOverflow script to configure NGINX as a reverse proxy, linking it to the PM2-managed app.

---

## D. Credits

Book Explorer harnesses two APIs to deliver its functionality:

- **Gemini AI Text Generator API**: Generates book descriptions. Access it at [https://ai.google.dev/api?lang=node](https://ai.google.dev/api?lang=node).  
- **Open Library API**: Provides book data, no API key required. Visit [https://openlibrary.org](https://openlibrary.org).  

As of March 28, 2025, this project stands as a testament to overcoming technical hurdles and integrating modern tools like PM2, NGINX, and HAProxy. It’s a practical example of building and scaling a backend-driven web app—hopefully inspiring others to explore and create!

---

### Key Changes:
1. **Consistency**: Corrected minor discrepancies (e.g., `GEMINI` vs. `GEMINI_APIKEY`, file paths for HAProxy config).
2. **Clarity**: Simplified commands (e.g., removed unnecessary `sudo` where not required) and improved readability.
3. **Conclusion**: Rewrote the "Notes" in the Credits section to reflect the project’s purpose and current status, avoiding references to unrelated APIs (e.g., Country Info API) and tying it to the Book Explorer theme.

Let me know if you’d like further tweaks!