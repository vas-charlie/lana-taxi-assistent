plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}
android {
    namespace = "com.vascharlie.lana"
    compileSdk = 36
    defaultConfig {
        applicationId = "com.vascharlie.lana"
        minSdk = 26
        targetSdk = 36
        versionCode = 1
        versionName = "1.0.0"
    }
}
