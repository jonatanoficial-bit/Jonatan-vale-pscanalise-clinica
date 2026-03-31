document.getElementById('calendarForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const nome = document.getElementById('nome').value.trim();
  const data = document.getElementById('data').value;
  const hora = document.getElementById('hora').value;
  if (!data || !hora) return;
  const start = new Date(`${data}T${hora}:00`);
  const end = new Date(start.getTime() + 50 * 60 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  const toGCal = (d) => `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
  const text = 'Solicitação de horário - Jonatan Vale Psicanálise';
  const details = `Pedido enviado pelo site.%0A%0ANome: ${encodeURIComponent(nome || 'Não informado')}%0AContato principal: WhatsApp https://wa.me/qr/LM43TN5GGT3HL1`;
  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(text)}&dates=${toGCal(start)}/${toGCal(end)}&details=${details}`;
  window.open(url, '_blank');
});