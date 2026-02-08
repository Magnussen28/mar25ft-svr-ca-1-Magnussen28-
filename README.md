# Curse assigniment server dev.
 This is a app built with Node.js, Express, render an MySQL hosted on Aiven.

## Hosted Application
https://mar25ft-svr-ca-1-magnussen28.onrender.com
https://github.com/Magnussen28/mar25ft-svr-ca-1-Magnussen28-

## authentication
The api is protected using Basic Auth. You need to use these credentials in Postman to access the endpoints:

* **Username:** `admin`
* **Password:** `P4ssword`

---

## How to start/run

Clone my project:
https://github.com/Magnussen28/mar25ft-svr-ca-1-Magnussen28-

Install dependencies:

Bash
npm install
Setup up ur own variables: Create a .env file

PORT=3000
DB_HOST=your-database-host.aivencloud.com
DB_USER=avnadmin
DB_PASSWORD=your-password
DB_NAME=defaultdb
DB_PORT=21496

Start the server:

Bash
node index.js
The database tables will be created automatically when the server starts.

Course api Endpoints

GET /participants - List all participants.

POST /participants/add - Add a new participant (requires JSON body).

DELETE /participants/:email - Delete a participant by email.

PUT /participants/:email - Update participant details.

GET /participants/details - View only names and emails.

GET /participants/details/:email - View details for a specific person.

GET /participants/work/:email - View work details only.

GET /participants/home/:email - View home location details only.

Testing with Postman
I used basic Auth as the course assigment asked, so make sure you use that in postman.