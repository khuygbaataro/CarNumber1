import { Settings } from '@/types';
import { t } from '@/lib/labels';

/**
 * Thin band of facts under the hero. Everything shown here is real data the
 * admin already maintains (stock count, working hours, address) — nothing is
 * invented. Each item disappears when its setting is empty.
 */
export default function TrustStrip({
  settings,
  vehicleCount,
}: {
  settings: Settings;
  vehicleCount: number;
}) {
  const items = [
    vehicleCount > 0 && {
      icon: <CarIcon />,
      label: t.home.allVehicles,
      value: `${vehicleCount}`,
    },
    settings.workingHours && {
      icon: <ClockIcon />,
      label: t.home.workingHours,
      value: settings.workingHours,
    },
    settings.contact?.address && {
      icon: <PinIcon />,
      label: t.contact.address,
      value: settings.contact.address,
    },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string }[];

  if (items.length === 0) return null;

  return (
    <section className="border-b border-gray-200 bg-white">
      <div className="container-page grid grid-cols-1 gap-x-6 gap-y-4 py-5 sm:grid-cols-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand">
              {item.icon}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-gray-900">{item.value}</p>
              <p className="truncate text-xs text-gray-500">{item.label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M5 11l1.5-4.3A2 2 0 0 1 8.4 5.3h7.2a2 2 0 0 1 1.9 1.4L19 11h.5a1.5 1.5 0 0 1 1.5 1.5V17a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H6v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4.5A1.5 1.5 0 0 1 4.5 11H5zm2.1 0h9.8l-1.1-3.2a.5.5 0 0 0-.5-.35H8.7a.5.5 0 0 0-.5.35L7.1 11zM7 13.2a1.15 1.15 0 1 0 0 2.3 1.15 1.15 0 0 0 0-2.3zm10 0a1.15 1.15 0 1 0 0 2.3 1.15 1.15 0 0 0 0-2.3z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.75A9.25 9.25 0 1 0 21.25 12 9.26 9.26 0 0 0 12 2.75zm0 2A7.25 7.25 0 1 1 4.75 12 7.26 7.26 0 0 1 12 4.75zM11 7v5.4l4.15 2.45.85-1.45-3.5-2.05V7H11z" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.5A6.5 6.5 0 0 0 5.5 9c0 4.6 5.6 11.3 5.84 11.58a.86.86 0 0 0 1.32 0C12.9 20.3 18.5 13.6 18.5 9A6.5 6.5 0 0 0 12 2.5zm0 9a2.5 2.5 0 1 1 2.5-2.5A2.5 2.5 0 0 1 12 11.5z" />
    </svg>
  );
}
