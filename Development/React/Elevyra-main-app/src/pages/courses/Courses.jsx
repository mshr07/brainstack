import React, { useEffect, useRef } from "react";
import placementImg from "../../assets/placement.png";
import jfsdImg from "../../assets/java.png";
import pythonImg from "../../assets/python.png";
import mernImg from "../../assets/mern.png";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Sparkle } from "../../components/Sparkle";

const Courses = () => {
  const location = useLocation();
  const courseId = location.state?.courseId;

  const courseRefs = {
    course0: useRef(null),
    course1: useRef(null),
    course2: useRef(null),
    course3: useRef(null),
    course4: useRef(null),
  };

  useEffect(() => {
    if (courseId && courseRefs[courseId]?.current) {
      courseRefs[courseId].current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [courseId]);

  const navigate = useNavigate();

  const handleRegister = (course) => {
    navigate("/register", { state: { selectedCourse: course } });
  };

  return (
    <div className="max-w-7xl mx-auto">
      <section className=" mb-10 " ref={courseRefs.course0}>
        <div className="hero flex flex-col justify-center px-2 sm:px-8 md:px-28 bg-primary text-primary shadow-lg shadow-primaryGray">
          <h1 className="relative py-6 z-10 text-xl sm:text-2xl md:text-3xl lg:text-7xl  bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-500  text-center font-sans font-bold">
            Learn the trending courses with Elevyra
          </h1>
          <p className=" text-center text-primaryWhite text-md sm:text-lg md:text-xl px-10 ">
            Your gateway to personalized learning. Get one-on-one training with
            expert instructors, tailored lessons, and flexible schedules.
            Elevate your skills and achieve your goals with us.
          </p>
        </div>
      </section>

      {/* Courses */}
     

      {/* Placement course */}
      <section
        ref={courseRefs.course1}
        className=" w-full sm:w-5/6 mx-auto"
        id="java"
      >
        <Sparkle text="Placement Course" />
        <div className="grid grid-cols-1 lg:grid-cols-3 p-10">
          <div className="w-full text-sm md:text-lg col-span-2">
            <p className=" text-primaryWhite">
              Enhance your problem-solving skills and prepare for product-based
              company interviews with comprehensive Java, Core Computer Science
              Concepts and DSA training.
            </p>
            <ul className=" pl-4 pt-4 text-primaryWhite">
              <li className="list-disc">
                <strong>Master Technical Skills:</strong> Learn the fundamentals
                and advanced concepts such as Operating Systems, Computer
                Networking, Data Structures and Algorithms, Programming and
                DataBase Management System.
              </li>
              <li className="list-disc">
                <strong>Data Structures and Algorithms (DSA):</strong> We cover
                all the Data structures and algorithms that are commonly asked
                in product-based company interviews.<br></br>
                <b> Data Structures : </b> Arrays, Linked Lists, Stacks, Queues,
                Trees, Graphs, Hashing, Bit<br></br>
                <b> Algorithms : </b> Sorting, Searching, Greedy, Dynamic
                Programming, Backtracking, Bit Manipulation and more.<br></br>
                <b> Advanced data structures and algorithms : </b> Trie, Segment
                Tree, Suffix Tree, Suffix Array, Heap, Segment Tree, Fenwick
                Tree, etc.
              </li>
              <li className="list-disc">
                <strong>DataBase Management System:</strong> MYSQL, Oracle
              </li>
              <li className="list-disc">
                <strong>Extensive Practice:</strong> We help you solve around
                300+ Leetcode Questions and in other online platforms.
              </li>
              <li className="list-disc">
                <strong>Mock Tests and Interviews:</strong> Mock tests and
                Interviews will be conducted every week to ensure you are well
                prepared for the real interview by product based company
                Software engineers.
              </li>
              <li className="list-disc">
                <strong>Special Classes:</strong> For Communication and Aptitude
                rounds we have industry experts who will guide you through the
                process.
              </li>
            </ul>
            <div className="flex justify-between  items-center px-4">
              <div className="block lg:hidden">
                <img src={placementImg} alt="" className="w-20 sm:w-28" />
              </div>
              <div className="hidden lg:block">
                <button
                  onClick={() => handleRegister("Placement Course")}
                  className="button-1"
                >
                  Register Now
                </button>
              </div>
              <div className="py-6 flex flex-col-reverse items-end justify-end">
                <span className=" text-3xl text-primaryWhite font-bold">
                  ₹7999{" "}
                </span>
                <span className="text-secondaryWhite line-through">₹12999</span>
              </div>
            </div>
            <div className="lg:hidden w-full sm:max-w-sm mx-auto flex justify-center">
              <button
                onClick={() => handleRegister("Placement Course")}
                className="px-6 w-full mt-1 py-2 mx-auto rounded-xl bg-white text-black text-sm md:text-xl font-bold"
              >
                Register Now
              </button>
            </div>
          </div>
          <div className=" hidden lg:flex justify-center items-center">
            <img src={placementImg} alt="" />
          </div>
        </div>
      </section>

      {/* JFSD */}
      <section
        ref={courseRefs.course2}
        className="w-full md:w-5/6 mx-auto"
        id="jfsd"
      >
        <Sparkle text="Java Full Stack" />

        <div className="grid grid-cols-1 lg:grid-cols-3 p-10">
          <div className="w-full text-sm md:text-lg col-span-2">
            <p className=" text-primaryWhite">
              Become a skilled Java developer by mastering essential programming
              concepts, advanced frameworks, and web development basics.
            </p>
            <ul className=" pl-4 pt-4">
              <li className="list-disc">
                <strong>Java Programming + DSA</strong>: Java, Data Structures
                and Algorithms, Java
              </li>
              <li className="list-disc">
                <strong>Core Java:</strong> OOP, Exception Handling,
                Multithreading, and more
              </li>
              <li className="list-disc">
                <strong>Advanced Java:</strong> Streams APIs, Collections
                FrameWork, Spring, Spring Boot, Hibernate, JPA, JDBC, and more
              </li>
              <li className="list-disc">
                <strong>Version Control:</strong> Git
              </li>
              <li className="list-disc">
                <strong>DataBase Management System:</strong> MYSQL, Oracle
              </li>
              <li className="list-disc">
                <strong>Unit Testing:</strong> JUNIT, Mockito, TestNG
              </li>
              <li className="list-disc">
                <strong>Web Development:</strong> HTML, CSS, JavaScript
              </li>
              <li className="list-disc">
                <strong>Web Applications and Services:</strong> Servlets,
                Dependency Injections, RESTful APIs, Microservices, Inversion of
                Control and more.
              </li>
              <li className="list-disc">
                <strong>Extensive Practice:</strong> We help you solve around
                100+ Leetcode Questions and in other online platform.
              </li>
              <li className="list-disc">
                <strong>Practical Experience:</strong> You will be working on 2
                Projects to apply your skills in real-world scenarios.
              </li>
              <li className="list-disc">
                <strong>Mock Tests and Interviews:</strong> Mock tests and
                Interviews will be conducted every week to ensure you are well
                prepared for the real interview by product based company
                Software engineers.
              </li>
              <li className="list-disc">
                <strong>Special Classes:</strong> For Communication and Aptitude
                rounds we have industry experts who will guide you through the
                process.
              </li>
            </ul>
            <div className="flex justify-between  items-center px-2">
              <div className="block lg:hidden">
                <img src={jfsdImg} alt="" className="w-14 sm:w-20" />
              </div>
              <div className="hidden lg:block">
                <button
                  onClick={() => handleRegister("Java Full Stack")}
                  className="button-1"
                >
                  Register Now
                </button>
              </div>
              <div className="py-6 flex flex-col-reverse items-end justify-end">
                <span className=" text-3xl text-primaryWhite font-bold">
                  ₹9999{" "}
                </span>
                <span className="text-secondaryWhite line-through">₹14999</span>
              </div>
            </div>
          </div>
          <div className="lg:hidden w-full sm:max-w-sm mx-auto flex justify-center">
            <button
              onClick={() => handleRegister("Java Full Stack")}
              className="px-6 w-full mt-1 py-2 mx-auto rounded-xl bg-white text-black text-sm md:text-xl font-bold"
            >
              Register Now
            </button>
          </div>
          <div className="hidden lg:flex justify-center items-center">
            <img src={jfsdImg} alt="" />
          </div>
        </div>
      </section>

      {/* PYTHON */}
      <section
        ref={courseRefs.course3}
        className="w-full md:w-5/6 mx-auto "
        id="python"
      >
        <Sparkle text="Python Full Stack" />

        <div className="grid grid-cols-1 lg:grid-cols-3 p-10">
          <div className="w-full text-sm md:text-lg col-span-2">
            <p className=" text-primaryWhite">
              Master the skills required to become a Full Stack Python Developer
              and Data Analyst, with hands-on projects and essential tools.
            </p>
            <ul className=" pl-4 pt-4">
              <li className="list-disc">
                <strong>Basics of Python Programming:</strong> Learn the
                fundamentals of Python programming
              </li>
              <li className="list-disc">
                <strong>Advance topics in Python</strong> Regular expressions,
                modules, decorators, generators, and more.
              </li>
              <li className="list-disc">
                <strong>Data Analysis:</strong> Using Django, NumPy, Seaborn,
                and Regression techniques you will learn to analyze data and
                visualize it using different tools and libraries.
              </li>
              <li className="list-disc">
                <strong>Web Development:</strong> HTML, CSS, JavaScript
              </li>
              <li className="list-disc">
                <strong>Python FrameWorks:</strong> Django, Flask and more
              </li>
              <li className="list-disc">
                <strong>Practical Experience:</strong> In this course you will
                be working on 2 Projects to apply your skills one using Django
                and the other using Data analysis libraries.
              </li>
              <li className="list-disc">
                <strong>DSA Practice:</strong> We help you solve 100+ Data
                Structures and Algorithms Questions
              </li>
              <li className="list-disc">
                <strong>DataBase Management System:</strong> MYSQL, Oracle
              </li>
              <li className="list-disc">
                <strong>Extensive Practice:</strong> We help you solve around
                100+ Leetcode Questions and in other online platforms.
              </li>
              <li className="list-disc">
                <strong>Mock Tests and Interviews:</strong> Mock tests and
                Interviews will be conducted every week to ensure you are well
                prepared for the real interview by product based company
                Software engineers.
              </li>
              <li className="list-disc">
                <strong>Special Classes:</strong> For Communication and Aptitude
                rounds we have industry experts who will guide you through the
                process.
              </li>
            </ul>
            <div className="flex justify-between items-center px-2">
              <div className="block lg:hidden">
                <img src={pythonImg} alt="python" className="w-16 md:w-20" />
              </div>
              <div className="hidden lg:block">
                <button
                  onClick={() => handleRegister("Python Full Stack")}
                  className="button-1"
                >
                  Register Now
                </button>
              </div>
              <div className="py-6 flex flex-col-reverse items-end justify-end">
                <span className=" text-3xl text-primaryWhite font-bold">
                  ₹8999{" "}
                </span>
                <span className="text-secondaryWhite line-through">₹12999</span>
              </div>
            </div>
          </div>
          <div className="lg:hidden w-full sm:max-w-sm mx-auto flex justify-center">
            <button
              onClick={() => handleRegister("Python Full Stack")}
              className="px-6 w-full mt-1 py-2 mx-auto rounded-xl bg-white text-black text-sm md:text-xl font-bold"
            >
              Register Now
            </button>
          </div>
          <div className="hidden lg:flex justify-center items-center px-16">
            <img src={pythonImg} alt="python" />
          </div>
        </div>
      </section>

      {/* MERN */}
      <section ref={courseRefs.course4} className="w-full md:w-5/6 mx-auto">
        <Sparkle text="MERN" />
        <div className="grid grid-cols-1 lg:grid-cols-3 p-10">
          <div className="w-full text-sm md:text-lg col-span-2">
            <p className=" text-primaryWhite">
              Learn to build complete Full Stack projects using the MERN stack,
              with practical hands-on experience.
            </p>
            <ul className=" pl-4 pt-4">
              <li className="list-disc">
                <strong>Web Development Fundamentals: </strong>
                HTML, CSS, JavaScript (ES6+)
              </li>
              <li className="list-disc">
                <strong>Frontend Development:</strong> We cover the Complete
                React development using React Hooks, Context API, Redux, and
                React Router.
              </li>
              <li className="list-disc">
                <strong>Backend Development:</strong> Express.js, Node.js
              </li>
              <li className="list-disc">
                <strong>Databases:</strong> MongoDB, PostgreSQL, MySQL
              </li>
              <li className="list-disc">
                <strong>Full Stack Projects:</strong> You will be building your
                very own Portfolio Website as a poject and an E-commerce Project
                which will be deployed and available online which helps enchance
                your skills as a full stack developer.
              </li>
              <li className="list-disc">
                <strong>Special Classes:</strong> For Communication and Aptitude
                rounds we have industry experts who will guide you through the
                process.
              </li>
              <li className="list-disc">
                <strong>Extensive Practice:</strong> We help you solve around
                100+ Leetcode Questions and in other online platforms.
              </li>
              <li className="list-disc">
                <strong>Mock Tests and Interviews:</strong> Mock tests and
                Interviews will be conducted every week to ensure you are well
                prepared for the real interview by product based company
                Software engineers.
              </li>
              <li className="list-disc">
                <strong>Special Classes:</strong> For Communication and Aptitude
                rounds we have industry experts who will guide you through the
                process.
              </li>
            </ul>
            <div className="flex justify-between items-center px-2">
              <div className="block lg:hidden">
                <img src={mernImg} alt="mern" className="w-20 sm:28" />
              </div>
              <div className="hidden lg:block">
                <button
                  onClick={() => handleRegister("MERN")}
                  className="button-1"
                  >
                  Register Now
                </button>
              </div>
              <div className="py-6 flex flex-col-reverse items-end justify-end">
                <span className=" text-3xl text-primaryWhite font-bold">
                  ₹8999{" "}
                </span>
                <span className="text-secondaryWhite line-through">₹12999</span>
              </div>
            </div>
          </div>
          <div className="lg:hidden w-full sm:max-w-sm mx-auto flex justify-center">
            <button
              onClick={() => handleRegister("MERN")}
              className="px-6 w-full mt-1 py-2 mx-auto rounded-xl bg-white text-black text-sm md:text-xl font-bold"
            >
              Register Now
            </button>
          </div>
          <div className="hidden lg:flex justify-center items-center">
            <img src={mernImg} alt="mern" />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Courses;
