# Publicar na Play Store

## 1. Criar a chave de assinatura (uma vez)

A chave identifica a app para sempre. **Guarda uma cópia segura dela e das palavras-passe.** Sem ela não dá para publicar atualizações.

```sh
keytool -genkeypair -v -keystore mini-jogos.keystore -alias mini-jogos \
  -keyalg RSA -keysize 2048 -validity 10000
mv mini-jogos.keystore android/
```

Cria `android/keystore.properties` (já está no `.gitignore`, nunca o publiques):

```properties
storeFile=mini-jogos.keystore
storePassword=A_TUA_PALAVRA_PASSE
keyAlias=mini-jogos
keyPassword=A_TUA_PALAVRA_PASSE
```

## 2. Gerar o pacote para a loja

1. Sobe o `versionCode` (e o `versionName`) em `android/app/build.gradle` a cada nova versão.
2. Corre:

```sh
npm run android:release
```

O ficheiro fica em `android/app/build/outputs/bundle/release/app-release.aab`.

## 3. Play Console

1. Cria a conta de programador em https://play.google.com/console (pagamento único da Google).
2. Cria a app "Mini Jogos" como jogo gratuito.
3. Preenche a página da loja com os textos de `store/listing-pt.md` e as imagens de `store/`.
4. Política de privacidade: publica `docs/PRIVACIDADE.md` num endereço público e cola o link.
5. Segurança dos dados: indica que a app **não recolhe nem partilha** dados.
6. Anúncios: indica que a app **não tem anúncios**.
7. Carrega o `.aab` em "Testes internos", experimenta, e depois promove para "Produção".

## Alternativa: F-Droid

Como o projeto é open source, sem anúncios e sem serviços da Google, também pode ser publicado no F-Droid
(loja só de apps livres). Retira primeiro o plugin `@capacitor-community/in-app-review`, que usa a Play Store.
