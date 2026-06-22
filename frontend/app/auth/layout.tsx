import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] flex flex-col lg:flex-row p-4 md:p-8 gap-8 lg:gap-20 font-sans items-center justify-center">
      {/* Left Column (Forms) */}
      <div className="w-full lg:flex-1 flex flex-col justify-center items-center max-w-lg">
        <div className="w-full">
          {children}
        </div>
      </div>

      {/* Right Column (Mockup Promo Side Panel) */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] h-[580px] bg-[#0c0c0e] border border-neutral-900 rounded-[2rem] p-8 relative overflow-hidden shadow-2xl">
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808003_1px,transparent_1px),linear-gradient(to_bottom,#80808003_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        <div className="relative z-10 space-y-8">
          {/* Logo / Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="font-bold text-lg text-white">C</span>
            </div>
            <span className="font-semibold text-lg tracking-wide text-neutral-200">
              CodeWars.IO
            </span>
          </div>

          {/* Slogan */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight leading-tight text-neutral-100 max-w-sm">
              The Ultimate Real-Time<br />
              Competitive Coding Arena
            </h2>
            <p className="text-neutral-500 text-xs leading-relaxed max-w-xs">
              Solve complex algorithmic challenges, level up your ELO rating, and battle head-to-head with developers worldwide.
            </p>
          </div>
        </div>

        {/* Central Graphic */}
        <div className="relative z-10 flex-1 flex items-center justify-center my-4">
          <div className="relative w-64 h-64 transition-transform duration-700 hover:scale-105">
            <Image
              src="/images/loginImage.png"
              alt="CodeWars.IO Dueling Illustration"
              fill
              className="object-contain"
              priority
              sizes="256px"
            />
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex text-[10px] text-neutral-600">
          <span>Art by Gemini</span>
        </div>
      </div>
    </div>

  );
}
