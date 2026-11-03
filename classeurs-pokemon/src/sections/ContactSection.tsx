import { Check, Copy } from 'lucide-react';
import { useRef, useState } from 'react';
import FadeIn from '../components/FadeIn';
import { ContactButton } from '../components/Buttons';
import { BRAND, CONTACT_EMAIL } from '../data';

export default function ContactSection() {
  const [copied, setCopied] = useState(false);
  const emailRef = useRef<HTMLSpanElement>(null);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Copie refusée : on sélectionne l'adresse pour un copier-coller manuel.
      const el = emailRef.current;
      if (!el) return;
      const range = document.createRange();
      range.selectNodeContents(el);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  };

  return (
    <section
      id="contact"
      className="flex flex-col items-center gap-10 px-5 pb-10 pt-24 text-center sm:px-8 sm:pt-32 md:px-10"
    >
      <FadeIn
        as="h2"
        className="hero-heading font-black uppercase leading-none tracking-tight"
        style={{ fontSize: 'clamp(3rem, 12vw, 160px)' }}
      >
        Contact
      </FadeIn>

      <FadeIn delay={0.1} className="flex flex-col items-center gap-6">
        <p
          className="max-w-[520px] font-light leading-relaxed text-[#D7E2EA]"
          style={{ fontSize: 'clamp(1rem, 2vw, 1.35rem)' }}
        >
          Une question sur un classeur ou sur ta commande ? Écris-moi.
        </p>
        <div className="flex items-center gap-3 rounded-full border border-[#D7E2EA]/25 py-2 pl-5 pr-2">
          <span ref={emailRef} className="select-all text-sm tracking-wide text-[#D7E2EA] sm:text-base">
            {CONTACT_EMAIL}
          </span>
          <button
            type="button"
            onClick={copy}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#D7E2EA]/10 text-[#D7E2EA] transition-colors hover:bg-[#D7E2EA]/20"
            aria-label={copied ? 'Adresse copiée' : "Copier l'adresse e-mail"}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
        <ContactButton href={`mailto:${CONTACT_EMAIL}`} label="Écrire un e-mail" />
      </FadeIn>

      <footer className="mt-16 flex w-full max-w-6xl flex-col items-center justify-between gap-3 border-t border-[#D7E2EA]/15 pt-8 text-xs font-light text-[#D7E2EA]/50 sm:flex-row sm:text-left">
        <span>
          © {new Date().getFullYear()} {BRAND}
        </span>
        <span className="max-w-xl">
          Pokémon est une marque de Nintendo, Creatures et GAME FREAK. Site indépendant, non affilié.
        </span>
      </footer>
    </section>
  );
}
