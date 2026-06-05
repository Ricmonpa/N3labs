import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import Artifacts from "@/components/Artifacts";
import Process from "@/components/Process";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#06060c]">
      <Nav />
      <Hero />
      <Services />
      <Artifacts />
      <Process />
      <Contact />
      <Footer />
    </main>
  );
}
