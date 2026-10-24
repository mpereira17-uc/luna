plugins {
    id("com.android.application")
}

// Luna: Mar abierto is its own app: its own id, its own versions, its own builds (the original Luna is untouched).
android {
    namespace = "io.github.mpereira17uc.lunamar"
    compileSdk = 36

    defaultConfig {
        applicationId = "io.github.mpereira17uc.lunamar"
        minSdk = 24
        targetSdk = 36
        versionCode = (System.getenv("LUNAMAR_VERSION_CODE") ?: "1").toInt()
        versionName = "0.1.0"
    }

    buildTypes {
        debug {
            applicationIdSuffix = ".prueba"
            versionNameSuffix = "-prueba"
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
