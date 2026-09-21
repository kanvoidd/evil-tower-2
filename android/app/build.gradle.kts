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
    versionCode = 1
    versionName = "0.2.0"
  }

  buildTypes {
    release {
      isMinifyEnabled = false
      // Локальная сборка «для себя»: релизный APK подписывается отладочным ключом,
      // чтобы его можно было просто установить с телефона без своего keystore.
      signingConfig = signingConfigs.getByName("debug")
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
