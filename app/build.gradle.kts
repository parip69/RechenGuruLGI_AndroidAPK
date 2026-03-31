import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

val versionProperties = Properties().apply {
    val versionFile = rootProject.file("version.properties")
    if (versionFile.exists()) {
        versionFile.inputStream().use(::load)
    }
}

val appVersionCode = versionProperties
    .getProperty("VERSION_CODE")
    ?.toIntOrNull()
    ?: 1

val appVersionName = versionProperties
    .getProperty("VERSION_NAME")
    ?.takeIf { it.isNotBlank() }
    ?: appVersionCode.toString()

val syncLauncherForegroundFromAssets = tasks.register<Copy>("syncLauncherForegroundFromAssets") {
    from(layout.projectDirectory.file("src/main/assets/icons/icon-512.png"))
    into(layout.projectDirectory.dir("src/main/res/drawable"))
    rename { "ic_launcher_foreground.png" }
}

val syncWebAssetsForDocs = tasks.register<Exec>("syncWebAssetsForDocs") {
    workingDir = rootProject.projectDir
    commandLine(
        "powershell",
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        rootProject.file("sync_web_assets.ps1").absolutePath,
        "-VersionName",
        appVersionName
    )
}

android {
    namespace = "de.parip69.rechengurulgi"
    compileSdk = 35

    defaultConfig {
        applicationId = "de.parip69.rechengurulgi"
        minSdk = 24
        targetSdk = 35
        versionCode = appVersionCode
        versionName = appVersionName

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        viewBinding = true
    }

    applicationVariants.all {
        outputs.all {
            val output = this as com.android.build.gradle.internal.api.ApkVariantOutputImpl
            output.outputFileName = "MatheGuru-v${versionName}.apk"
        }
    }
}

tasks.named("preBuild") {
    dependsOn(syncLauncherForegroundFromAssets)
    dependsOn(syncWebAssetsForDocs)
}

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.activity:activity-ktx:1.10.0")
}
