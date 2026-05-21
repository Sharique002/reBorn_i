import { CheckCircle2, Lock } from 'lucide-react';

interface FeatureListProps {
  features: string[];
  locked?: boolean;
}

export default function FeatureList({ features, locked = false }: FeatureListProps) {
  const Icon = locked ? Lock : CheckCircle2;
  return (
    <ul className="space-y-3">
      {features.map((feature) => (
        <li key={feature} className="flex items-start gap-2.5 text-sm text-bark">
          <span className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${locked ? 'bg-warm-50 text-dusk' : 'bg-green-50 text-green-600'}`}>
            <Icon className="w-3.5 h-3.5" />
          </span>
          <span className="leading-snug">{feature}</span>
        </li>
      ))}
    </ul>
  );
}

