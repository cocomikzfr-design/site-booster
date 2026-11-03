import FadeIn from '../components/FadeIn';
import { SERVICES } from '../data';

export default function ServicesSection() {
  return (
    <section
      id="avantages"
      className="rounded-t-[40px] bg-white px-5 py-20 sm:rounded-t-[50px] sm:px-8 sm:py-24 md:rounded-t-[60px] md:px-10 md:py-32"
    >
      <FadeIn
        as="h2"
        className="mb-16 text-center font-black uppercase leading-none tracking-tight text-[#0C0C0C] sm:mb-20 md:mb-28"
        style={{ fontSize: 'clamp(3rem, 12vw, 160px)' }}
      >
        Avantages
      </FadeIn>

      <ul className="mx-auto max-w-5xl">
        {SERVICES.map((service, i) => (
          <FadeIn
            as="li"
            key={service.title}
            delay={i * 0.1}
            className="flex items-center gap-6 py-8 sm:gap-10 sm:py-10 md:gap-14 md:py-12"
            style={i > 0 ? { borderTop: '1px solid rgba(12, 12, 12, 0.15)' } : undefined}
          >
            <span
              className="shrink-0 font-black leading-none text-[#0C0C0C] [font-variant-numeric:tabular-nums]"
              style={{ fontSize: 'clamp(3rem, 10vw, 140px)', width: '1.3em' }}
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="flex min-w-0 flex-col gap-2 sm:gap-3">
              <h3
                className="font-medium uppercase text-[#0C0C0C]"
                style={{ fontSize: 'clamp(1rem, 2.2vw, 2.1rem)' }}
              >
                {service.title}
              </h3>
              <p
                className="max-w-2xl font-light leading-relaxed text-[#0C0C0C]"
                style={{ fontSize: 'clamp(0.85rem, 1.6vw, 1.25rem)', opacity: 0.6 }}
              >
                {service.description}
              </p>
            </div>
          </FadeIn>
        ))}
      </ul>
    </section>
  );
}
