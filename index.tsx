import "./style.scss";
import { render } from "solid-js/web";
import { Link, Route, Router, Routes } from "solid-app-router";
import { Attraction, AttractionExperiment } from "./attraction";
import { BoidBeats, BoidBeatsExperiment } from "./boid-beats";
import { Boids, BoidsExperiment } from "./boids";
import { CharacterRain, CharacterRainExperiment } from "./character-rain";
import { CharacterType, CharacterTypeExperiment } from "./character-type";
import { Cobwebify, CobwebifyExperiment } from "./cobwebify";
import { ColorBlind, ColorBlindExperiment } from "./color-blind";
import { DiacriticSound, DiacriticSoundExperiment } from "./diacritic-sound";
import { Fireworks, FireworksExperiment } from "./fireworks";
import { FlockingDots, FlockingDotsExperiment } from "./flocking-dots";
import { Foosball, FoosballExperiment } from "./foosball";
import { HexLife, HexLifeExperiment } from "./hex-life";
import { LightBeamer, LightBeamerExperiment } from "./light-beamer";
import { LightsMotion, LightsMotionExperiment } from "./lights-motion";
import { MonsterSound, MonsterSoundExperiment } from "./monster-sound";
import { NameRain, NameRainExperiment } from "./name-rain";
import { NeonAirhockey, NeonAirhockeyExperiment } from "./neon-airhockey";
import { PenFlame, PenFlameExperiment } from "./pen-flame";
import { PixelRush, PixelRushExperiment } from "./pixel-rush";
import { PlasmaBall, PlasmaBallExperiment } from "./plasma-ball";
import { TrafficDots, TrafficDotsExperiment } from "./traffic-dots";
import { Prismatic, PrismaticExperiment } from "./prismatic";
import { PulsingSquare, PulsingSquareExperiment } from "./pulsing-square";
import { RainbowGoo, RainbowGooExperiment } from "./rainbow-goo";
import { SPHWater, SPHWaterExperiment } from "./sph-water";
import { ValentinesDay, ValentinesDayExperiment } from "./valentines-day";
import { VoronoiDiagram, VoronoiDiagramExperiment } from "./voronoi-diagram";
import { VoronoiDots, VoronoiDotsExperiment } from "./voronoi-dots";
import { Warpy, WarpyExperiment } from "./warpy";
import { Component, createMemo, createSignal } from "solid-js";
import im from "./traffic-dots/README.png?url";
import im2 from "./boid-beats/README.png?url";
import { Experiment } from "./shared/types";
import { BASE_DARK, BASE_LIGHT } from "./shared/constants";
import chroma from "chroma-js";

const tileWidth = 300;
const tileIWidth = 250;
const tileHeight = 500;
const TTile = (props) => {
  return createMemo(() => {
    if (props.inset)
      return (
        <div
          style={{
            "background-color": props.fillColor,
            "background-image": [
              ` linear-gradient(180deg, #00000020, #ffffff10, #ffffff20)`,
              props.fillImg ? props.fillImg : undefined,
            ]
              .filter((x) => !!x)
              .join(","), //#e4e4e4",//"#deddd7" : "#e4e4e4",
            "box-shadow": `0px 1px 2px rgba(0,0,0,0.25) inset,0px 1px 1px rgba(255,255,255,0.75),0px -1px 1px rgba(255,255,255,0.5) `,

            "box-sizing": "border-box",
            padding: "0px",
            border: "1px solid rgba(0,0,0,0.5)",
            "border-radius": "8px",
            ...props.style,
          }}
          {...props.props}
        >
          {props.children}
        </div>
      );

    return (
      <div
        style={{
          "background-color": props.fillColor,
          "background-image": [
            ` linear-gradient(0deg, #00000020, #ffffff10, #ffffff20)`,
            props.fillImg ? props.fillImg : undefined,
          ]
            .filter((x) => !!x)
            .join(","), //#e4e4e4",//"#deddd7" : "#e4e4e4",
          "box-shadow": `0px 1px 2px rgba(0,0,0,0.25),0px 1px 1px rgba(255,255,255,0.75) inset,0px -1px 1px rgba(255,255,255,0.5) inset`,

          "box-sizing": "border-box",
          padding: "0px",
          border: "1px solid rgba(0,0,0,0.5)",
          "border-radius": "8px",
          ...props.style,
        }}
        {...props.props}
      >
        {props.children}
      </div>
    );
  });
};
const ExperimentTile = (props) => {
  const selected = () => Math.round(props.selectedIndex) === props.index;

  return (
    <div
      style={{
        // background: selected() ? `linear-gradient(135deg, #e0e0e0, #f0f0f0)`:"none",//#e4e4e4",//"#deddd7" : "#e4e4e4",
        // "box-shadow":selected() ?`0px 1px 2px black`:"",
        width: tileIWidth + "px",
        height: tileHeight + "px",
        display: "flex",
        "flex-direction": "column",
        "box-sizing": "border-box",
        padding: "0px",
        "margin-right": `${(tileWidth - tileIWidth) / 2}px`,
        "margin-left": `${(tileWidth - tileIWidth) / 2}px`,
      }}
      // fillColor={"#deddd7"}
      // props={{onClick:() => props.setSelectedIndex(props.index)}}
      onClick={() => props.setSelectedIndex(props.index)}
    >
      <TTile
        style={{
          width: tileIWidth + "px",
          height: tileIWidth + "px",
          // "background-image": `url(${im})`,
          "object-fit": "cover",
          "object-position": "center",
          "background-size": "cover",
          "background-position": "center",
          // "box-shadow":`0px 1px 2px rgba(0,0,0,0.25), 0px 0px 0px 1px rgba(0,0,0,0.5) inset,0px 1px 1px rgba(255,255,255,0.75) inset,0px -1px 1px rgba(255,255,255,0.5) inset`,

          "box-sizing": "border-box",
          "border-radius": "8px 8px 0px 0px",
          "border-bottom-width": "1px",
          padding: "0",
        }}
        fillImg={`url(${props?.experiment?.imgUrl ?? im2})`}
        inset
      ></TTile>
      <TTile
        style={{
          width: tileIWidth + "px",
          height: tileHeight - tileIWidth + "px",
          // "background-image": `url(${im})`,
          "object-fit": "cover",
          "object-position": "center",
          "background-size": "cover",
          "background-position": "center",
          // "box-shadow":`0px 1px 2px rgba(0,0,0,0.25), 0px 0px 0px 1px rgba(0,0,0,0.5) inset,0px 1px 1px rgba(255,255,255,0.75) inset,0px -1px 1px rgba(255,255,255,0.5) inset`,

          "box-sizing": "border-box",
          "border-radius": "0px 0px 8px 8px",
          "border-top-width": "0.0px",
          padding: "8px",
        }}
        fillColor={BASE_DARK}
        inset
        // fillColor="#f48444"
      >
        <h1
          style={{
            "background-color": "white",
            color: "transparent",
            "background-image": `linear-gradient(0deg, #00000020, #ffffff20, #ffffff80)`,
            "-webkit-background-clip": "text",
            margin: "0",
          }}
        >
          {props.title}
        </h1>
        <p
          style={{
            "background-color": "white",
            color: "transparent",
            "background-image": `linear-gradient(0deg, #00000020, #ffffff20, #ffffff80)`,
            "-webkit-background-clip": "text",
            margin: "0",
          }}
        >
          {props?.experiment?.description ?? ""}
        </p>
        <TTile
          style={{
            display: "inline-block",
            "margin-right": "10px",
            "margin-top": "10px",
            height: "40px",
            padding: "8px",
          }}
          fillColor="#1188ff"
        >
          <Link href={props.href} style={{ "text-decoration": "none", color: "white" }}>
            {"Open"}
          </Link>
        </TTile>
      </TTile>
      {/* <TTile
      style={{
        // background: selected() ? `linear-gradient(135deg, #e0e0e0, #f0f0f0)`:"none",//#e4e4e4",//"#deddd7" : "#e4e4e4",
        // "box-shadow":selected() ?`0px 1px 2px black`:"",
        width: tileWidth + "px",
        height: (tileHeight-tileWidth ) + "px",
        "box-sizing": "border-box",
        padding: "0px",
        "border-top":"none",

        "border-radius":"0",
        "border-bottom-right-radius":"8px",

        "border-bottom-left-radius":"8px"
      }}
      fillColor={"#e4e4e4"}
      // props={{onClick:() => props.setSelectedIndex(props.index)}}
    >
      <TTile
        style={{
          // "background-image": `url(${im})`,
          "object-fit": "cover",
          "object-position": "center",
          "background-size": "cover",
          "background-position": "center",
          // "box-shadow":`0px 1px 2px rgba(0,0,0,0.25), 0px 0px 0px 1px rgba(0,0,0,0.5) inset,0px 1px 1px rgba(255,255,255,0.75) inset,0px -1px 1px rgba(255,255,255,0.5) inset`,
       
        "box-sizing": "border-box",
        "border-radius":"7px",
        "border-bottom-right-radius":"0",

        "border-bottom-left-radius":"0",
        padding:"0",margin:5
        }}
        fillImg={`url(${im})`}
        inset
      ><TTile style={{display:"block",margin:-2}} 
      fillColor={"#deddd7"}>
        {props.title}</TTile>
         
      </TTile>
     
      <h1>
      <TTile style={{display:"inline-block"}}
      fillColor={"#deddd7"}><TTile style={{display:"inline-block","margin-right":"10px"}}
      fillColor={"#deddd7"}>
        <Link href={props.href} style={{ "text-decoration": "none" }}>
        <span style={{"background-color":"#ffaa22",color:"transparent",
        "background-image": `linear-gradient(315deg, #00000020, #ffffff20, #ffffff80)`,"-webkit-background-clip":"text"}}>Go</span>
        </Link></TTile>
        <TTile style={{display:"inline-block","margin-right":"10px"}} inset
      fillColor={"#ffaa22"}>
        <Link href={props.href} style={{ "text-decoration": "none" }}>
          Go
        </Link></TTile><TTile style={{display:"inline-block","margin-right":"0px"}} 
      fillColor={"#ffaa22"}>
        <Link href={props.href} style={{ "text-decoration": "none" }}>
          Go
        </Link></TTile></TTile>
      </h1></TTile> */}
    </div>
  );
};
const Default: Component<{ experiments: Record<string, Experiment> }> = (props) => {
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
    <TTile
      style={{
        left: 0,
        position: "relative",
        top: 0,
        overflow: "hidden",
        width: "100vw",
        height: "100vh",
        "touch-action": "none",
        "object-fit": "cover",
        "object-position": "center",
        "background-size": "cover",
        "background-position": "center",
        // "box-shadow":`0px 1px 2px rgba(0,0,0,0.25), 0px 0px 0px 1px rgba(0,0,0,0.5) inset,0px 1px 1px rgba(255,255,255,0.75) inset,0px -1px 1px rgba(255,255,255,0.5) inset`,

        "box-sizing": "border-box",
        "border-radius": "0px",
        "border-top-width": "0.0px",
        // padding: "8px",
      }}
      fillColor={BASE_DARK}
      // fillColor="#f48444"
      props={{
        onMouseDown: (e) => {
          pointer.x = e.clientX;
          pointer.y = e.clientY;
          pointer.down = true;
          start = { x: pointer.x, y: pointer.y, sIndex: selectedIndex() + 0 };
        },
        onMouseMove: (e) => {
          pointer.x = e.clientX;
          pointer.y = e.clientY;
          triggerMove();
        },
        onMouseUp: (e) => {
          pointer.x = e.clientX;
          pointer.y = e.clientY;
          pointer.down = false;
        },
        onTouchStart: (e) => {
          pointer.x = e.changedTouches[0].clientX;
          pointer.y = e.changedTouches[0].clientY;
          pointer.down = true;
          start = { x: pointer.x, y: pointer.y, sIndex: selectedIndex() + 0 };
        },
        onTouchMove: (e) => {
          pointer.x = e.changedTouches[0].clientX;
          pointer.y = e.changedTouches[0].clientY;

          triggerMove();
        },
        onTouchEnd: (e) => {
          pointer.x = e.changedTouches[0].clientX;
          pointer.y = e.changedTouches[0].clientY;
          pointer.down = false;
        },
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
      >
        {/* HI */}
      </div>
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
        {Object.entries(props.experiments).map(([a, b], i) => {
          return (
            <ExperimentTile
              href={a}
              title={b.title}
              experiment={b}
              index={i}
              selectedIndex={selectedIndex()}
              setSelectedIndex={setSelectedIndex}
            />
          );
        })}
      </div>
    </TTile>
  );
};
const App = () => {
  const experiments: Record<string, Experiment> = {
    "/attraction": AttractionExperiment,
    "/boid-beats": BoidBeatsExperiment,
    "/boids": BoidsExperiment,
    "/character-rain": CharacterRainExperiment,
    "/character-type": CharacterTypeExperiment,
    "/cobwebify": CobwebifyExperiment,
    "/color-blind": ColorBlindExperiment,
    "/diacritic-sound": DiacriticSoundExperiment,
    "/fireworks": FireworksExperiment,
    "/flocking-dots": FlockingDotsExperiment,
    "/foosball": FoosballExperiment,
    "/hex-life": HexLifeExperiment,
    "/light-beamer": LightBeamerExperiment,
    "/lights-motion": LightsMotionExperiment,
    "/monster-sound": MonsterSoundExperiment,
    "/name-rain": NameRainExperiment,
    "/neon-airhockey": NeonAirhockeyExperiment,
    "/pen-flame": PenFlameExperiment,
    "/pixel-rush": PixelRushExperiment,
    "/plasma-ball": PlasmaBallExperiment,
    "/prismatic": PrismaticExperiment,
    "/pulsing-square": PulsingSquareExperiment,
    "/rainbow-goo": RainbowGooExperiment,
    "/sph-water": SPHWaterExperiment,
    "/traffic-dots": TrafficDotsExperiment,
    "/valentines-day": ValentinesDayExperiment,
    "/voronoi-diagram": VoronoiDiagramExperiment,
    "/voronoi-dots": VoronoiDotsExperiment,
    "/warpy": WarpyExperiment,
  };
  return (
    <Routes>
      {Object.entries(experiments)
        .map(([a, b], i) => {
          return <Route path={a} element={b.component} />;
        })
        .concat([
          <Route
            path="/"
            element={() => {
              return <Default experiments={experiments} />;
            }}
          />,
        ])}
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
