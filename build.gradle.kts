plugins {
    id("com.android.application") version "8.7.3" apply false
    id("org.jetbrains.kotlin.android") version "2.0.21" apply false
}

// Do not overwrite the historical build outputs already tracked in app/build.
allprojects {
    layout.buildDirectory.set(rootProject.layout.projectDirectory.dir(".release-build/" + if (path == ":") "root" else path.substring(1).replace(':', '/')))
}
