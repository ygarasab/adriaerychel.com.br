export interface ScheduleItem {
  time: string;
  title: string;
}

export const schedule: ScheduleItem[] = [
  { time: '17:30', title: 'Chegada e Boas-vindas' },
  { time: '18:00', title: 'Sessão de fotos e Welcome Brunch' },
  { time: '19:30', title: 'Jantar' },
  { time: '20:00', title: 'Festa' },
  { time: '00:00', title: 'Encerramento' },
];
