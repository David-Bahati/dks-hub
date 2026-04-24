
import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to public shop as landing page
  redirect('/shop');
}
