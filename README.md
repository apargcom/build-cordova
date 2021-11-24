# Build Cordova app 
### Create .env file
```
$ cp .env.example .env
```
### Create build.json file in *src* folder
```
$ cp src/build.json.example src/build.json
```
Add keystore path and credentials in *build.json*.
### Run docker containers
```
$ docker compose up
```