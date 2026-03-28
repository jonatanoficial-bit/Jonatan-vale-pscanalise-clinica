
let deferredPrompt = null;
const installBtn = document.getElementById('installBtn');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (installBtn) installBtn.hidden = false;
});

if (installBtn) {
  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installBtn.hidden = true;
  });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js');
  });
}

document.getElementById('calendarForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const nome = document.getElementById('nome').value.trim();
  const data = document.getElementById('data').value;
  const hora = document.getElementById('hora').value;

  if (!data || !hora) return;

  const start = new Date(`${data}T${hora}:00`);
  const end = new Date(start.getTime() + 50 * 60 * 1000);

  const pad = (n) => String(n).padStart(2, '0');
  const toGCal = (d) => {
    const y = d.getUTCFullYear();
    const m = pad(d.getUTCMonth() + 1);
    const day = pad(d.getUTCDate());
    const h = pad(d.getUTCHours());
    const min = pad(d.getUTCMinutes());
    const s = pad(d.getUTCSeconds());
    return `${y}${m}${day}T${h}${min}${s}Z`;
  };

  const text = 'Solicitação de horário - Jonatan Vale Psicanálise';
  const details =
    `Pedido de agendamento enviado pelo site-app.%0A%0ANome: ${encodeURIComponent(nome || 'Não informado')}%0AContato principal: WhatsApp https://wa.me/qr/LM43TN5GGT3HL1%0A%0AObservação: a confirmação final do horário acontece no contato direto com a clínica.`;

  const url =
    `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(text)}&dates=${toGCal(start)}/${toGCal(end)}&details=${details}`;

  window.open(url, '_blank');
});
