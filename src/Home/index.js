import React from "react";
export default function() {
  return (
    <div className="text-center">
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
