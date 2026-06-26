import { Testimonial } from '@/types';
import { t } from '@/lib/labels';

export default function TestimonialsSection({
  testimonials,
}: {
  testimonials: Testimonial[];
}) {
  if (!testimonials || testimonials.length === 0) return null;

  return (
    <section className="py-12">
      <div className="container-page">
        <h2 className="text-center text-2xl font-bold text-gray-900">
          {t.home.testimonials}
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((item, i) => (
            <div
              key={i}
              className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200"
            >
              <p className="leading-relaxed text-gray-600">“{item.text}”</p>
              <p className="mt-4 font-semibold text-gray-900">— {item.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
