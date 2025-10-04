import { redirect } from "next/navigation";
import { logger } from "@/lib/logger";

export default function Home() {
  logger.info('Home page accessed - redirecting to gallery', {
    component: 'HomePage',
    action: 'redirect',
    target: '/gallery',
  });
  
  redirect('/gallery');
}
