import Image from "next/image";

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.05] py-10 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <Image src="/n3-logo.png" alt="N3 Thinktech IA Laboratory" width={130} height={53} />

        <p className="text-zinc-700 text-xs text-center">
          © {new Date().getFullYear()} N3 Thinktech IA Laboratory. Todos los derechos reservados.
        </p>

        <div className="flex items-center gap-6">
          <a href="#servicios" className="text-zinc-600 hover:text-zinc-300 text-xs transition-colors">Servicios</a>
          <a href="#soluciones" className="text-zinc-600 hover:text-zinc-300 text-xs transition-colors">Soluciones</a>
          <a href="#contacto" className="text-zinc-600 hover:text-zinc-300 text-xs transition-colors">Contacto</a>
        </div>
      </div>
    </footer>
  );
}
