import React, { useRef, useEffect, useState } from "react";
import { useScroll, useTransform, motion } from "framer-motion";

export const ContainerScroll = ({ titleComponent, children }) => {

  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 640);
    };
    const checkTablet = () =>{
      setIsTablet(window.innerWidth <= 1000)
    }
    checkMobile();
    checkTablet();
    window.addEventListener("resize", checkMobile);
    window.addEventListener("resize", checkTablet);
    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("resize", checkTablet);
    };
  }, [window.innerWidth]);

  const scaleDimensions = () => (isMobile ? [0.95, 1] : [0.85, 0.9]);

  const rotate = useTransform(scrollYProgress, [0, 1], isTablet ? isMobile ? [0,0] : [20, -10] : [40, -20]);
  const scale = useTransform(scrollYProgress, [0, 0.5], scaleDimensions());
  const translate = useTransform(scrollYProgress, [0, 0.5],  isTablet ? isMobile ? [0, -30]: [0, -20] : [0, -15]);

  return (
    <div
      className=" lg:pt-48 lg:h-[55rem] flex items-center justify-center relative p-2 md:p-20"
      ref={containerRef}
    >
      <div
        className=" w-full relative"
        style={{ perspective: "8000px" }}
      >
        <Header translate={translate} titleComponent={titleComponent} />
        <Card
        className="border-0"
        rotate={rotate} translate={translate} scale={scale}>
          {children}
        </Card>
      </div>
    </div>
  );
};

export const Header = ({ translate, titleComponent }) => (
  <motion.div
    style={{ translateY: translate }}
    className="max-w-5xl mx-auto text-center"
  >
    {titleComponent}
  </motion.div>
);

export const Card = ({ rotate, scale, children }) => (
  <motion.div
    style={{
      rotateX: rotate,
      scale
    }}
    className="max-w-6xl -mt-12 mx-auto h-full  w-full p-2 md:p-3 bg-[#222222] rounded-[20px] shadow-2xl"
  >
    <div className="h-full w-full overflow-hidden rounded-2xl bg-primaryGray md:rounded-2xl md:p-4">
      {children}
    </div>
  </motion.div>
);
