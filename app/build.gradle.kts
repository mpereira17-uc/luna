plugins {
    id("com.android.application")
}

// Release signing comes from environment variables (set as GitHub secrets in CI).
// Values pasted into the GitHub form often carry stray spaces, newlines or quotes; strip them.
fun secret(name: String): String? = System.getenv(name)?.trim()?.trim('`', '"', '\'')?.trim()
val ksPath: String? = System.getenv("LUNA_KEYSTORE")
val hasReleaseKey = ksPath != null && file(ksPath).exists()

// AdMob: debug builds always use Google's test ads. Release builds use the real ids from the
// LUNA_ADMOB_* secrets, or fall back to the test ids until those secrets exist.
val testAdmobApp = "ca-app-pub-3940256099942544~3347511713"
val testAdmobRewarded = "ca-app-pub-3940256099942544/5224354917"
val admobApp = secret("LUNA_ADMOB_APP_ID")?.takeIf { it.startsWith("ca-app-pub-") }
val admobRewarded = secret("LUNA_ADMOB_REWARDED_ID")?.takeIf { it.startsWith("ca-app-pub-") }
val realAds = admobApp != null && admobRewarded != null

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

    buildFeatures {
        resValues = true
    }

    buildTypes {
        debug {
            manifestPlaceholders["admobAppId"] = testAdmobApp
            resValue("string", "admob_rewarded", testAdmobRewarded)
        }
        release {
            manifestPlaceholders["admobAppId"] = if (realAds) admobApp!! else testAdmobApp
            resValue("string", "admob_rewarded", if (realAds) admobRewarded!! else testAdmobRewarded)
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

dependencies {
    implementation("com.google.android.gms:play-services-ads:25.5.0")
    implementation("com.google.android.ump:user-messaging-platform:4.0.0")
}
