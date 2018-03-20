import React from "react";
export default function() {
  return (
    <div
      style={{
        backgroundRepeat: "no-repeat",
        backgroundSize: "100% 100%",
        backgroundImage: `url("https://www.carlyzach.com/cats.jpg")`,
        maxHeight: "100%",
        width: "610px",
        height: "814px",
        margin: "auto",
        padding: "0",
        borderRadius: "10px",
        border: "1px solid  #ded8d8",
        "-webkit-filter": "grayscale(100%)",
        filter: "grayscale(100%)"
      }}
    >
      <p className="pl-2">Hello there.</p>
    </div>
  );
}
