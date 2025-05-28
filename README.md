# ⚜️ Welcome, Traveller ⚜️
![img.png](img.png)
> The winds whispered thy coming, take thy seat you have a long and perilous road lies ahead of you. <br/>
> A mighty voyage awaits -> filled to the brim with long-forgotten wisdom, cursed bugs of ancient code and many sleepless nights beneath the pale moon <br/>
> Fortify thy spirit & behold _**The Manuscript**_:<br/>
> <div style="text-align: right;font-style: italic; font-weight: bold;">(c) Utopian Merlin 🧙‍♂️</div>

---

<h2 style="font-style: italic; font-weight: bold;"> ⚜️The Manuscript⚜️ </h2>

### ENVIRONMENT
1. All required environment variables are defined in the `backend/env/env.example`. Please remove the `.example` extension and provide the values for env variables
2. For the correct work of the Google SSO please place the `google_oauth_client.json` file in the `backend/env` directory
3. Place HTTPS certificate under name `cert.pem` in the `backend/env`
4. Place HTTPS key under name `key.pem` in the `backend/env`
5. Go to `frontend` and run `npm install`
6. Go to `backend` and run `pip install -r requirements.txt`
7. Go to `Neeko` and run `pip install -r requirements.txt`
### Running services
#### Running frontend
```shell
cd frontend
```
```shell
npm install
```
```shell
npm run dev
```
```shell
Go to the provided endpoint
```
#### Running backend
1. Run postgreSQL database `AIPersonas` on port `5432` with user `ai_dev` and password `password`
2. Run `main.py`
> NB! To run the DB in Docker execute:
```shell
docker run --name my-postgres -e POSTGRES_USER=ai_dev -e POSTGRES_PASSWORD=password -e POSTGRES_DB=AIPersonas -p 5432:5432 -d postgres
```
#### Train personas
How to train personas is defined in another grimoire of Elders `Neeko/Manual_train_model.ipynb`
---
## Manual for SonarQube scanning
1. Running SonarQube Server: `docker-compose up` (add `-d` flag for background run)
2. Open `http://localhost:9000` login with default username `admin` and password `admin` and change to your own password
3. Under section **Security** generate the API token and paste in the sonar-project.properties file
4. Run the SonarQube scanner on the project:
```bash
# Run the scanner which will exit after finish
docker run --rm -v "${pwd}:/usr/src" sonarsource/sonar-scanner-cli
```
5. After scan is complete open the `http://localhost:9000`, login, Go to Projects to see the result
6. To turn off the SonarQube server run `docker compose down`
---
## MANUAL FOR USING JMETER
JMeter has 2 modes _GUI_ and _NON-GUI_. _GUI_ mode is good for debugging and creating the test scenario (a.k.a `jmx` file). When the test scenario - `.jmx` file is created it can and will be used for running the test scenario.
> NB! _GUI_ mode allows for adding plots while debugging BUT those plots significantly slow the test process down. So please do not forget to remove them. Default reporting mechanism is enough and does not require from you setting up reporting things yourself
#### OVERALL FLOW
0Unzip somewhere archive with JMeter
1. Navigate to `JMeter/bin` folder
2. Run GUI mode (either `./jmeter` on linux or `jmeter.bat` on windows)
   1. Add a Thread Group:
      1. Right-click Test Plan > Add > Threads (Users) > Thread Group 
      2. Set number of users (threads), loop count, etc. 
   2. Add a Sampler (what to test):
      1. E.g., HTTP Request: Add > Sampler > HTTP Request 
      2. Enter server name, port, endpoint (e.g., /api/login)

   3. Add a Listener (to view results): (remove before saving `jmx` file)
      1. Add > Listener > View Results Tree or Summary Report 
   4. Run the test (Click the green ▶️ button) (for debugging purpose)
   5. Save the `jmx` file at (`AIPersonas/JMeter/scenarios/<tested-module>.<version>.jmx`)
4. Run the CLI mode
```shell
./jmeter -n -t ./scenarios/<tested-module>.<version>.jmx -l results.jtl -e -o report/
```
The generated report will be under `report` path in the HTML format
#### USEFUL TIPS
1. Remove the listener from GUI mode before saving the JMX file
   2. 🧪 Use Cases <br/>
   Test Type	What to Do <br/>
   ✅ HTTP API	Use HTTP Request sampler; test REST APIs, login, data fetch, etc. <br/>
   ✅ Web App (frontend)	Simulate user interactions with multiple HTTP requests <br/>
   ✅ Database	Use JDBC Request to run queries, simulate DB load <br/>
   ✅ File Upload/Download	Test endpoints with files (e.g., via multipart/form-data) <br/>
3. Use CSV Data Set Config to pass test data (e.g., usernames, tokens). 
4. Use Assertions to validate response data (e.g., check status code, body content). 
5. Use Timers to simulate think-time between requests. 
6. For load testing, slowly increase threads to identify the breaking point (spike/stress testing). 
7. You can define the whole user flow by testing multiple endpoints at ones
8. You can define the endpoint to run only ones (for example for retrieving the auth token)