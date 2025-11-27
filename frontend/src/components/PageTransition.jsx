import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const PageTransition = ({ children }) => {
  const location = useLocation();
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    setOpacity(0);
    const timer = setTimeout(() => {
      setOpacity(1);
    }, 50); // Small delay to trigger transition
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div
      style={{
        opacity: opacity,
        transition: "opacity 300ms ease-in-out",
        width: "100%",
      }}
    >
      {children}
    </div>
  );
};

export default PageTransition;
