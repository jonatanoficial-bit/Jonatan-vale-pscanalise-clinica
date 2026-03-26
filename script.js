
document.getElementById('year').textContent = new Date().getFullYear();

const form = document.getElementById('agendamento-form');
if (form) {
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const status = document.getElementById('form-status');
    status.textContent = 'Pedido recebido. Esta é uma demonstração visual do site. Posso adaptar para WhatsApp, Calendly, formulário real ou sistema próprio.';
    status.style.display = 'block';
  });
}

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', function(e) {
    const id = this.getAttribute('href');
    if (id && id !== '#') {
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  });
});
