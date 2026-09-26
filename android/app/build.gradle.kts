plugins {
  id("com.android.application")
}

android {
  namespace = "com.eviltower.two"
  compileSdk = 35

  defaultConfig {
    applicationId = "com.eviltower.two"
    minSdk = 24
    targetSdk = 35
    // Номер сборки GitHub Actions растёт с каждым запуском: новая версия ставится поверх старой.
    versionCode = System.getenv("GITHUB_RUN_NUMBER")?.toIntOrNull() ?: 1
    // По тегу v1.2.3 — версия 1.2.3.
    versionName = System.getenv("GITHUB_REF_NAME")?.takeIf { it.startsWith("v") }?.drop(1) ?: "0.3.0"
  }

  signingConfigs {
    // Постоянный ключ сборок «для себя» (установка APK с телефона). Отладочный ключ на раннере
    // GitHub создаётся заново при каждом запуске — подпись каждой сборки была бы своей, и Android
    // отказывался ставить новую версию поверх старой («Приложение не установлено»).
    // Для публикации в магазине нужен свой ключ, который в репозиторий не кладут.
    create("sideload") {
      storeFile = file("sideload.keystore")
      storePassword = "eviltower"
      keyAlias = "eviltower"
      keyPassword = "eviltower"
    }
  }

  buildTypes {
    release {
      isMinifyEnabled = false
      signingConfig = signingConfigs.getByName("sideload")
    }
  }

  compileOptions {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
  }

  androidResources {
    // Шрифты и так сжаты — второй проход только раздувает APK.
    noCompress += listOf("woff", "woff2")
  }
}

/**
 * Игра попадает в APK как статические файлы в assets/www. Их кладёт туда `npm run apk:assets`,
 * поэтому перед сборкой проверяем, что шаг не забыли, — иначе получился бы пустой белый экран.
 */
val checkWebAssets by tasks.registering {
  val index = layout.projectDirectory.file("src/main/assets/www/index.html").asFile
  doFirst {
    if (!index.exists()) {
      throw GradleException(
        "Не найдена собранная игра (${index.path}).\n" +
          "Сначала выполните в корне репозитория:  npm ci && npm run apk:assets",
      )
    }
  }
}

tasks.named("preBuild") { dependsOn(checkWebAssets) }
