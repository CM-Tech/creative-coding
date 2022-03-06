import "./style.scss";
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
import { createSignal } from "solid-js";
import im from "./traffic-dots/README.png?url";

const tileWidth = 300;
const tileHeight = 600;
const ExperimentTile = (props) => {
  const selected = () => Math.round(props.selectedIndex) === props.index;

  return (
    <div
      style={{
        background: selected() ? "#deddd7" : "#e4e4e4",
        width: tileWidth + "px",
        height: tileHeight + "px",
        "box-sizing": "border-box",
        padding: "10px",
      }}
      onClick={() => props.setSelectedIndex(props.index)}
    >
      <h1>{props.title}</h1>
      <img
        src={im}
        style={{
          width: tileWidth - 20 + "px",
          height: tileWidth - 20 + "px",
          background: "white",
          "object-fit": "cover",
          "object-position": "center",
        }}
      ></img>

      <h1>
        <Link href={props.href} style={{ "text-decoration": "none" }}>
          Go
        </Link>
      </h1>
    </div>
  );
};
const Default = () => {
  const [selectedIndexx, setSelectedIndexx] = createSignal(0);
  const setSelectedIndex = (v: number) => setSelectedIndexx(Math.max(0, Math.min(28, v)));
  const selectedIndex = () => Math.max(0, Math.min(28, selectedIndexx()));
  let start = { x: 0, y: 0, sIndex: 0 };
  const pointer = { x: 0, y: 0, down: false };
  const triggerMove = () => {
    if (pointer.down) {
      setSelectedIndex(start.sIndex - (pointer.x - start.x) / tileWidth);
    }
  };
  return (
    <div
      style={{
        background: "#e4e4e4",
        left: 0,
        position: "relative",
        top: 0,
        overflow: "hidden",
        width: "100vw",
        height: "100vh",
        "touch-action": "none",
      }}
      onMouseDown={(e) => {
        pointer.x = e.clientX;
        pointer.y = e.clientY;
        pointer.down = true;
        start = { x: pointer.x, y: pointer.y, sIndex: selectedIndex() + 0 };
      }}
      onMouseMove={(e) => {
        pointer.x = e.clientX;
        pointer.y = e.clientY;
        triggerMove();
      }}
      onMouseUp={(e) => {
        pointer.x = e.clientX;
        pointer.y = e.clientY;
        pointer.down = false;
      }}
      onTouchStart={(e) => {
        pointer.x = e.changedTouches[0].clientX;
        pointer.y = e.changedTouches[0].clientY;
        pointer.down = true;
        start = { x: pointer.x, y: pointer.y, sIndex: selectedIndex() + 0 };
      }}
      onTouchMove={(e) => {
        pointer.x = e.changedTouches[0].clientX;
        pointer.y = e.changedTouches[0].clientY;

        triggerMove();
      }}
      onTouchEnd={(e) => {
        pointer.x = e.changedTouches[0].clientX;
        pointer.y = e.changedTouches[0].clientY;
        pointer.down = false;
      }}
    >
      <div
        style={{
          left: "50vw",
          top: "10vh",
          transform: `translate( -50% , -50% )`,
          position: "absolute",
          transition: "transform 0.125s",
        }}
      >HI</div>
      <div
        style={{
          display: "flex",
          "flex-direction": "row",
          "flex-wrap": "nowrap",
          left: "50vw",
          top: "50vh",
          transform: `translate( -${tileWidth * (selectedIndex() + 0.5)}px, -${0.5 * tileHeight}px )`,
          position: "absolute",
          transition: "transform 0.125s",
        }}
      >
        <ExperimentTile
          href="/attraction"
          title={"Attraction"}
          index={0}
          selectedIndex={selectedIndex()}
          setSelectedIndex={setSelectedIndex}
        />
        <ExperimentTile
          href="/boid-beats"
          title={"Boid Beats"}
          index={1}
          selectedIndex={selectedIndex()}
          setSelectedIndex={setSelectedIndex}
        />
        <ExperimentTile
          href="/boids"
          title={"Boids"}
          index={2}
          selectedIndex={selectedIndex()}
          setSelectedIndex={setSelectedIndex}
        />
        <ExperimentTile
          href="/character-rain"
          title={"Character Rain"}
          index={3}
          selectedIndex={selectedIndex()}
          setSelectedIndex={setSelectedIndex}
        />
        <ExperimentTile
          href="/character-type"
          title={"Character Type"}
          index={4}
          selectedIndex={selectedIndex()}
          setSelectedIndex={setSelectedIndex}
        />
        <ExperimentTile
          href="/cobwebify"
          title={"Cobwebify"}
          index={5}
          selectedIndex={selectedIndex()}
          setSelectedIndex={setSelectedIndex}
        />
        <ExperimentTile
          href="/color-blind"
          title={"Color Blind"}
          index={6}
          selectedIndex={selectedIndex()}
          setSelectedIndex={setSelectedIndex}
        />
        <ExperimentTile
          href="/diacritic-sound"
          title={"Diacritic Sound"}
          index={7}
          selectedIndex={selectedIndex()}
          setSelectedIndex={setSelectedIndex}
        />
        <ExperimentTile
          href="/fireworks"
          title={"Fireworks"}
          index={8}
          selectedIndex={selectedIndex()}
          setSelectedIndex={setSelectedIndex}
        />
        <ExperimentTile
          href="/flocking-dots"
          title={"Flocking Dots"}
          index={9}
          selectedIndex={selectedIndex()}
          setSelectedIndex={setSelectedIndex}
        />
        <ExperimentTile
          href="/foosball"
          title={"Foosball"}
          index={10}
          selectedIndex={selectedIndex()}
          setSelectedIndex={setSelectedIndex}
        />
        <ExperimentTile
          href="/hex-life"
          title={"Hex Life"}
          index={11}
          selectedIndex={selectedIndex()}
          setSelectedIndex={setSelectedIndex}
        />
        <ExperimentTile
          href="/light-beamer"
          title={"Light Beamer"}
          index={12}
          selectedIndex={selectedIndex()}
          setSelectedIndex={setSelectedIndex}
        />
        <ExperimentTile
          href="/lights-motion"
          title={"Lights Motion"}
          index={13}
          selectedIndex={selectedIndex()}
          setSelectedIndex={setSelectedIndex}
        />
        <ExperimentTile
          href="/monster-sound"
          title={"Monster Sound"}
          index={14}
          selectedIndex={selectedIndex()}
          setSelectedIndex={setSelectedIndex}
        />
        <ExperimentTile
          href="/name-rain"
          title={"Name Rain"}
          index={15}
          selectedIndex={selectedIndex()}
          setSelectedIndex={setSelectedIndex}
        />
        <ExperimentTile
          href="/neon-airhockey"
          title={"Neon Airhockey"}
          index={16}
          selectedIndex={selectedIndex()}
          setSelectedIndex={setSelectedIndex}
        />
        <ExperimentTile
          href="/pen-flame"
          title={"Pen Flame"}
          index={17}
          selectedIndex={selectedIndex()}
          setSelectedIndex={setSelectedIndex}
        />
        <ExperimentTile
          href="/pixel-rush"
          title={"Pixel Rush"}
          index={18}
          selectedIndex={selectedIndex()}
          setSelectedIndex={setSelectedIndex}
        />
        <ExperimentTile
          href="/plasma-ball"
          title={"Plasma Ball"}
          index={19}
          selectedIndex={selectedIndex()}
          setSelectedIndex={setSelectedIndex}
        />
        <ExperimentTile
          href="/prismatic"
          title={"Prismatic"}
          index={20}
          selectedIndex={selectedIndex()}
          setSelectedIndex={setSelectedIndex}
        />
        <ExperimentTile
          href="/pulsing-square"
          title={"Pulsing Square"}
          index={21}
          selectedIndex={selectedIndex()}
          setSelectedIndex={setSelectedIndex}
        />
        <ExperimentTile
          href="/rainbow-goo"
          title={"Rainbow Goo"}
          index={22}
          selectedIndex={selectedIndex()}
          setSelectedIndex={setSelectedIndex}
        />
        <ExperimentTile
          href="/sph-water"
          title={"SPH Water"}
          index={23}
          selectedIndex={selectedIndex()}
          setSelectedIndex={setSelectedIndex}
        />
        <ExperimentTile
          href="/traffic-dots"
          title={"Traffic Dots"}
          index={24}
          selectedIndex={selectedIndex()}
          setSelectedIndex={setSelectedIndex}
        />
        <ExperimentTile
          href="/valentines-day"
          title={"Valentines Day"}
          index={25}
          selectedIndex={selectedIndex()}
          setSelectedIndex={setSelectedIndex}
        />
        <ExperimentTile
          href="/voronoi-diagram"
          title={"Voronoi Diagram"}
          index={26}
          selectedIndex={selectedIndex()}
          setSelectedIndex={setSelectedIndex}
        />
        <ExperimentTile
          href="/voronoi-dots"
          title={"Voronoi Dots"}
          index={27}
          selectedIndex={selectedIndex()}
          setSelectedIndex={setSelectedIndex}
        />
        <ExperimentTile
          href="/warpy"
          title={"Warpy"}
          index={28}
          selectedIndex={selectedIndex()}
          setSelectedIndex={setSelectedIndex}
        />
      </div>
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
