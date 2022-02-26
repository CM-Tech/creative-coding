import "./style.css";
import { render } from "solid-js/web";
import { Link, Route, Router, Routes } from "solid-app-router";
import { Attraction } from "./attraction";
import { BoidBeats } from "./boid-beats";
import { Boids } from "./boids";
import { CharacterRain } from "./character-rain";
import { CharacterType } from "./character-type";
import { Cobwebify } from "./cobwebify";
import { ColorBlind } from "./color-blind";
import { DiacriticSound } from "./diacritic-sound";
import { Fireworks } from "./fireworks";
import { FlockingDots } from "./flocking-dots";
import { Foosball } from "./foosball";
import { HexLife } from "./hex-life";
import { LightBeamer } from "./light-beamer";
import { LightsMotion } from "./lights-motion";
import { MonsterSound } from "./monster-sound";
import { NameRain } from "./name-rain";
import { NeonAirhockey } from "./neon-airhockey";
import { PenFlame } from "./pen-flame";
import { PixelRush } from "./pixel-rush";
import { PlasmaBall } from "./plasma-ball";
import { TrafficDots } from "./traffic-dots";
import { Prismatic } from "./prismatic";
import { PulsingSquare } from "./pulsing-square";
import { RainbowGoo } from "./rainbow-goo";
import { SPHWater } from "./sph-water";
import { ValentinesDay } from "./valentines-day";
import { VoronoiDiagram } from "./voronoi-diagram";
import { VoronoiDots } from "./voronoi-dots";
import { Warpy } from "./warpy";

const Default = () => {
  return (
    <div style={{ display: "flex", "flex-direction": "column" }}>
      <Link href="/attraction">Attraction</Link>
      <Link href="/boid-beats">Boid Beats</Link>
      <Link href="/boids">Boids</Link>
      <Link href="/character-rain">Character Rain</Link>
      <Link href="/character-type">Character Type</Link>
      <Link href="/cobwebify">Cobwebify</Link>
      <Link href="/color-blind">Color Blind</Link>
      <Link href="/diacritic-sound">Diacritic Sound</Link>
      <Link href="/fireworks">Fireworks</Link>
      <Link href="/flocking-dots">Flocking Dots</Link>
      <Link href="/foosball">Foosball</Link>
      <Link href="/hex-life">Hex Life</Link>
      <Link href="/light-beamer">Light Beamer</Link>
      <Link href="/lights-motion">Lights Motion</Link>
      <Link href="/monster-sound">Monster Sound</Link>
      <Link href="/name-rain">Name Rain</Link>
      <Link href="/neon-airhockey">Neon Airhockey</Link>
      <Link href="/pen-flame">Pen Flame</Link>
      <Link href="/pixel-rush">Pixel Rush</Link>
      <Link href="/plasma-ball">Plasma Ball</Link>
      <Link href="/prismatic">Prismatic</Link>
      <Link href="/pulsing-square">Pulsing Square</Link>
      <Link href="/rainbow-goo">Rainbow Goo</Link>
      <Link href="/sph-water">SPH Water</Link>
      <Link href="/traffic-dots">Traffic Dots</Link>
      <Link href="/valentines-day">Valentines Day</Link>
      <Link href="/voronoi-diagram">Voronoi Diagram</Link>
      <Link href="/voronoi-dots">Voronoi Dots</Link>
      <Link href="/warpy">Warpy</Link>
    </div>
  );
};
const App = () => {
  return (
    <Routes>
      <Route path="/attraction" element={Attraction} />
      <Route path="/boid-beats" element={BoidBeats} />
      <Route path="/boids" element={Boids} />
      <Route path="/character-rain" element={CharacterRain} />
      <Route path="/character-type" element={CharacterType} />
      <Route path="/cobwebify" element={Cobwebify} />
      <Route path="/color-blind" element={ColorBlind} />
      <Route path="/diacritic-sound" element={DiacriticSound} />
      <Route path="/fireworks" element={Fireworks} />
      <Route path="/flocking-dots" element={FlockingDots} />
      <Route path="/foosball" element={Foosball} />
      <Route path="/hex-life" element={HexLife} />
      <Route path="/light-beamer" element={LightBeamer} />
      <Route path="/lights-motion" element={LightsMotion} />
      <Route path="/monster-sound" element={MonsterSound} />
      <Route path="/name-rain" element={NameRain} />
      <Route path="/neon-airhockey" element={NeonAirhockey} />
      <Route path="/pen-flame" element={PenFlame} />
      <Route path="/pixel-rush" element={PixelRush} />
      <Route path="/plasma-ball" element={PlasmaBall} />
      <Route path="/prismatic" element={Prismatic} />
      <Route path="/pulsing-square" element={PulsingSquare} />
      <Route path="/rainbow-goo" element={RainbowGoo} />
      <Route path="/sph-water" element={SPHWater} />
      <Route path="/traffic-dots" element={TrafficDots} />
      <Route path="/valentines-day" element={ValentinesDay} />
      <Route path="/voronoi-diagram" element={VoronoiDiagram} />
      <Route path="/voronoi-dots" element={VoronoiDots} />
      <Route path="/warpy" element={Warpy} />
      <Route path="/" element={Default} />
    </Routes>
  );
};

render(
  () => (
    <Router>
      <App />
    </Router>
  ),
  document.getElementById("app")!
);
