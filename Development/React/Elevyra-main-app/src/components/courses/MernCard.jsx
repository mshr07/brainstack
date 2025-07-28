import React from "react";
import { MouseEnterProvider } from "../../components/ui/3d-Card";
import { CardContainer, CardBody, CardItem } from "../../components/ui/3d-Card";
import mernImg from "../../assets/mern.png";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export function MernCard() {
  const navigate = useNavigate();

  const handleRegister = (course) => {
    navigate("/register", { state: { selectedCourse: course } });
  }

  return (
    <MouseEnterProvider>
      
        <CardContainer className=" flex flex-col text-primaryWhite ">
          <CardBody className=" relative group/card w-auto sm:w-[30rem] md:w-full h-auto rounded-xl p-2   ">
            <div className="flex flex-col sm:flex-row justify-between items-center w-full">
              <img
                src={mernImg}
                className="hidden lg:block w-40 lg:w-2/4 max-w-96 object-cover rounded-xl"
                alt="thumbnail"
              />

              <CardBody className="mediumFont flex flex-col justify-center gap-2 w-full text-sm sm:text-lg lg:text-xl leading-4 ">
                <CardItem translateZ="50" className=" sm:leading-6 font-bold  ">
                  Learn to build complete Full Stack projects using the MERN
                  stack, with practical hands-on experience.
                </CardItem>
                <CardItem

                  translateZ="60"
                  className="  mt-2 "
                >
                  <ul className=" px-4 pt-1 text-primaryWhite">
                    <li className="list-disc">
                      <strong>Web Development Fundamentals:</strong>
                      HTML, CSS, JavaScript (ES6+)
                    </li>
                    <li className="list-disc">
                      <strong>Frontend Development: </strong> React, Hooks,
                      Redux
                    </li>
                    <li className="list-disc">
                      <strong>Backend Development:</strong> Express.js, Node.js
                    </li>
                    <li className="list-disc">
                      <strong>Databases:</strong> MongoDB, PostgreSQL. MySQL
                    </li>
                    <li className="list-disc">
                      <strong>Full Stack Projects:</strong> Portfolio Project,
                      E-commerce Project
                    </li>
                    <li className="list-disc">
                      <strong>SDLC and Performance Optimization</strong>
                    </li>
                  </ul>
                </CardItem>

                <div className="flex justify-evenly items-center mt-2 mb-4">
                <Link to="/courses" state={{ courseId: "course4" }}>
                  <CardItem
                    translateZ={20}

                    as="button"
                    className="px-6 mt-1 py-2 mx-auto rounded-xl bg-black text-white text-sm md:text-xl font-bold "
                  >
                    More Details
                  </CardItem>
                </Link>

                <div>

                  <CardItem
                    onClick={()=>handleRegister("MERN")}
                    translateZ={20}
                    as="button"
                    className="px-6 mt-1 py-2 mx-auto rounded-xl bg-white text-black text-sm md:text-xl font-bold"
                    >
                    Register Now
                  </CardItem>
                </div>
                
              </div>
              </CardBody>
            </div>
          </CardBody>
        </CardContainer>
      
    </MouseEnterProvider>
  );
}
