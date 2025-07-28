import React from "react";
import { MouseEnterProvider } from "../../components/ui/3d-Card";
import { CardContainer, CardBody, CardItem } from "../../components/ui/3d-Card";
import javaImg from "../../assets/placement.png";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export function JavaCard() {
  const navigate = useNavigate();

  const handleRegister = (course) => {
    navigate("/register", { state: { selectedCourse: course } });
  }

  return (
    <MouseEnterProvider>

      <CardContainer className=" flex flex-col mt-2">
        <CardBody className=" relative group/card  w-full  h-full rounded-xl p-2  ">
          <div className=" flex flex-col sm:flex-row justify-between items-center w-full">
            <img
              src={javaImg}
              className=" hidden lg:block w-1/3 object-cover rounded-xl "
              alt="thumbnail java"
            />

            <CardBody className="mediumFont flex flex-col justify-center gap-2 w-full text-sm sm:text-lg lg:text-xl leading-4 sm:leading-6 ">
              <CardItem translateZ="50" className="font-bold  ">
                Enhance your problem-solving skills and prepare for
                product-based company interviews with comprehensive Java
                Programming, Core Computer Science Concepts, Data Structures and
                Algorithms, and more.
              </CardItem>
              <CardItem translateZ="60" className="  ">
                <ul className=" px-4 pt-1 text-primaryWhite ">
                  <li className="list-disc ">
                    <strong>Java Programming: </strong>Learn the fundamentals
                    and advanced concepts
                  </li>
                  <li className="list-disc ">
                    <strong>Data Structures and Algorithms (DSA):</strong>{" "}
                    Master DSA and Collections Framework
                  </li>
                  <li className="list-disc ">
                    <strong>Extensive Practice:</strong> 300+ Leetcode Questions
                  </li>
                  <li className="list-disc">
                    <strong>Master Technical Skills:</strong> Computer
                    Networking, Operating Systems, DataBase Management Systems
                    and more
                  </li>
                  <li className="list-disc">
                    <strong>Mock Tests and Interviews:</strong> Sharpen your
                    skills with practice and mock sessions from Industry
                    experts.
                  </li>
                </ul>
              </CardItem>

              <div className="flex justify-evenly items-center mt-2 mb-4">
                <Link to="/courses" state={{ courseId: "course1" }}>
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
                    onClick={()=>handleRegister("Placement Course")}
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
