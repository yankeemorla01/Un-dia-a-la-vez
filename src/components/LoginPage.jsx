import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';

export default function LoginPage() {
  const { instance } = useMsal();

  const handleLogin = () => {
    instance.loginRedirect(loginRequest);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: '#0d0c0a', color: '#e0d8c8', fontFamily: "'Georgia', 'Times New Roman', serif" }}
    >
      <div className="fixed inset-0 pointer-events-none z-0"
        style={{ background: 'radial-gradient(ellipse at top, rgba(212,175,55,0.08) 0%, transparent 70%, rgba(0,0,0,0.8) 100%)' }} />

      <div className="z-10 flex flex-col items-center gap-8 animate-[fadeSlide_0.6s_ease_both]">
        <div className="text-center">
          <div className="text-[10px] tracking-[0.3em] uppercase text-[#6a5a40] mb-4 font-sans">
            Reto Personal
          </div>
          <h1 className="text-4xl md:text-5xl font-normal text-[#d4af37] tracking-wide mb-2">
            Un día a la vez
          </h1>
          <p className="text-sm text-[#6a5a40] font-sans max-w-xs mx-auto">
            Construye hábitos espirituales diarios con constancia y dedicación
          </p>
        </div>

        <button
          onClick={handleLogin}
          className="flex items-center gap-3 bg-[#1a1812] hover:bg-[#25221a] border border-[#3a3420] hover:border-[#d4af37] px-8 py-4 rounded-xl transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:shadow-[0_4px_20px_rgba(212,175,55,0.15)] group"
        >
          <svg width="21" height="21" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="9" height="9" fill="#f25022" />
            <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
            <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
            <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
          </svg>
          <span className="text-[#d4af37] font-sans text-sm tracking-wide group-hover:text-[#e0c050]">
            Iniciar sesión con Microsoft
          </span>
        </button>

        <p className="text-[10px] text-[#4a4030] font-sans text-center max-w-[280px]">
          Usa tu cuenta de Outlook, Hotmail o cualquier cuenta Microsoft para guardar tu progreso
        </p>
      </div>

      <style>{`
        @keyframes fadeSlide { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}
