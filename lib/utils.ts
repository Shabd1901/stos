import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { toZonedTime, formatInTimeZone } from "date-fns-tz"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatIST(date: Date | string | number, formatStr = "MMM dd, yyyy") {
  return formatInTimeZone(date, "Asia/Kolkata", formatStr)
}

export function calculateRenewalDate(start: string | Date, months: number) {
  const date = new Date(start)
  date.setMonth(date.getMonth() + months)
  return date
}
