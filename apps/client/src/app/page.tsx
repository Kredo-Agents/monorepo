import { UserRound, Monitor, Blocks, MessageSquare } from "lucide-react";

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.079.118 18.1.138 18.113a19.873 19.873 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function SlackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

const features = [
  {
    icon: <UserRound className="w-5 h-5 text-zinc-400" />,
    title: "Unique AI identity",
    desc: "Give your agent a name and personality. It remembers everything.",
  },
  {
    icon: <Monitor className="w-5 h-5 text-zinc-400" />,
    title: "Persistent memory & skills",
    desc: "24/7 cloud assistant that keeps full context and memory.",
  },
  {
    icon: <Blocks className="w-5 h-5 text-zinc-400" />,
    title: "Custom skills",
    desc: "Equip your assistant with expert knowledge from ClawHub.",
  },
  {
    icon: <MessageSquare className="w-5 h-5 text-zinc-400" />,
    title: "Works in your messenger",
    desc: "Available on Discord, Slack, Matrix and more.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950">
      <section className="bg-zinc-950 py-20 md:py-28 overflow-hidden h-full">
        <div className="max-w-6xl mx-auto px-6 flex flex-col items-center text-center">

          {/* Visual: phone device with floating platform icons */}
          <div className="relative w-full max-w-[500px] h-[280px]">

            {/* Phone frame — rendered first so everything else is on top */}
            <div
              className="absolute left-1/2 -translate-x-1/2 overflow-hidden w-52 rounded-t-[2.5rem] shadow-2xl"
              style={{ top: "calc(50% - 160px)", height: "200px" }}
            >
              <div className="w-full h-80 bg-zinc-900 border border-zinc-700/70 rounded-t-[2.5rem]">
                {/* Speaker notch */}
                <div className="flex justify-center pt-4">
                  <div className="w-14 h-1.5 bg-zinc-700 rounded-full" />
                </div>
                {/* Camera dot */}
                <div className="flex justify-center mt-2">
                  <div className="w-2 h-2 bg-zinc-700 rounded-full" />
                </div>
              </div>
            </div>

            {/* Telegram — left, over phone */}
            <div className="absolute left-[12%] top-[20%]">
              <div className="animate-float-1 w-14 h-14 rounded-full bg-[#229ED9] flex items-center justify-center shadow-xl">
                <TelegramIcon />
              </div>
            </div>

            {/* Discord — top left, over phone */}
            <div className="absolute top-[-5%] left-[20%]">
              <div className="animate-float-2 w-14 h-14 rounded-full bg-[#5865F2] flex items-center justify-center shadow-xl">
                <DiscordIcon />
              </div>
            </div>

            {/* Slack — top right, over phone */}
            <div className="absolute top-[-5%] right-[20%]">
              <div className="animate-float-3 w-14 h-14 rounded-full bg-[#4A154B] flex items-center justify-center shadow-xl">
                <SlackIcon />
              </div>
            </div>

            {/* WhatsApp — right, over phone */}
            <div className="absolute right-[12%] top-[20%]">
              <div className="animate-float-4 w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center shadow-xl">
                <WhatsAppIcon />
              </div>
            </div>

            {/* Agent card — topmost, slightly above center */}
            <div className="absolute left-1/2 top-[43%] -translate-x-1/2 -translate-y-1/2">
              <div className="bg-zinc-800 border border-zinc-700/80 rounded-2xl px-5 py-4 shadow-xl flex items-center gap-3 w-64">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0 text-lg">
                  🦞
                </div>
                <div className="text-left min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-semibold text-sm">Kredo</span>
                    <svg
                      className="w-4 h-4 text-blue-400 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="dot-wave mt-2">
                    <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full" />
                    <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full" />
                    <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-5xl mt-[-90px] md:text-6xl lg:text-7xl font-bold text-white tracking-tight mb-5">
            Claim your own agent
          </h1>

          {/* Subtitle */}
          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl leading-relaxed mb-10">
            Deploy your AI assistant in the cloud. Connect it to your favorite
            messengers. Install skills from ClawHub or write your own.
          </p>

          {/* CTA */}
          <a
            href="/setup"
            className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-zinc-900 bg-white rounded-xl hover:bg-zinc-100 transition-colors mb-20"
          >
            Get Started
          </a>

          {/* Feature cards */}
          <div
            id="features"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-5xl"
          >
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-left"
              >
                <div className="mb-3">{f.icon}</div>
                <h3 className="text-white font-semibold text-sm mb-1.5">
                  {f.title}
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
