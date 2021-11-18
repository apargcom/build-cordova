# Build Cordova app 
### Add keystore file
Add keystore file to */res/android*. Create *release-signing.properties* file write keystore file name and add crdentials.
### Create .env file
```
$ cp .env.example .env
```
### Run docker containers
```
$ docker compose up
```