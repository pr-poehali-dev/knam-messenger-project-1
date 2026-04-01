import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";

const services = [
  {
    icon: "Monitor",
    title: "Веб-дизайн",
    desc: "Интерфейсы, которые не просто красивы — они продают. Каждый пиксель на своём месте.",
    tag: "01",
  },
  {
    icon: "Code2",
    title: "Разработка",
    desc: "Чистый код, быстрые сайты. От лендинга до сложного сервиса — реализуем любую идею.",
    tag: "02",
  },
  {
    icon: "Layers",
    title: "Брендинг",
    desc: "Создаём характер бизнеса: логотип, айдентика, стиль, который запоминается с первого взгляда.",
    tag: "03",
  },
  {
    icon: "Zap",
    title: "Стратегия",
    desc: "Анализируем рынок, конкурентов и аудиторию. Строим цифровую стратегию роста.",
    tag: "04",
  },
];

const works = [
  { title: "Fintech платформа", category: "Дизайн + Разработка", year: "2024" },
  { title: "E-commerce магазин", category: "UX / UI", year: "2024" },
  { title: "Корпоративный портал", category: "Разработка", year: "2023" },
  { title: "Мобильное приложение", category: "Дизайн", year: "2023" },
];

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

export default function Index() {
  const [menuOpen, setMenuOpen] = useState(false);
  const heroRef = useInView(0.1);
  const servicesRef = useInView(0.1);
  const worksRef = useInView(0.1);
  const contactRef = useInView(0.1);

  return (
    <div className="min-h-screen bg-background text-foreground font-golos overflow-x-hidden">
      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 backdrop-blur-md border-b border-white/5">
        <a href="#" className="font-cormorant text-2xl font-light tracking-widest text-gold-DEFAULT uppercase">
          Студия
        </a>
        <div className="hidden md:flex items-center gap-10 text-sm tracking-wider text-muted-foreground">
          <a href="#services" className="hover:text-gold-DEFAULT transition-colors duration-300">Услуги</a>
          <a href="#works" className="hover:text-gold-DEFAULT transition-colors duration-300">Работы</a>
          <a href="#contact" className="hover:text-gold-DEFAULT transition-colors duration-300">Контакт</a>
        </div>
        <a
          href="#contact"
          className="hidden md:inline-flex items-center gap-2 border border-gold-DEFAULT/40 text-gold-DEFAULT text-sm px-5 py-2 rounded-full hover:bg-gold-DEFAULT hover:text-background transition-all duration-300"
        >
          Обсудить проект
          <Icon name="ArrowUpRight" size={14} />
        </a>
        <button
          className="md:hidden text-foreground"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <Icon name={menuOpen ? "X" : "Menu"} size={22} />
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-background/98 flex flex-col items-center justify-center gap-10">
          <a href="#services" onClick={() => setMenuOpen(false)} className="font-cormorant text-4xl text-foreground hover:text-gold-DEFAULT transition-colors">Услуги</a>
          <a href="#works" onClick={() => setMenuOpen(false)} className="font-cormorant text-4xl text-foreground hover:text-gold-DEFAULT transition-colors">Работы</a>
          <a href="#contact" onClick={() => setMenuOpen(false)} className="font-cormorant text-4xl text-foreground hover:text-gold-DEFAULT transition-colors">Контакт</a>
        </div>
      )}

      {/* ── HERO ── */}
      <section
        ref={heroRef.ref}
        className="relative min-h-screen flex flex-col justify-center pt-24 px-8 md:px-16 lg:px-24 overflow-hidden"
      >
        {/* Background radial glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gold-DEFAULT/5 blur-[120px] pointer-events-none" />
        <div className="absolute top-2/3 right-0 w-[400px] h-[400px] rounded-full bg-gold-DEFAULT/4 blur-[100px] pointer-events-none" />

        {/* Decorative number */}
        <div className="absolute top-32 right-8 md:right-16 lg:right-24 font-cormorant text-[120px] md:text-[200px] leading-none font-light text-white/[0.03] select-none pointer-events-none">
          ©
        </div>

        <div className="relative max-w-5xl">
          <div
            className={`mb-6 flex items-center gap-3 transition-all duration-700 ${heroRef.inView ? "opacity-100" : "opacity-0"}`}
            style={{ transitionDelay: "0ms" }}
          >
            <span className="w-8 h-px bg-gold-DEFAULT/60 line-animate" />
            <span className="text-gold-DEFAULT text-xs tracking-[0.3em] uppercase font-medium">Цифровая студия</span>
          </div>

          <h1
            className={`font-cormorant font-light leading-[1.05] transition-all duration-700 ${heroRef.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
            style={{ fontSize: "clamp(3rem, 8vw, 7rem)", transitionDelay: "120ms" }}
          >
            Создаём продукты,
            <br />
            <span className="text-shimmer italic">которые работают</span>
          </h1>

          <p
            className={`mt-8 text-muted-foreground max-w-lg leading-relaxed text-lg transition-all duration-700 ${heroRef.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
            style={{ transitionDelay: "250ms" }}
          >
            Дизайн и разработка для брендов, которым важен результат. 
            Не шаблоны — только индивидуальный подход к каждому проекту.
          </p>

          <div
            className={`mt-12 flex flex-wrap items-center gap-5 transition-all duration-700 ${heroRef.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
            style={{ transitionDelay: "380ms" }}
          >
            <a
              href="#contact"
              className="group flex items-center gap-3 bg-gold-DEFAULT text-background font-medium px-8 py-4 rounded-full hover:bg-gold-light transition-all duration-300 shadow-lg shadow-gold-DEFAULT/20"
            >
              Начать проект
              <Icon name="ArrowRight" size={16} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#works"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors duration-300"
            >
              <span className="w-5 h-px bg-current" />
              Смотреть работы
            </a>
          </div>
        </div>

        {/* Stats row */}
        <div
          className={`absolute bottom-12 left-8 md:left-16 lg:left-24 flex gap-12 transition-all duration-700 ${heroRef.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          style={{ transitionDelay: "520ms" }}
        >
          {[
            { num: "80+", label: "Проектов" },
            { num: "6 лет", label: "Опыт" },
            { num: "94%", label: "Клиентов возвращаются" },
          ].map((s) => (
            <div key={s.num}>
              <div className="font-cormorant text-3xl font-light text-gold-DEFAULT">{s.num}</div>
              <div className="text-xs text-muted-foreground tracking-wider mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-12 right-8 md:right-16 flex flex-col items-center gap-2 opacity-40">
          <div className="w-px h-12 bg-gradient-to-b from-gold-DEFAULT to-transparent animate-pulse" />
          <span className="text-[10px] tracking-[0.25em] text-muted-foreground rotate-90 origin-center translate-y-4">SCROLL</span>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section id="services" className="py-28 px-8 md:px-16 lg:px-24" ref={servicesRef.ref}>
        <div
          className={`mb-16 transition-all duration-700 ${servicesRef.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <div className="flex items-center gap-3 mb-5">
            <span className="w-8 h-px bg-gold-DEFAULT/60" />
            <span className="text-gold-DEFAULT text-xs tracking-[0.3em] uppercase">Что мы делаем</span>
          </div>
          <h2 className="font-cormorant font-light text-5xl md:text-6xl">
            Наши услуги
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {services.map((s, i) => (
            <div
              key={s.tag}
              className={`service-card border border-white/8 bg-card rounded-lg p-7 cursor-pointer transition-all duration-700 ${servicesRef.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-8">
                <div className="w-10 h-10 rounded-md border border-gold-DEFAULT/30 flex items-center justify-center">
                  <Icon name={s.icon as any} size={18} className="text-gold-DEFAULT" />
                </div>
                <span className="font-cormorant text-3xl font-light text-white/10">{s.tag}</span>
              </div>
              <h3 className="font-cormorant text-2xl font-light mb-3">{s.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
              <div className="mt-6 flex items-center gap-2 text-gold-DEFAULT text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs tracking-wider">Подробнее</span>
                <Icon name="ArrowRight" size={12} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div className="px-8 md:px-16 lg:px-24">
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* ── WORKS ── */}
      <section id="works" className="py-28 px-8 md:px-16 lg:px-24" ref={worksRef.ref}>
        <div
          className={`mb-16 flex items-end justify-between transition-all duration-700 ${worksRef.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="w-8 h-px bg-gold-DEFAULT/60" />
              <span className="text-gold-DEFAULT text-xs tracking-[0.3em] uppercase">Портфолио</span>
            </div>
            <h2 className="font-cormorant font-light text-5xl md:text-6xl">Наши работы</h2>
          </div>
          <a href="#contact" className="hidden md:flex items-center gap-2 text-muted-foreground hover:text-gold-DEFAULT text-sm transition-colors">
            Все проекты
            <Icon name="ArrowUpRight" size={14} />
          </a>
        </div>

        <div className="space-y-0">
          {works.map((w, i) => (
            <div
              key={w.title}
              className={`group flex items-center justify-between py-6 border-b border-white/8 hover:border-gold-DEFAULT/30 cursor-pointer transition-all duration-500 ${worksRef.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className="flex items-center gap-6 md:gap-10">
                <span className="font-cormorant text-lg text-muted-foreground group-hover:text-gold-DEFAULT transition-colors w-10">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-cormorant text-2xl md:text-3xl font-light group-hover:text-gold-light transition-colors">
                  {w.title}
                </h3>
              </div>
              <div className="flex items-center gap-8 text-muted-foreground text-sm">
                <span className="hidden md:block tracking-wider">{w.category}</span>
                <span className="font-cormorant text-xl">{w.year}</span>
                <Icon
                  name="ArrowUpRight"
                  size={16}
                  className="opacity-0 group-hover:opacity-100 text-gold-DEFAULT -translate-x-2 group-hover:translate-x-0 transition-all duration-300"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="py-28 px-8 md:px-16 lg:px-24" ref={contactRef.ref}>
        <div className="relative rounded-2xl border border-white/8 bg-card overflow-hidden p-10 md:p-16 glow-gold">
          {/* BG decoration */}
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-gold-DEFAULT/5 blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-gold-DEFAULT/4 blur-[80px] pointer-events-none" />

          <div className="relative grid md:grid-cols-2 gap-12 items-start">
            <div
              className={`transition-all duration-700 ${contactRef.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            >
              <div className="flex items-center gap-3 mb-6">
                <span className="w-8 h-px bg-gold-DEFAULT/60" />
                <span className="text-gold-DEFAULT text-xs tracking-[0.3em] uppercase">Контакт</span>
              </div>
              <h2 className="font-cormorant font-light text-4xl md:text-5xl leading-tight mb-6">
                Готовы создать<br />
                <span className="text-shimmer italic">что-то особенное?</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-8">
                Расскажите о вашем проекте — мы ответим в течение дня и предложим оптимальное решение.
              </p>
              <div className="space-y-4">
                {[
                  { icon: "Mail", text: "hello@studio.ru" },
                  { icon: "Phone", text: "+7 (999) 000-00-00" },
                  { icon: "MapPin", text: "Москва, Россия" },
                ].map((c) => (
                  <div key={c.text} className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    <div className="w-8 h-8 rounded-md border border-white/10 flex items-center justify-center flex-shrink-0">
                      <Icon name={c.icon as any} size={14} className="text-gold-DEFAULT" />
                    </div>
                    <span className="text-sm">{c.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div
              className={`transition-all duration-700 ${contactRef.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{ transitionDelay: "150ms" }}
            >
              <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-muted-foreground tracking-wider mb-2">Имя</label>
                    <input
                      type="text"
                      placeholder="Александр"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-gold-DEFAULT/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground tracking-wider mb-2">Email</label>
                    <input
                      type="email"
                      placeholder="alex@mail.ru"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-gold-DEFAULT/50 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground tracking-wider mb-2">О проекте</label>
                  <textarea
                    rows={4}
                    placeholder="Расскажите о вашем проекте, целях и бюджете..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-gold-DEFAULT/50 transition-colors resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-gold-DEFAULT text-background font-medium py-4 rounded-lg hover:bg-gold-light transition-all duration-300 flex items-center justify-center gap-2 group shadow-lg shadow-gold-DEFAULT/20"
                >
                  Отправить заявку
                  <Icon name="Send" size={15} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-10 px-8 md:px-16 lg:px-24 border-t border-white/8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-muted-foreground text-sm">
          <span className="font-cormorant text-xl tracking-widest text-gold-DEFAULT">Студия</span>
          <span>© {new Date().getFullYear()} Все права защищены</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-gold-DEFAULT transition-colors">
              <Icon name="Instagram" size={16} />
            </a>
            <a href="#" className="hover:text-gold-DEFAULT transition-colors">
              <Icon name="Send" size={16} />
            </a>
            <a href="#" className="hover:text-gold-DEFAULT transition-colors">
              <Icon name="Linkedin" size={16} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
