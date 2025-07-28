import React from "react";
import { ContainerScroll } from "./ui/ScrollContainerAnim";
import { JavaCard } from "./courses/JavaCard";
import { MernCard } from "./courses/MernCard";
import { PythonCard } from "./courses/PythonCard";
import { JfsdCard } from "./courses/JfsdCard";
import { Sparkle } from "./Sparkle";

export function HeroScroll({courseDetails}) {
  return (
    <div className="flex flex-col h-full py-4 ">
      <ContainerScroll
        titleComponent={
          <div className="py-4 sm:py-2 md:py-0 ">
          <Sparkle text={courseDetails.title} />
          </div>
        }
      >
        {
          courseDetails.name === "java" ? <JavaCard  /> : ""
        }
        {
          courseDetails.name === "jfsd" ? <JfsdCard /> : ""
        }
        {
          courseDetails.name === "python" ? <PythonCard /> : ""
        }
        {
          courseDetails.name === "mern" ? <MernCard /> : ""
        }
        
      </ContainerScroll>
    </div>
  );
}
