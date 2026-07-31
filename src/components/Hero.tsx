import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative flex min-h-[calc(100vh-4rem)] flex-col justify-center overflow-hidden">
      <div
        className="hero-grid absolute inset-0 animate-fade-in"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.9)_0%,_transparent_55%),linear-gradient(180deg,_#f7f7f7_0%,_#ececec_100%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <p className="animate-fade-up text-sm font-medium tracking-[0.2em] text-muted uppercase">
          SimpleReserve
        </p>

        <h1 className="animate-fade-up animate-delay-1 mt-5 max-w-2xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl sm:leading-[1.15]">
          온라인 예약 시스템
        </h1>

        <p className="animate-fade-up animate-delay-2 mt-5 max-w-md text-base leading-relaxed text-muted sm:text-lg">
          원하는 일정을 선택하고, 몇 번의 클릭으로 예약을 완료하세요.
        </p>

        <div className="animate-fade-up animate-delay-3 mt-10">
          <Link
            href="/reserve"
            className="inline-flex items-center gap-2 rounded-md bg-foreground px-6 py-3.5 text-sm font-medium text-surface transition-all hover:gap-3 hover:opacity-85"
          >
            예약하러 가기
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
