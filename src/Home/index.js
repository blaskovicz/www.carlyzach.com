import React from "react";
import Particles from "react-particles-js";
export default function() {
  return (
    <div className="text-center">
      <h2
        style={{
          position: "absolute",
          left: 0,
          zIndex: 1,
          width: "50%",
          padding: "5px",
          border: "2px solid rgba(255, 255, 255, 0.28)",
          borderRadius: "25px",
          lineHeight: "15pt",
          fontSize: "17pt",
          color: "#fff",
          margin: "10px",
          background: "#00000054"
        }}
      >
        Welcome.{" "}
        <small>
          Check out some of my other pages to access useful tools like a code
          sandbox, markdown converter, and more.
        </small>
      </h2>
      <Particles
        params={{
          particles: {
            number: {
              value: 200,
              density: {
                enable: true,
                value_area: 1262.6362266116362
              }
            },
            color: {
              value: "#0957e6"
            },
            shape: {
              type: "circle",
              stroke: {
                width: 0,
                color: "#000000"
              },
              polygon: {
                nb_sides: 5
              },
              image: {
                src: "img/github.svg",
                width: 100,
                height: 100
              }
            },
            opacity: {
              value: 0.5,
              random: false,
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
              distance: 110.48066982851817,
              color: "#070906",
              opacity: 0.3787908679834909,
              width: 1.1048066982851816
            },
            move: {
              enable: true,
              speed: 6,
              direction: "top-right",
              random: true,
              straight: false,
              out_mode: "out",
              bounce: false,
              attract: {
                enable: false,
                rotateX: 1262.6362266116362,
                rotateY: 1200
              }
            }
          },
          interactivity: {
            detect_on: "canvas",
            events: {
              onhover: {
                enable: true,
                mode: "repulse"
              },
              onclick: {
                enable: true,
                mode: "push"
              },
              resize: true
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
          backgroundColor: "rgb(0, 0, 0)",
          backgroundImage: "url(//www.carlyzach.com/cats.jpg)",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "50% 50%",
          position: "absolute",
          left: 0,
          // filter: "grayscale(100%)",
          width: "100%",
          height: "100%"
        }}
      />
    </div>
  );
}
