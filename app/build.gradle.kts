plugins {
    id("com.android.application")
}

// Release signing comes from environment variables (set as GitHub secrets in CI).
// Values pasted into the GitHub form often carry stray spaces, newlines or quotes; strip them.
fun secret(name: String): String? = System.getenv(name)?.trim()?.trim('`', '"', '\'')?.trim()
val ksPath: String? = System.getenv("LUNA_KEYSTORE")
val hasReleaseKey = ksPath != null && file(ksPath).exists()

android {
    namespace = "io.github.mpereira17uc.luna"
    compileSdk = 36

    defaultConfig {
        applicationId = "io.github.mpereira17uc.luna"
        minSdk = 24
        targetSdk = 36
        versionCode = (System.getenv("LUNA_VERSION_CODE") ?: "1").toInt()
        versionName = System.getenv("LUNA_VERSION_NAME") ?: "1.0.0"
    }

    signingConfigs {
        if (hasReleaseKey) {
            create("release") {
                storeFile = file(ksPath!!)
                storePassword = secret("LUNA_KEYSTORE_PASSWORD")
                keyAlias = secret("LUNA_KEY_ALIAS")
                keyPassword = secret("LUNA_KEY_PASSWORD")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            if (hasReleaseKey) signingConfig = signingConfigs.getByName("release")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
