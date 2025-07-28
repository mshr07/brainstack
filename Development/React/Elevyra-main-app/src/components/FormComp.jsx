import React, { useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import { IoMdArrowDropdown } from "react-icons/io";
import Alert from "./Alert";
import useAlert from "./../hooks/useAlert";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const FormComp = () => {
  const formRef = useRef();
  const navigate = useNavigate();

  const location = useLocation();
  const { selectedCourse } = location.state || {};

  const [selected, setSelected] = useState(selectedCourse || "Select course");
  const [isOpen, setIsOpen] = useState(false);

  const options = [
    "Placement Course",
    "Java Full Stack",
    "Python Full Stack",
    "MERN",
  ];

  const handleSelect = (option) => {
    setSelected(option);
    setIsOpen(false);
  };

  const { alert, showAlert, hideAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });

  const handleChange = ({ target: { name, value } }) => {
    setForm({ ...form, [name]: value });
    if (name === "phone" && value.length === 10) setPhoneError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate phone number
    if (form.phone.length !== 10) {
      setPhoneError("Phone number must be 10 digits.");
      setLoading(false);
      return;
    }

    if (selected === "Select course") {
      showAlert({
        show: true,
        text: "Please select a course.",
        type: "danger",
      });
      setLoading(false);
      return;
    }

    emailjs
      .send(
        import.meta.env.VITE_APP_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_APP_EMAILJS_TEMPLATE_ID,
        {
          from_name: form.name,
          from_phone: form.phone,
          selected_course: selected,
          to_name: "Hemanth",
          to_email: "elevyralearning@gmail.com",
          message: form.message,
        },
        import.meta.env.VITE_APP_EMAILJS_PUBLIC_KEY
      )
      .then(
        () => {
          setLoading(false);
          showAlert({
            show: true,
            text: "Thanks for your message! We’ll respond as soon as possible. 😃",
            type: "success",
          }); 

          setTimeout(() => {
            hideAlert(false);
            setForm({
              name: "",
              phone: "",
              email: "",
              message: "",
            });
            setSelected("Select course");
            navigate("/"); 
          }, 3000);
          
        },
        (error) => {
          setLoading(false);
          console.error(error);

          showAlert({
            show: true,
            text: "I didn't receive your message 😢",
            type: "danger",
          });
        }
      );
  };

  return (
    <div className="w-full md:w-1/3 py-10 px-4">
  {alert.show && <Alert {...alert} />}
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="col-span-2 flex flex-col items-center justify-center w-full "
      >
        <div className="relative w-full mb-6 mt-20 md:mt-0">
          <label className="">Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            autoComplete="off"
            placeholder="John Doe"
            className="w-full p-1 text-gray-200 bg-transparent border-b-2 border-secondaryWhite outline-none focus:border-primaryWhite"
          />
        </div>

        <div className="relative w-full mb-6">
          <label>Courses</label>
          <div
            onClick={() => setIsOpen(!isOpen)}
            className="w-full p-1 text-gray-200 border-b-2 border-secondaryWhite cursor-pointer flex items-center justify-between"
          >
            {selected} <IoMdArrowDropdown />
          </div>
          <ul
            className={`absolute w-full bg-primary text-gray-200 border border-secondaryWhite rounded-md mt-1 z-10 overflow-hidden transition-all duration-500 ease-in-out ${
              isOpen ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
            }`}
            style={{ transitionProperty: "max-height, opacity" }}
          >
            {options.map((option, index) => (
              <li
                key={index}
                onClick={() => handleSelect(option)}
                className="px-2 py-1 hover:bg-primaryGray hover:rounded-md cursor-pointer"
              >
                {option}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative w-full mb-6">
          <label className="">Phone</label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            required
            autoComplete="off"
            placeholder="9876543210"
            className="w-full p-1 text-gray-200 bg-transparent border-b-2 border-secondaryWhite outline-none focus:border-primaryWhite"
          />
          {phoneError && (
            <span className="text-red-500 text-sm">{phoneError}</span>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="styled-button relative px-4 py-2 text-sm text-gray-200 transition-all duration-300 bg-transparent rounded-sm hover:shadow-lg hover:bg-opacity-20 hover:bg-gray-200 hover:-translate-y-1 overflow-hidden"
        >
          {loading ? "Shooting..." : "Shoot Your Message"}
          <span className="absolute inset-0 w-full h-full opacity-0 transition-opacity duration-300 bg-gray-200"></span>
        </button>
      </form>
    </div>
  );
};

export default FormComp;
