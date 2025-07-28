import React from "react";

const Hero = () => {
  return (
    <div className=" py-6 mb-4">
      <div className="hero flex flex-col justify-center px-2 sm:px-8 md:px-28 shadow-lg shadow-primaryGray">
        <h1 className="relative md:py-4 text-3xl sm:text-3xl md:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-600  text-center font-sans font-bold">
        Elevyra  
        </h1>
        <h6 className="relative  md:pb-4 lg:pb-6 z-10 text-xl sm:text-2xl md:text-5xl bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-600  text-center font-sans font-bold">
        Elevate your learning
        </h6>
        <p className="text-primaryWhite text-center text-md sm:text-lg md:text-xl px-4 sm:px-8 tracking-tight">
          Your gateway to personalized learning. Get one-on-one training with
          expert instructors, tailored lessons, and flexible schedules. Elevate
          your skills and achieve your goals with us.
        </p>
      </div>
    </div>
  );
};

export default Hero;
