import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import weekOfYear from 'dayjs/plugin/weekOfYear';

dayjs.extend(isBetween);
dayjs.extend(weekOfYear);

export function formatDate(date: string | Date, format = 'YYYY-MM-DD'): string {
  return dayjs(date).format(format);
}

export function formatDateTime(date: string | Date, format = 'YYYY-MM-DD HH:mm:ss'): string {
  return dayjs(date).format(format);
}

export function getToday(): string {
  return dayjs().format('YYYY-MM-DD');
}

export function getNow(): string {
  return dayjs().format('YYYY-MM-DD HH:mm:ss');
}

export function getWeekDates(): string[] {
  const dates: string[] = [];
  const startOfWeek = dayjs().startOf('week');
  for (let i = 0; i < 7; i++) {
    dates.push(startOfWeek.add(i, 'day').format('YYYY-MM-DD'));
  }
  return dates;
}

export function getMonthDates(): string[] {
  const dates: string[] = [];
  const daysInMonth = dayjs().daysInMonth();
  const startOfMonth = dayjs().startOf('month');
  for (let i = 0; i < daysInMonth; i++) {
    dates.push(startOfMonth.add(i, 'day').format('YYYY-MM-DD'));
  }
  return dates;
}

export function isSameDay(date1: string, date2: string): boolean {
  return dayjs(date1).isSame(date2, 'day');
}

export function isInRange(date: string, start: string, end: string): boolean {
  return dayjs(date).isBetween(start, end, 'day', '[]');
}
