import './index.css';
import Nav from './components/Nav';
import Hero from './components/Hero';
import Performance from './components/Performance';
import Features from './components/Features';
import Capabilities from './components/Capabilities';
import Specs from './components/Specs';
import Reviews from './components/Reviews';
import CTA from './components/CTA';
import Footer from './components/Footer';

export default function App() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Nav />
      <main>
        <Hero />
        <Performance />
        <Features />
        <Capabilities />
        <Specs />
        <Reviews />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
