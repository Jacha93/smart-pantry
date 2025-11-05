import { redirect } from 'next/navigation';

export default function HomePage() {
  'use server';
  redirect('/groceries');
}