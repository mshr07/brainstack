import { i } from "framer-motion/client";
import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";

const links = [
  {
    id: 1,
    name: "Home",
    url: "/",
    submenu: false,
    sublinks: [],
  },
  {
    id: 2,
    name: "Courses",
    url: "/courses",
    submenu: false,
    sublinks: [],
  },
  {
    id: 3,
    name: "About",
    url: "/about",
    submenu: false,
    sublinks: [],
  },
  {
    id: 4,
    name: "Testimonials",
    url: "/testimonials",
    submenu: false,
    sublinks: [],
  },
];
const NavLinks = ({ setOpen, open }) => {
  const [heading, setHeading] = useState("");
  return (
    <>
      {links.map((link) => (
        <div key={link.id}>
          {!open && (
            <div className="px-3 text-left md:cursor-pointer group">
              <h1
                className=" flex md:justify-between items-center  md:pr-0 pr-5 group text-secondaryWhite hover:text-primaryWhite"
                onClick={() => {
                  heading !== link.name
                    ? setHeading(link.name)
                    : setHeading("");
                  setOpen(false);
                }}
              >
                <NavLink
                  to={link.url}
                  className={({ isActive }) =>
                    `relative ${
                      isActive ? "text-primaryWhite" : "text-secondaryWhite"
                    } `
                  }
                >
                  {link.name}
                  <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-white transition-all duration-300 group-hover:w-full"></span>
                </NavLink>
              </h1>
            </div>
          )}

          {/* Mobile Nav */}
          {open && (
            <div className="px-3 text-left md:cursor-pointer group py-4">
              <h1
                className=" flex md:justify-between items-center text-lg md:pr-0 pr-5 group text-secondaryWhite hover:text-primaryWhite"
                onClick={() => {
                  heading !== link.name
                    ? setHeading(link.name)
                    : setHeading("");
                  setOpen(false);
                }}
              >
                <NavLink
                  to={link.url}
                  className={({ isActive }) =>
                    `relative ${
                      isActive ? "text-primaryWhite" : "text-secondaryWhite"
                    } `
                  }
                >
                  {link.name}
                  <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-white transition-all duration-300 group-hover:w-full"></span>
                </NavLink>
              </h1>
            </div>
          )}
        </div>
      ))}
    </>
  );
};

export default NavLinks;
