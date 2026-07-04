# Tab — Guia de Distribuição Beta

## PRÉ-REQUISITOS (fazer uma única vez)

```bash
# 1. Instalar EAS CLI (já instalado)
npm install -g eas-cli

# 2. Fazer login na sua conta Expo
eas login

# 3. Vincular o projeto ao EAS (gera o projectId)
eas build:configure
```

> Após o `eas build:configure`, copie o `projectId` gerado e cole em:
> - `app.json` → `extra.eas.projectId`
> - `app.json` → `updates.url` (substitua `COLE_SEU_PROJECT_ID_AQUI`)

---

## ANDROID (mais simples — APK gratuito)

### Gerar APK para beta testers:
```bash
npm run build:android:beta
# ou diretamente:
eas build --platform android --profile preview
```

- Build leva ~10 minutos nos servidores da Expo
- Você recebe um **link de download do APK** por email e no terminal
- Envie esse link para os testadores por WhatsApp, email, etc.

### O testador Android precisa:
1. Abrir o link no celular Android
2. Baixar o APK
3. Nas configurações do celular → **"Instalar apps desconhecidos"** → Ativar
4. Abrir o APK baixado e instalar
5. Pronto — app instalado!

### Gerar AAB para Google Play (produção):
```bash
npm run build:android:prod
```

---

## iOS

### Opção 1 — TestFlight (recomendado — requer Apple Developer $99/ano)
```bash
# Gerar build para TestFlight
npm run build:ios:beta

# Enviar para App Store Connect
eas submit --platform ios
```
1. Criar conta em [developer.apple.com](https://developer.apple.com) ($99/ano)
2. Convidar testadores pelo App Store Connect
3. Testadores instalam via app **TestFlight** (grátis na App Store)

### Opção 2 — Expo Go (GRATUITO, sem build)
1. Testador instala o app **"Expo Go"** na App Store
2. Você roda no terminal: `npm start`
3. Testador escaneia o QR code exibido no terminal
4. Funciona apenas enquanto seu servidor estiver rodando
5. **Limitação**: não funciona com alguns módulos nativos

### Opção 3 — Build interno iOS (sem publicar na Store)
```bash
npm run build:ios:beta
```
> Requer registrar os **UDIDs** dos dispositivos dos testadores no Apple Developer Portal.
> Preencha `eas.json` → `submit.production.ios` com seus dados Apple.

---

## ATUALIZAR SEM NOVO BUILD (EAS Update)

Para atualizações de código JavaScript/interface (sem mudanças nativas):

```bash
npm run update:preview
# ou:
eas update --branch preview --message "Descrição da mudança"
```

Os usuários recebem a atualização **automaticamente** na próxima abertura do app.
**Não precisa gerar novo APK/IPA** para updates de UI e lógica!

---

## RESUMO DE SCRIPTS DISPONÍVEIS

| Comando | Descrição |
|---|---|
| `npm run build:android:dev` | APK com dev client (para testes nativos) |
| `npm run build:android:beta` | APK para beta testers (preview) |
| `npm run build:ios:beta` | IPA para TestFlight/interno (preview) |
| `npm run build:all:beta` | Android + iOS simultâneos (preview) |
| `npm run build:android:prod` | AAB para Google Play |
| `npm run build:ios:prod` | IPA para App Store |
| `npm run update:preview` | OTA update para branch preview |
| `npm run update:production` | OTA update para produção |

---

## COLETAR FEEDBACK DOS BETA TESTERS

Ferramentas gratuitas recomendadas:
- **Google Forms** — [forms.google.com](https://forms.google.com)
- **Typeform** — [typeform.com](https://typeform.com)
- **Grupo WhatsApp** — simples e eficaz
- **Notion** — para centralizar feedback e issues

---

## CHECKLIST ANTES DO BETA

### Configuração
- [ ] `.env` preenchido com todas as chaves Firebase e Gemini
- [ ] `projectId` do EAS inserido no `app.json`
- [ ] Firestore rules publicadas: `firebase deploy --only firestore:rules`
- [ ] Banco de imagens populado (botão na tela Perfil)

### Testes funcionais
- [ ] Login com email/senha funcionando
- [ ] Login com Google funcionando
- [ ] Onboarding (nome do mercado) funcionando
- [ ] Criar tab — seleção de produtos OK
- [ ] Banco de Imagens carrega produtos
- [ ] Botão IA abre modal e responde
- [ ] Editor salva corretamente
- [ ] Campanhas: tabs Ativas/Programadas/Finalizadas
- [ ] Perfil: editar nome, upload logo
- [ ] App não crasha em fluxos principais

### Build
- [ ] `eas login` feito
- [ ] `eas build:configure` executado
- [ ] Primeiro build Android gerado com sucesso
- [ ] APK instalado em dispositivo físico e testado

---

## LIMITES DO PLANO GRATUITO EAS

| Recurso | Gratuito |
|---|---|
| Builds Android (APK/AAB) | 30 builds/mês |
| Builds iOS simulador | 30 builds/mês |
| Builds iOS dispositivo real | Requer Apple Dev ($99/ano) |
| EAS Update (OTA) | 1.000 updates/mês |
| Membros da equipe | 1 |

---

## LINKS ÚTEIS

- [Expo EAS Build](https://docs.expo.dev/build/introduction/)
- [EAS Update](https://docs.expo.dev/eas-update/introduction/)
- [Firebase Console](https://console.firebase.google.com)
- [Google AI Studio (Gemini Key)](https://aistudio.google.com/app/apikey)
- [Google Cloud Console (OAuth)](https://console.cloud.google.com)
- [Apple Developer Portal](https://developer.apple.com)
- [App Store Connect](https://appstoreconnect.apple.com)
