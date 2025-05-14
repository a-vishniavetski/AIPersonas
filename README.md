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