export interface FaqItem {
  question: string;
  answer: string;
}

export const faq: FaqItem[] = [
  {
    question: 'Posso levar meus filhos ou um acompanhante?',
    answer:
      'Como se trata de uma reunião pequena e íntima, pedimos gentilmente que compareçam apenas as pessoas listadas no convite. Embora adoremos seus filhos, estamos mantendo o evento exclusivo para adultos a fim de proporcionar um ambiente calmo e confortável durante o evento. Agradecemos a sua compreensão.',
  },
  {
    question: 'Tem estacionamento privado na recepção?',
    answer:
      'Infelizmente o local não conta com estacionamento privado, entretanto, há vagas gratuitas em ruas próximas.',
  },
];
