export const couple = {
  groom: 'Rychel Pereira',
  bride: 'Adria Ferreira',
  // Ordem visual no PDF original: "Rychel & Adria"
  displayOrder: ['Rychel', 'Adria'] as const,
};

export const event = {
  date: '04 de Julho de 2026',
  dateISO: '2026-07-04T17:30:00-03:00',
  weekday: 'Sábado',
  venue: {
    name: 'Oky Club Recepções',
    address: 'Av. Euclides Figueiredo, S/N',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Oky+Club+Recep%C3%A7%C3%B5es',
  },
  dressCode: 'Formal Garden Attire',
};

export const welcome = {
  title: 'Amigos e familiares',
  body: [
    'Se você recebeu esse convite, é por que faz parte da nossa história.',
    'Decidimos celebrar nossa união com uma pequena celebração leve e alegre.',
    'Você é pra nós, parte indispensável deste próximo capítulo.',
    'Criamos esse site para reunir as principais informações do evento.',
    'Solicitamos que confirme sua presença através do link que iremos disponibilizar abaixo para que possamos organizar este dia da melhor forma para todos nós!',
    'Aguardamos você!',
  ],
};

export const gift = {
  title: 'Sua presença é, sem dúvida, o melhor presente que poderíamos pedir.',
  body: 'Mas se você se sente inspirado(a) a nos presentear com algo, criamos uma pequena lista de presentes com alguns dos itens mais desejados que aqui neste link. Alternativamente, se prefere nos apoiar nesse início de vida de casados, uma contribuição para o nosso futuro será muito importante para nós. Obrigado por fazer parte deste momento tão importante conosco.',
  ctaLabel: 'Ver lista de presentes',
  // TODO: confirmar URL real com os noivos / Vini
  ctaUrl: '#',
};

export const contacts = {
  rychel: {
    name: 'Rychel Pereira',
    phone: '(91) 99345-6864',
    email: 'rychel.pereira21@gmail.com',
  },
  adria: {
    name: 'Adria Ferreira',
    phone: '(91) 98407-8328',
    email: 'adriamendes324@gmail.com',
  },
};

export const monogram = 'AR';
