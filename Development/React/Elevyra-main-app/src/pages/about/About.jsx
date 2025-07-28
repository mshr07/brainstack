import React, { useEffect } from "react";

const About = () => {
  useEffect(()=>{
    window.scrollTo(0,0)
  },[])
  return (
    <div className="max-w-7xl mx-auto">
      <section className="hero-bg bg-primaryWhite pb-6 " id="about">
        <div className="hero flex flex-col justify-center px-2 sm:px-8 md:px-28 bg-primary text-primary shadow-lg shadow-primaryGray">
          <h1 className="relative py-4 z-10 text-xl sm:text-2xl md:text-3xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-neutral-100 to-neutral-800  text-center font-sans font-bold">
            Transforming Learning, Elevating Your Tech Career
          </h1>
          <p className=" text-center text-primaryWhite text-md sm:text-lg md:text-xl px-10 ">
            Empowering future tech leaders through hands-on, industry-focused
            courses in software development, data analysis, and full-stack
            engineering. Learn real-world skills and elevate your career with
            Elevyra.
          </p>
        </div>
      </section>

      <section className="bg-primaryWhite text-primary px-4 md:px-16 mx-auto py-10 leading-5">
        <p className="py-4 font-bold text-center">
          At Elevyra, we believe in transforming lives through accessible,
          high-quality tech education. Our mission is to empower learners with
          the skills they need to excel in the fast-paced world of technology.
          Whether you're aiming to become a software developer, data analyst, or
          full-stack engineer, we provide courses that are designed to build
          strong foundations and develop advanced technical expertise. 
        </p>
        <div className="my-4">
          <h1 className="text-xl font-bold">Our Vision</h1>
          <p>
            To bridge the gap between traditional education and industry
            requirements by offering courses that equip students with practical,
            in-demand skills. We focus on creating a learning environment that’s
            engaging, hands-on, and tailored to the evolving tech landscape.

            We are here to teach software technologies in such way that benefits everyone - from beginner
            with no programming experience to those with advanced skills looking to deepen their knowledge
            
          </p>
        </div>
        <div className="my-4">
          <h1 className="text-xl font-bold">Why Choose Elevyra?</h1>
          <p>
            <strong> Industry-Relevant Curriculum:</strong> Our courses are carefully crafted by
            industry experts to cover essential tools and technologies like
            Java, Python, JavaScript, and the MERN stack. We ensure every
            learner gains real-world skills that are highly sought after by
            employers.
          </p>
          <p>
            <strong> Hands-On Learning:</strong> With practical projects, coding challenges, and
            interactive sessions, you don’t just learn; you build and apply your
            knowledge.
          </p>
          <p>
            <strong> Career-Driven Courses:</strong> From DSA training to mock interviews, our
            programs are tailored to prepare you for interviews at top
            product-based companies.
          </p>
          <p>
            <strong> Working professionals as Faculty : </strong> Our faculty 
            consist of working professionals who bring real-world experience, 
            helping you learn and apply knowledge like a true software engineer.
          </p>
          <p>
            <strong> Real time support even after course : </strong> At Elevyra, we are building a 
            community, we’re a community of learners, mentors, and industry experts who are passionate
             about growth and innovation, rather than just a course. We are here to support you even 
             after the course is finished.

          </p>
        </div>

        <div className="my-4">
          <h1 className="text-xl font-bold">Join Our Community</h1>
          <p>
            At Elevyra, we’re not just an e-learning platform; we’re a community
            of learners, mentors, and industry experts who are passionate about
            growth and innovation. With Elevyra, you have the support, guidance,
            and resources to achieve your career goals and transform your
            future.
          </p>
        </div>
      </section>
    </div>
  );
};

export default About;
