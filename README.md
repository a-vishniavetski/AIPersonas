## ⚜️ AIPersonas ⚜️

<img src="img.png" align="right" height="250"></img>

> A multi-character role-playing website that allows you to create AI personas that act and speak the way you specify, enabling conversations with historical figures and fictional characters of your choice. <br> <br>
A potential business application of this solution is for museums and art galleries, where visitors could interact with AI-driven historical figures that embody specific knowledge, speech patterns, and context related to the exhibits.

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

## Navigation

- [Overview](#Overview)
- [Technologies used](#technologies-used)
- [Configuration and Deployment](#Configuration-and-Deployment)
- [License](#license)

## Overview
Create AI personas that act and speak the way you specify.

### Customization
Customize.

- **Generate custom profile picture with AI**: Or choose a local one.
<img align="center" width="768" height="432" alt="profile" src="https://github.com/user-attachments/assets/984618a0-0f1f-4603-9087-07e019ef8b7e" />

### Chatting
- **Create custom personas**: Using your own description that will be used to train the AI model.
- **Talk to them: Speech-to-Text with Whisper**: Press a button and talk instead of typing your messages.
- **Export your conversation as PDF**: todo.readme
<br>
<img align="center" width="768" height="432" alt="chat" src="https://github.com/user-attachments/assets/fec985df-bce2-4ecf-8d60-7e5a65294b62" />

## Technologies used
We achieved this using 𝗟𝗼𝗥𝗔𝘀 on top of an 𝗟𝗟𝗠, with the 𝗡𝗲𝗲𝗸𝗼 framework for the AI layer, and 𝗙𝗮𝘀𝘁𝗔𝗣𝗜 and 𝗥𝗲𝗮𝗰𝘁𝗝𝗦 for the backend and frontend, respectively. 
We've added 𝗪𝗵𝗶𝘀𝗽𝗲𝗿 for STT and connected Pollinations.AI image generation API for the persona avatars.

One improvement we’re considering is integrating an 𝗥𝗔𝗚 system to inject relevant knowledge, which would be particularly useful in cases like the museum example above.

<!-- 
## Configuration and Deployment

#### Steps
1. All required environment variables are defined in the `backend/env/env.example`. Please remove the `.example` extension and provide the values for env variables
2. For the correct work of the Google SSO please place the `google_oauth_client.json` file in the `backend/env` directory
3. Place HTTPS certificate under name `cert.pem` in the `backend/env`
4. Place HTTPS key under name `key.pem` in the `backend/env`
5. Go to `frontend` and run `npm install`
6. Go to `backend` and run `pip install -r requirements.txt`
7. Go to `Neeko` and run `pip install -r requirements.txt`

#### Running services
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
How to train personas is defined in another grimoire of Elders `Neeko/Manual_train_model.ipynb` --> 

## License
The code is Apache_2.0 licensed.
