ARG NODE_VERSION DEBIAN_VERSION
FROM node:${NODE_VERSION}-${DEBIAN_VERSION}-slim as base

ARG ANDROID_API_LEVEL GRADLE_VERSION JDK_VERSION BUILD_TOOLS_VERSION

RUN apt-get update && \
    apt-get -y install git && \
    apt-get -y install wget && \
    apt-get -y install unzip

RUN npm install -g cordova

RUN apt-get -y install openjdk-${JDK_VERSION}-jdk
ENV JAVA_HOME=/usr/lib/jvm/java-${JDK_VERSION}-openjdk-amd64 \
    PATH=${PATH}:/usr/lib/jvm/java-${JDK_VERSION}-openjdk-amd64

WORKDIR /opt/gradle
RUN wget -O gradle.zip https://services.gradle.org/distributions/gradle-${GRADLE_VERSION}-all.zip && \
    unzip gradle.zip -d .
ENV GRADLE_HOME=/opt/gradle/gradle-${GRADLE_VERSION} \
    PATH=${PATH}:/opt/gradle/gradle-${GRADLE_VERSION}/bin \
    CORDOVA_ANDROID_GRADLE_DISTRIBUTION_URL=file:///opt/gradle/gradle.zip

WORKDIR /opt/android
RUN wget -O cmdtools.zip https://dl.google.com/android/repository/commandlinetools-linux-7583922_latest.zip && \
    unzip cmdtools.zip -d . && \
    rm cmdtools.zip && \
    yes | ./cmdline-tools/bin/sdkmanager --licenses --sdk_root="/opt/android" && \
    ./cmdline-tools/bin/sdkmanager "build-tools;${BUILD_TOOLS_VERSION}" "platform-tools" "platforms;android-${ANDROID_API_LEVEL}" "extras;google;google_play_services" --sdk_root="/opt/android"
ENV ANDROID_SDK_ROOT=/opt/android \
    ANDROID_HOME=/opt/android \
    PATH=${PATH}:/opt/android/tools:/opt/android/tools/bin:/opt/android/platform-tools:/opt/android/cmdline-tools:/opt/android:/opt/android/platforms/android-${ANDROID_API_LEVEL}

WORKDIR /usr/src/cordova
CMD cordova telemetry off && \
    cordova platform add android ; \
    cordova build --${BUILD_TYPE} && \
    cp -a platforms/android/app/build/outputs/apk/. ../build && \
    ${ALWAYS_RUN} && read PAUSE