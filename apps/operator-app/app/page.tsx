import { redirect } from 'next/navigation';
import { isOnboarded } from './lib/workspace-store';

export default async function RootPage() {
  const onboarded = await isOnboarded();
  redirect(onboarded ? '/app' : '/welcome');
}
