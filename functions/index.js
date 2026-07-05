// O monitoramento da cotação do dólar (antiga Cloud Function `checkExchangeRate`, agendada
// a cada 15 minutos) foi migrado para o backend Express no Render — veja backend/index.js.
// Isso evita depender do plano pago Blaze do Firebase (exigido pelo Cloud Scheduler) e evita
// notificações push duplicadas, já que agora só uma rotina roda o monitoramento.
