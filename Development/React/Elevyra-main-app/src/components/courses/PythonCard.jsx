import React from "react";
import { MouseEnterProvider } from "../../components/ui/3d-Card";
import { CardContainer, CardBody, CardItem } from "../../components/ui/3d-Card";
import pythonImg from "../../assets/python.png";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export function PythonCard() {
  const navigate = useNavigate();

  const handleRegister = (course) => {
    navigate("/register", { state: { selectedCourse: course } });
  };
  return (
    <MouseEnterProvider>
      <CardContainer className=" flex flex-col text-primaryWhite sm:p-10 ">
        <CardBody className=" relative group/card w-full h-auto rounded-xl ">
          <div className="flex justify-between items-center">
            <img
              src={pythonImg}
              className="hidden lg:block w-40 lg:w-2/4 max-w-96 object-cover rounded-xl "
              alt="thumbnail"
            />

            <CardBody className="mediumFont flex flex-col justify-center gap-4 text-sm sm:text-lg lg:text-xl leading-4">
              <CardItem
                translateZ="50"
                className=" sm:leading-6 font-bold px-2 "
              >
                Master the skills required to become a Full Stack Python
                Developer or Data Analyst, with hands-on projects and essential
                tools.
              </CardItem>
              <CardItem translateZ="60" className="  ">
                <ul className="px-4  text-primaryWhite ">
                  <li className="list-disc">
                    <strong>Full Stack Python Development</strong> Basics of
                    python programming, data structures, and algorithms,
                    including object-oriented programming, file input/output,
                    and exception handling and more.
                  </li>
                  <li className="list-disc">
                    <strong>Data Analysis:</strong>Using Django, NumPy, Seaborn,
                    and Regression techniques
                  </li>
                  <li className="list-disc">
                    <strong>Practical Experience:</strong> 2 Projects to apply
                    your skills
                  </li>
                  <li className="list-disc">
                    <strong>DSA Practice:</strong> 150+ Data Structures and
                    Algorithms Questions
                  </li>
                  <li className="list-disc">
                    <strong>Web Development:</strong> HTML, CSS, JavaScript
                  </li>
                  <li className="list-disc">
                    <strong>Python FrameWorks:</strong> Django, Flask and more
                  </li>
                </ul>
              </CardItem>

              <div className="flex justify-evenly items-center mt-2 mb-4">
                <Link to="/courses" state={{ courseId: "course3" }}>
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
                    onClick={() => handleRegister("Python Full Stack")}
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
