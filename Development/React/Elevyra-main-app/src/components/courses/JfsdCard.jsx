import React from "react";
import { MouseEnterProvider } from "../../components/ui/3d-Card";
import { CardContainer, CardBody, CardItem } from "../../components/ui/3d-Card";
import javaImg from "../../assets/java.png";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export function JfsdCard() {
  const navigate = useNavigate();

  const handleRegister = (course) => {
    navigate("/register", { state: { selectedCourse: course } });
  }

  return (
    <MouseEnterProvider>

        <CardContainer className=" flex flex-col">
          <CardBody className=" relative group/card w-auto sm:w-[30rem] md:w-full  h-auto rounded-xl p-2 ">
            <div className="flex flex-col sm:flex-row justify-between items-center text-primaryWhite p-2">
              <img
                src={javaImg}
                className="hidden lg:block w-40 lg:w-2/4 object-cover rounded-xl "
                alt="thumbnail"
              />
              <CardBody className="mediumFont flex flex-col justify-center gap-2 w-full text-sm sm:text-lg lg:text-xl leading-4">
                <CardItem
                  translateZ="50"
                  className="leading:2 sm:leading-6 font-bold  "
                >
                  Become a skilled Java developer by mastering essential
                  programming concepts, advanced frameworks, and web development
                  basics.
                </CardItem>
                <CardItem
                  
                  translateZ="60"
                  className=" mt-2 "
                >
                  <ul className=" px-4 pt-1 text-primaryWhite">
                    <li className="list-disc">
                      <strong>Java Programming + DSA</strong>
                    </li>
                    <li className="list-disc">
                      <strong>Core Java:</strong>OOP, Exception Handling,
                      Multithreading, and more
                    </li>
                    <li className="list-disc">
                      <strong>Advanced Java:</strong> Streams API, Spring,
                      Spring Boot, Hibernate, JPA, JDBC
                    </li>
                    <li className="list-disc">
                      <strong>Web Development:</strong> HTML, CSS, JavaScript
                    </li>
                    <li className="list-disc">
                      <strong>Web Services and Applications:</strong> Servlets,
                      Dependency Injections, Inversion of Control, RESTful APIs,
                      Microservices, and more
                    </li>
                    <li className="list-disc">
                      <strong>unit Testing:</strong> JUNIT, Mockito, TestNG
                    </li>
                    <li className="list-disc">
                      <strong>Version Control:</strong> Git
                    </li>
                  </ul>
                </CardItem>

                <div className="flex justify-evenly items-center mt-2 mb-4">
                <Link to="/courses" state={{ courseId: "course2" }}>
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
                    onClick={()=>handleRegister("Java Full Stack")}
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
