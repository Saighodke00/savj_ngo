import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_access_token')?.value;

  if (token) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
