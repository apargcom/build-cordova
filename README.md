# Build Cordova app 
### Add keystore file
Add keystore file to */res/android*. Change keystore file name and add crdentials to *release-signing.properties* file. 
### Create .env file
```
cp .env.example .env
```
### Run docker containers
```
$ docker compose up
```