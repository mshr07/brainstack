import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Logo from "../../assets/logo3.png";
import NavLinks from "./NavLinks.jsx";
import { RxHamburgerMenu, RxCross2 } from "react-icons/rx";
import { AnimatedModalDemo } from "../../AnimModal.jsx";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {};

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed md:static w-full z-[9999] transition-transform duration-300 bg-primary `}
    >
      <div className="flex items-center font-medium justify-around w-full">
        <div className="z-50 px-2 sm:px-4 p-1  md:p-3 md:w-auto w-full flex justify-between items-center ">
          <Link to="/">
            <img
              src={Logo}
              alt="logo"
              className="md:cursor-pointer h-16 rounded-sm"
            />
          </Link>
          <div className="text-3xl  md:hidden" onClick={() => setOpen(!open)}>
            {open ? <RxCross2 /> : <RxHamburgerMenu />}
          </div>
        </div>
        <ul className="md:flex hidden uppercase items-center gap-8 text-lg tracking-wide ">
          <NavLinks />
        </ul>

        {/* Mobile nav */}
        <ul
          className={`
        md:hidden bg-black fixed w-full top-0 overflow-y-auto bottom-0 pt-24 pl-4
        duration-500 ${open ? "left-0" : "left-[-100%]"}
        `}
        >
          <NavLinks open={open} setOpen={setOpen} />
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
