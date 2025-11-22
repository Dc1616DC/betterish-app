import { Task } from '../types';

export const generateCalendarEvent = (task: Task) => {
  // Default to tomorrow at 9 AM for the event start
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  
  const endDate = new Date(tomorrow);
  endDate.setHours(10, 0, 0, 0);

  const formatDate = (date: Date) => {
    return date.toISOString().replace(/-|:|".\d+/g, '');
  };

  const event = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `DTSTART:${formatDate(tomorrow)}`,
    `DTEND:${formatDate(endDate)}`,
    `SUMMARY:${task.title}`,
    'DESCRIPTION:Reminder from Betterish: Time to get sh*t done.',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\n');

  const blob = new Blob([event], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `betterish-${task.id.slice(0,4)}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
