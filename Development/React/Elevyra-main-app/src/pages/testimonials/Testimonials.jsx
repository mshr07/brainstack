import React, { useEffect } from "react";
import TestimonialTile from "../../components/TestimonialTile";

const TestimonialsDetails = [
  {
    id: 1,
    name: "Srinu L",
    comment:
      "Your friendly way of teaching, clear explanations and deep knowledge have made learning so much easier for and boosted my confidence. Thank you for being such an amazing trainer and mentor!",
    company: "associate engineer, Milestone technologies",
  },
  {
    id: 2,
    name: "Dharmasoth Vighneswar",
    comment:
      "I completed a 9 months of SQL and Java training. The curriculum covered key concepts, from SQL design to java. Their clear explanation and supportive nature made complex topics easier to grasp. Overall, it was an excellent experience.and the training period with them was very friendly and the methods they teach to solve the complex issues was preety cool and innovative.And I designed a basic SQL  project with his instructions in that time I learned alot about SQL.",
    company: "ASSOCIATE CONSOLATANT, ADAPS DIGITALE",
  },
  {
    id: 3,
    name: "Gulla Abhishek Chowdary",
    comment:
      "They are really friendly and has a great way of explaining things. Whenever they introduces a topic, they starts by giving background on where it comes from, which helps us understand it better. They also shares real-life work examples and even some inspiring stories. They focuses on what we actually need to know, making everything clear and to the point",
    company: "Integration developer, Techy geek hub",
  },
];

const Testimonials = () => {
  useEffect(()=>{
    window.scrollTo(0,0)
  },[])

  return (
    <div className="bg-primaryWhite  mx-auto flex flex-wrap max-w-7xl">
      <section className="hero-bg bg-primaryWhite pb-6 ">
        <div className="hero flex flex-col justify-center px-2 sm:px-8 md:px-28 bg-primary text-primary shadow-lg shadow-primaryGray">
          <h1 className="relative py-4 z-10 text-xl sm:text-2xl md:text-3xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-800  text-center font-sans font-bold">
            Hear from Those Who Elevated with Us
          </h1>
          <p className=" text-center text-primaryWhite text-md sm:text-lg md:text-xl px-10 ">
            Discover how Elevyra has transformed careers and boosted confidence!
            Read real stories from our learners who mastered in-demand tech
            skills, built exciting projects, and achieved their career goals.
          </p>
        </div>
      </section>

      <div className="px-10 py-10 w-full flex flex-col items-center gap-6 justify-center">
        {TestimonialsDetails.map((item) => (
          <TestimonialTile testimonialData={item} key={item.id} />
        ))}
      </div>
    </div>
  );
};

export default Testimonials;
