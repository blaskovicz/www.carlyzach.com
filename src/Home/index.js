import React from "react";
import Particles from "react-particles-js";
export default function() {
  return (
    <div className="text-center">
      <Particles
        params={{
          particles: {
            number: {
              value: 150,
              density: {
                enable: true,
                value_area: 868.0624057955
              }
            },
            color: {
              value: "#000"
            },
            shape: {
              type: "circle",
              stroke: {
                width: 0,
                color: "#000000"
              },
              polygon: {
                nb_sides: 5
              }
            },
            opacity: {
              value: 0.5,
              random: true,
              anim: {
                enable: false,
                speed: 1,
                opacity_min: 0.1,
                sync: false
              }
            },
            size: {
              value: 3,
              random: true,
              anim: {
                enable: false,
                speed: 40,
                size_min: 0.1,
                sync: false
              }
            },
            line_linked: {
              enable: true,
              distance: 150,
              color: "#000",
              opacity: 0.4,
              width: 1
            },
            move: {
              enable: true,
              speed: 5,
              direction: "none",
              random: false,
              straight: false,
              out_mode: "out",
              bounce: false,
              attract: {
                enable: false,
                rotateX: 600,
                rotateY: 1200
              }
            }
          },
          interactivity: {
            detect_on: "canvas",
            events: {
              onhover: {
                enable: false,
                mode: "grab"
              },
              onclick: {
                enable: false,
                mode: "push"
              },
              resize: false
            },
            modes: {
              grab: {
                distance: 400,
                line_linked: {
                  opacity: 1
                }
              },
              bubble: {
                distance: 400,
                size: 40,
                duration: 2,
                opacity: 8,
                speed: 3
              },
              repulse: {
                distance: 200,
                duration: 0.4
              },
              push: {
                particles_nb: 4
              },
              remove: {
                particles_nb: 2
              }
            }
          },
          retina_detect: true
        }}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          maxHeight: "600px",
          zIndex: 1,
          left: 0
        }}
      />
      <img
        src="/cats.jpg"
        onError={e => {
          e.target.src = "//www.carlyzach.com/cats.jpg";
        }}
        className="img-fluid rounded"
        alt="cat pic"
        style={{
          maxHeight: "600px",
          border: "1px solid #ded8d8",
          WebkitFilter: "grayscale(100%)",
          filter: "grayscale(100%)"
        }}
      />
    </div>
  );
}
