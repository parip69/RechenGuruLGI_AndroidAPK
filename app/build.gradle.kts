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

// Explicit user choice: clone-and-build with the original project key.
// External signing variables continue to take precedence. Never log these values.
val projectSigning = Properties().apply {
    val settings = rootProject.file("android-signing/signing.properties")
    if (settings.isFile) settings.inputStream().use(::load)
}
val releaseKeyPath = System.getenv("ANDROID_KEYSTORE_PATH")?.takeIf { it.isNotBlank() }
    ?: projectSigning.getProperty("keystore")?.let { rootProject.file("android-signing/$it").absolutePath }
val releaseStorePassword = System.getenv("ANDROID_KEYSTORE_PASSWORD")?.takeIf { it.isNotBlank() }
    ?: projectSigning.getProperty("storePassword")
val releaseKeyAlias = System.getenv("ANDROID_KEY_ALIAS")?.takeIf { it.isNotBlank() }
    ?: projectSigning.getProperty("alias")
val releaseKeyPassword = System.getenv("ANDROID_KEY_PASSWORD")?.takeIf { it.isNotBlank() }
    ?: projectSigning.getProperty("keyPassword")

val syncLauncherForegroundFromAssets = tasks.register<Copy>("syncLauncherForegroundFromAssets") {
    from(layout.projectDirectory.file("src/main/assets/icons/icon-512.png"))
    into(layout.projectDirectory.dir("src/main/res/drawable"))
    rename { "ic_launcher_foreground.png" }
}

val syncWebAssetsForDocs = tasks.register<Exec>("syncWebAssetsForDocs") {
    workingDir = rootProject.projectDir
    commandLine(
        if (System.getProperty("os.name").startsWith("Windows")) "powershell" else "pwsh",
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
    buildToolsVersion = "35.0.0"

    signingConfigs {
        create("existingRelease") {
            val path = releaseKeyPath
            if (!path.isNullOrBlank()) storeFile = file(path)
            storePassword = releaseStorePassword
            keyAlias = releaseKeyAlias
            keyPassword = releaseKeyPassword
            enableV1Signing = true
            enableV2Signing = true
            enableV3Signing = true
        }
    }

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
            signingConfig = signingConfigs.getByName("existingRelease")
            isDebuggable = false
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
            output.outputFileName = "MatheKids-v${versionName}.apk"
        }
    }
}

val validateReleaseSigning = tasks.register("validateReleaseSigning") {
    doLast {
        check(listOf(releaseKeyPath, releaseStorePassword, releaseKeyAlias, releaseKeyPassword).all { !it.isNullOrBlank() }) {
            "Original signing configuration is incomplete; no replacement will be generated"
        }
        val keyFile = file(releaseKeyPath!!)
        check(keyFile.isFile) { "Original signing keystore is unavailable" }
        check(keyFile.canonicalFile == rootProject.file("android-signing/original.keystore").canonicalFile ||
            !keyFile.canonicalFile.toPath().startsWith(rootProject.projectDir.canonicalFile.toPath())) {
            "Only the configured original key may be inside the repository"
        }
        check(JavaVersion.current() == JavaVersion.VERSION_17) { "Release builds require Java 17" }
    }
}
tasks.matching { it.name == "preReleaseBuild" }.configureEach { dependsOn(validateReleaseSigning) }

tasks.named("preBuild") {
    dependsOn(syncLauncherForegroundFromAssets)
    dependsOn(syncWebAssetsForDocs)
}

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.activity:activity-ktx:1.10.0")
    implementation("androidx.swiperefreshlayout:swiperefreshlayout:1.1.0")
}
