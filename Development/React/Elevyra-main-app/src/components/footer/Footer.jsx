import React from "react";
import { Link } from "react-router-dom";
import { FaWhatsapp } from "react-icons/fa";
import { IoLogoInstagram } from "react-icons/io5";
import { IoIosMailOpen } from "react-icons/io";

const Footer = () => {
  return (
    <div className="relative overflow-hidden md:h-[45vh] bg-primaryGray md:bg-transparent ">
      
      {/* Adjust height as needed */}
      <div className="hidden md:block ">
        <svg
          width="100vw"
          height=""
          id="svg"
          viewBox="-100 200 1700 200"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute top-0 left-0 z-0 transition duration-300 ease-in-out delay-150"
        >
          <style>
            {`
            .path-0 {
              animation: pathAnim-0 6s;
              animation-timing-function: linear;
              animation-iteration-count: infinite;
            }
            @keyframes pathAnim-0 {
              0% {
                d: path("M 0,500 L 0,187 C 177.46666666666664,227.8 354.9333333333333,268.6 529,270 C 703.0666666666667,271.4 873.7333333333333,233.39999999999998 1025,213 C 1176.2666666666667,192.60000000000002 1308.1333333333332,189.8 1440,187 L 1440,500 L 0,500 Z");
              }
              25% {
                d: path("M 0,500 L 0,187 C 177.06666666666666,189 354.1333333333333,191 524,199 C 693.8666666666667,207 856.5333333333333,221 1008,220 C 1159.4666666666667,219 1299.7333333333333,203 1440,187 L 1440,500 L 0,500 Z");
              }
              50% {
                d: path("M 0,500 L 0,187 C 154.13333333333333,159.13333333333333 308.26666666666665,131.26666666666668 461,140 C 613.7333333333333,148.73333333333332 765.0666666666668,194.06666666666666 928,208 C 1090.9333333333332,221.93333333333334 1265.4666666666667,204.46666666666667 1440,187 L 1440,500 L 0,500 Z");
              }
              75% {
                d: path("M 0,500 L 0,187 C 160,178.06666666666666 320,169.13333333333335 472,155 C 624,140.86666666666665 768,121.53333333333333 928,126 C 1088,130.46666666666667 1264,158.73333333333335 1440,187 L 1440,500 L 0,500 Z");
              }
              100% {
                d: path("M 0,500 L 0,187 C 177.46666666666664,227.8 354.9333333333333,268.6 529,270 C 703.0666666666667,271.4 873.7333333333333,233.39999999999998 1025,213 C 1176.2666666666667,192.60000000000002 1308.1333333333332,189.8 1440,187 L 1440,500 L 0,500 Z");
              }
            }
          `}
          </style>
          <defs>
            <linearGradient id="gradient" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="5%" stopColor="#1E1D1C"></stop>
              <stop offset="95%" stopColor="#101010"></stop>
            </linearGradient>
          </defs>
          <path
            d="M 0,500 L 0,180 C 13.46666666666664,227.8 354.9333333333333,268.6 529,270 C 703.0666666666667,271.4 873.7333333333333,233.39999999999998 1025,213 C 1176.2666666666667,192.60000000000002 1308.1333333333332,189.8 1440,187 L 1440,500 L 0,500 Z"
            stroke="none"
            strokeWidth="0"
            fill="url(#gradient)"
            fillOpacity="1"
            className="transition-all duration-300 ease-in-out delay-150 path-0"
          ></path>
        </svg>
      </div>
      <footer className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 p-5 justify-items-center relative z-10">
        <ul className="text-center my-6 md:my-2 max-w-7xl">
          <li className="font-light text-secondaryWhite tracking-wide mb-2">
            Pages
          </li>
          <li>
            <Link to="/" state={{ homeId: "homeID" }} >
              Home
            </Link>
          </li>
          <li>
            <Link to="/courses" state={{ courseId: "course0" }}>
              Courses
            </Link>
          </li>
          <li>
            <Link to="/about">About</Link>
          </li>
          <li>
            <Link to="/testimonials">Testimonials</Link>
          </li>
        </ul>
        <ul className="text-center my-6 md:my-0">
          <li className="font-light text-secondaryWhite tracking-wide mb-2">
            Courses
          </li>
          <li>
            <Link to="/courses" state={{ courseId: "course1" }}>
              Placement Course
            </Link>
          </li>
          <li>
            <Link to="/courses" state={{ courseId: "course2" }}>
              Java Full Stack
            </Link>
          </li>
          <li>
            <Link to="/courses" state={{ courseId: "course3" }}>
              Python Full Stack
            </Link>
          </li>
          <li>
            <Link to="/courses" state={{ courseId: "course4" }}>
              MERN
            </Link>
          </li>
        </ul>
        <ul className="text-center my-6 md:my-2">
          <li className="font-light text-secondaryWhite tracking-wide mb-2">
            Let's Connect
          </li>
          <li>
            <Link className="flex items-center gap-1">+91 9059909333</Link>
          </li>
          <li className="flex gap-3 my-2">
            <a href="https://wa.me/message/U4LIOWC5SVM7G1" target="blank">
              <FaWhatsapp className="size-6" />
            </a>
            <a href="mailto:elevyralearning@gmail.com" target="blank">
              <IoIosMailOpen className="size-6" />
            </a>
            <a
              href="https://www.instagram.com/elevyra_learning/profilecard/?igsh=azNjbWo2M3NrdW1y"
              target="blank"
            >
              <IoLogoInstagram className="size-6" />
            </a>
          </li>
        </ul>
      </footer>
    </div>
  );
};

export default Footer;
