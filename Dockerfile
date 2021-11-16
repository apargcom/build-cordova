ARG NODE_VERSION DEBIAN_VERSION
FROM node:${NODE_VERSION}-${DEBIAN_VERSION}-slim as base

ARG ANDROID_API_LEVEL GRADLE_VERSION JDK_VERSION

RUN apt-get update && \
    apt-get -y install wget && \
    apt-get -y install unzip

RUN apt-get -y install openjdk-${JDK_VERSION}-jdk

RUN npm install -g cordova

WORKDIR /usr/lib/android
RUN wget -O cmdtools.zip https://dl.google.com/android/repository/commandlinetools-linux-7583922_latest.zip && \
    unzip cmdtools.zip -d . && \
    rm cmdtools.zip && \
    mv cmdline-tools tools && \
    yes | ./tools/bin/sdkmanager --licenses --sdk_root="/usr/lib/android" && \
    ./tools/bin/sdkmanager "platform-tools" "platforms;android-${ANDROID_API_LEVEL}" --sdk_root="/usr/lib/android"
ENV ANDROID_SDK_ROOT=/usr/lib/android \
    ANDROID_HOME=/usr/lib/android/platforms/android-${ANDROID_API_LEVEL} \
    PATH=${PATH}:/usr/lib/android/tools:/usr/lib/android/platform-tools

RUN wget -O gradle.zip https://services.gradle.org/distributions/gradle-6.1.1-bin.zip && \
    unzip gradle.zip -d . && \
    rm gradle.zip
ENV GRADLE_HOME=/usr/lib/android/gradle-${GRADLE_VERSION} \
    PATH=${PATH}:/usr/lib/android/gradle-${GRADLE_VERSION}/bin

WORKDIR /usr/src/cordova
#TODO: Work on build process
CMD read pause
    #cordova platform add android --no-telemetry && \
    #cordova build --no-telemetry && \
    #cp -a ./PATH_TO_BUILD_FOLDER/. /usr/src/cordova/build/

    


