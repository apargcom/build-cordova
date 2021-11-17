ARG NODE_VERSION DEBIAN_VERSION
FROM node:${NODE_VERSION}-${DEBIAN_VERSION}-slim as base

ARG ANDROID_API_LEVEL GRADLE_VERSION JDK_VERSION

RUN apt-get update && \
    apt-get -y install git && \
    apt-get -y install wget && \
    apt-get -y install unzip

RUN apt-get -y install openjdk-${JDK_VERSION}-jdk

RUN npm install -g cordova

WORKDIR /usr/lib/android
RUN wget -O cmdtools.zip https://dl.google.com/android/repository/commandlinetools-linux-7583922_latest.zip && \
    unzip cmdtools.zip -d . && \
    rm cmdtools.zip && \
    #mv cmdline-tools tools && \
    yes | ./tools/bin/sdkmanager --licenses --sdk_root="/usr/lib/android" && \
    ./tools/bin/sdkmanager "build-tools;30.0.2" "platform-tools" "platforms;android-${ANDROID_API_LEVEL}" --sdk_root="/usr/lib/android"
ENV ANDROID_SDK_ROOT=/usr/lib/android \
    ANDROID_HOME=/usr/lib/android/platforms/android-${ANDROID_API_LEVEL} \
    PATH=${PATH}:/usr/lib/android/tools:/usr/lib/android/platform-tools:/usr/lib/android/cmdline-tools

RUN wget -O gradle.zip https://services.gradle.org/distributions/gradle-${GRADLE_VERSION}-all.zip && \
    unzip gradle.zip -d . && \
    rm gradle.zip
ENV GRADLE_HOME=/usr/lib/android/gradle-${GRADLE_VERSION} \
    PATH=${PATH}:/usr/lib/android/gradle-${GRADLE_VERSION}/bin

WORKDIR /usr/src/cordova
#TODO: Work on build process
CMD ${ALWAYS_RUN} && read PAUSE && \
    cordova telemetry off
    #cordova platform add android ; \
    #cordova build --no-telemetry
    

    


