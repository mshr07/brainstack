import React, { useEffect, useRef } from "react";
import { HeroScroll } from "../../components/ScrollContainer";
import Hero from "../../components/hero/Hero";
import Contact from "../../components/contact/Contact";
import { useLocation } from "react-router-dom";
import { AnimatedModalDemo } from "../../AnimModal";

const courses = [
  {
    id: 1,
    name: "java",
    title: "Placement course",
  },
  {
    id: 2,
    name: "jfsd",
    title: "Java Full Stack",
  },
  {
    id: 3,
    name: "python",
    title: "Python Full Stack",
  },
  {
    id: 4,
    name: "mern",
    title: "MERN Stack",
  },
];

const Home = () => {
  const location = useLocation();
  const homeId = location.state?.homeId;

  const courseRefs = {
    homeID: useRef(null),
  };

  useEffect(() => {
    if (homeId && courseRefs[homeId]?.current) {
      courseRefs[homeId].current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [homeId]);

  return (
    <div ref={courseRefs.homeID} className="px-4 max-w-7xl mx-auto">
      <Hero />
      {courses.map((course) => (
        <HeroScroll key={course.id} courseDetails={course} />
      ))}
      
      {/* <Contact /> */}
     
    </div>
  );
};

export default Home;
