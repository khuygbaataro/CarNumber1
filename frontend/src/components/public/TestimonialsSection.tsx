import { Testimonial } from '@/types';
import { t } from '@/lib/labels';

export default function TestimonialsSection({
  testimonials,
}: {
  testimonials: Testimonial[];
}) {
  if (!testimonials || testimonials.length === 0) return null;

  return (
    <section className="py-14 sm:py-20">
      <div className="container-page">
        <div className="text-center">
          <p className="eyebrow">{t.home.trust}</p>
          <h2 className="section-title mt-1.5">{t.home.testimonials}</h2>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((item, i) => (
            <figure
              key={i}
              className="flex flex-col rounded-2xl bg-white p-6 shadow-card ring-1 ring-gray-200"
            >
              <span className="text-4xl leading-none text-brand-200" aria-hidden>
                “
              </span>
              <blockquote className="mt-2 flex-1 leading-relaxed text-gray-600">
                {item.text}
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-gray-100 pt-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold uppercase text-brand">
                  {item.name?.trim().charAt(0) || '•'}
                </span>
                <span className="truncate text-sm font-semibold text-gray-900">
                  {item.name}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
