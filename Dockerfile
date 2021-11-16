FROM node:14.18-stretch-slim as base

WORKDIR /usr/src/cordova

RUN apt-get update && \
    apt-get -y install openjdk-8-jdk

RUN cd /usr/lib && \
    apt-get -y install wget && \
    apt-get -y install unzip && \
    wget -O cmdtools.zip https://dl.google.com/android/repository/commandlinetools-linux-7583922_latest.zip && \
    mkdir android && \
    unzip cmdtools.zip -d /usr/lib/android && \
    mv android/cmdline-tools android/tools && \
    rm cmdtools.zip && \
    cd  android/tools/bin && \
    yes | ./sdkmanager --licenses --sdk_root="/usr/lib/android" && \
    ./sdkmanager "platform-tools" "platforms;android-29" --sdk_root="/usr/lib/android" && \
    export ANDROID_SDK_ROOT="/usr/lib/android" && \
    export ANDROID_HOME="/usr/lib/android/platforms/android-29" && \
    export PATH=${PATH}:/usr/lib/android/tools:/usr/lib/android/platform-tools

RUN  cd /usr/lib/android && \
    wget -O gradle.zip https://services.gradle.org/distributions/gradle-6.5-bin.zip && \
    unzip gradle.zip -d /usr/lib/android && \
    rm gradle.zip && \
    export GRADLE_HOME=/usr/lib/android/gradle-6.5 && \
    export PATH=${GRADLE_HOME}/bin:${PATH}

RUN cd /usr/src/cordova && \
    npm install -g cordova

CMD cd src && \
    cordova platform add android && \
    cordova build && \
    read pause


