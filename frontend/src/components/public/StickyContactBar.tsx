import { Settings } from '@/types';
import { telHref, messengerHref, primaryPhone } from '@/lib/contact';
import { t } from '@/lib/labels';

/**
 * Always-visible Call / Messenger bar pinned to the bottom of the screen on
 * phones. Most visitors arrive from Facebook on mobile and buy over the
 * phone, so the contact path must never scroll out of reach.
 *
 * Hidden on desktop (the header carries the phone number there) and it
 * renders nothing at all when the admin has set neither a phone number nor
 * a Facebook page.
 */
export default function StickyContactBar({ settings }: { settings: Settings }) {
  const tel = telHref(settings.contact?.phone);
  const messenger = messengerHref(settings.social?.facebook);

  if (!tel && !messenger) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 lg:hidden">
      <div className="border-t border-gray-200 bg-white/95 shadow-bar backdrop-blur">
        <div className="container-page pb-safe flex gap-2.5 py-2.5">
          {tel && (
            <a href={tel} className="btn-call flex-1">
              <PhoneIcon />
              {/* With both buttons side by side there is only room for the
                  verb; alone, the button shows the actual number. */}
              <span>
                {messenger
                  ? t.cta.call
                  : `${t.cta.call} — ${primaryPhone(settings.contact.phone)}`}
              </span>
            </a>
          )}

          {messenger && (
            <a
              href={messenger}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-messenger flex-1"
            >
              <ChatIcon />
              <span>{t.cta.messenger}</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.28-.28.7-.37 1.05-.25 1.15.38 2.39.59 3.65.59.55 0 1 .45 1 1V20c0 .55-.45 1-1 1C10.85 21 3 13.15 3 3.9c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.27.2 2.5.59 3.65.12.35.03.77-.25 1.05l-2.24 2.2z" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.4c-5.3 0-9.6 3.9-9.6 8.7 0 2.6 1.26 4.94 3.25 6.52v3.34a.6.6 0 0 0 .9.52l3.06-1.74c.76.16 1.56.25 2.39.25 5.3 0 9.6-3.9 9.6-8.7S17.3 2.4 12 2.4z" />
    </svg>
  );
}
