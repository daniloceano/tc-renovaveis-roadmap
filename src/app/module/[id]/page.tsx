import { notFound } from 'next/navigation';
import { modules } from '@/data/roadmap';
import { ModuleDetailClient } from '@/components/ModuleDetailClient';

interface PageProps {
  params: { id: string };
}

export function generateStaticParams() {
  return modules.map((m) => ({ id: m.id }));
}

export default function ModulePage({ params }: PageProps) {
  const mod = modules.find((m) => m.id === params.id);
  if (!mod) notFound();
  return <ModuleDetailClient module={mod} />;
}
