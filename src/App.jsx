import './index.css';
import Nav          from './components/Nav';
import Hero         from './components/Hero';
import Performance  from './components/Performance';
import Features     from './components/Features';
import Capabilities from './components/Capabilities';
import Comparison   from './components/Comparison';
import Specs        from './components/Specs';
import Footer       from './components/Footer';

export default function App() {
  return (
    <div className="min-h-screen bg-[#080808]">
      <Nav />
      <main>
        <Hero />
        <Performance />
        <Features />
        <Capabilities />
        <Comparison />
        <Specs />
      </main>
      <Footer />
    </div>
  );
}
