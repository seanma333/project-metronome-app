import Navbar from "./components/common/Navbar";
import Hero from "./components/landing/Hero";
import HowItWorks from "./components/landing/HowItWorks";
import Features from "./components/landing/Features";
import FAQ from "./components/landing/FAQ";
import Footer from "./components/common/Footer";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
