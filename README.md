# Server CA 1 - Participants API

built with Node.js, Express, and MySQL.

##  How to install & run 

Clone the repository
git clone [https://github.com/Magnussen28/mar25ft-svr-ca-1-Magnussen28-.git](https://github.com/Magnussen28/mar25ft-svr-ca-1-Magnussen28-.git)
2. Install dependencies
Bash
npm install
3. Configure Environment Variables
Create a file named .env in the root folder. Add your database credentials like this:

Plaintext
PORT=3000
DB_HOST=your-database-host.aivencloud.com
DB_USER=avnadmin
DB_PASSWORD=your-password
DB_NAME=defaultdb
DB_PORT=21496
4. Start the server
Bash
node index.js
The server will start at http://localhost:3000.