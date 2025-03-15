import React, { useState } from "react";
import { api, handleError } from "helpers/api";
import User from "models/User";
import {useNavigate} from "react-router-dom";
import { Button } from "components/ui/Button";
import "styles/views/Login.scss";
import BaseContainer from "components/ui/BaseContainer";
import PropTypes from "prop-types";

/*
It is possible to add multiple components inside a single file,
however be sure not to clutter your files with an endless amount!
As a rule of thumb, use one file per component and only add small,
specific components that belong to the main one in the same file.
 */
const FormField = (props) => {
  return (
    <div className="login field">
      <label className="login label">{props.label}</label>
      <input
        className="login input"
        placeholder="enter here.."
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        type={props.type || "text"}
      />
    </div>
  );
};

FormField.propTypes = {
  label: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  type: PropTypes.string,
};

// First, add these types at the top of the file
type Gender = "MALE" | "FEMALE" | "OTHER" | "NOT_TO_SAY";
type EducationField = "ENGINEERING" | "COMPUTER_SCIENCE" | "VOCATIONAL" | "OTHER";
type EducationLevel = "HIGH_SCHOOL" | "VOCATIONAL" | "BACHELORS" | "MASTERS_OR_PHD";
type HardwareExperience = "EXPERIENCED" | "BEGINNER" | "NO_EXPERIENCE";
type DisabilityTechKnowledge = "EXTENSIVE_KNOWLEDGE" | "MODERATE_KNOWLEDGE" | "SOME_KNOWLEDGE" | "LIMITED_KNOWLEDGE" | "NO_KNOWLEDGE";

const Login = () => {
  const navigate = useNavigate();
  const [firstname, setFirstname] = useState<string>(null);
  const [lastname, setLastname] = useState<string>(null);
  const [birthdate, setBirthdate] = useState<string>(null);
  const [gender, setGender] = useState<string>(null);
  const [educationField, setEducationField] = useState<EducationField>(null);
  const [educationLevel, setEducationLevel] = useState<EducationLevel>(null);
  const [hardwareExperience, setHardwareExperience] = useState<HardwareExperience>(null);
  const [disabilityTechKnowledge, setDisabilityTechKnowledge] = useState<DisabilityTechKnowledge>(null);

  const doLogin = async () => {
    try {
      const requestBody = JSON.stringify({ 
        firstname, 
        lastname, 
        birthdate, 
        gender,
        educationField,
        educationLevel,
        hardwareExperience,
        disabilityTechKnowledge
      });
      console.log(requestBody);
      const response = await api.post("/login", requestBody);

      // Get the returned user and update a new object.
      const user = new User(response.data);

      // Store the token into the local storage.
      localStorage.setItem("userId", user.id);
      localStorage.setItem("token", user.token);
      // Store the user evaluationCondition in the local storage
      localStorage.setItem("evaluation_condition", user.evaluationCondition);
      // Store the user info in the local storage
      localStorage.setItem("user", JSON.stringify(user));


      // Create an evaluation session
      const session = await api.post("/evaluation-sessions", {userId: user.id});
      // Store the session data in the local storage
      localStorage.setItem("session", JSON.stringify(session.data));
      // Store the session id in the local storage
      const sessionId = session.data.id;
      localStorage.setItem("sessionId", sessionId);

      console.log(localStorage)
      
      navigate("/tutorial");
    } catch (error) {
      alert(
        `Something went wrong during the login: \n${handleError(error)}`
      );
    }
  };

  return (
    <BaseContainer>
      <div className="login container">
        <div className="login form">
          <FormField
            label="First Name"
            value={firstname}
            onChange={(fn: string) => setFirstname(fn)}
          />
          <FormField
            label="Last Name"
            value={lastname}
            onChange={(ln: string) => setLastname(ln)}
          />
          <FormField
            label="Birthdate"
            value={birthdate}
            onChange={(bd: string) => setBirthdate(bd)}
            type="date"
          />
          <div className="login field">
            <label className="login label">Please share your gender identity</label>
            <select 
              className="login input"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="">Please select</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Non-binary / third gender</option>
              <option value="NOT_TO_SAY">Prefer not to say</option>
            </select>
          </div>
          <div className="login field">
            <label className="login label">Please indicate your field of education</label>
            <select 
              className="login input"
              value={educationField}
              onChange={(e) => setEducationField(e.target.value as EducationField)}
            >
              <option value="">Please select</option>
              <option value="ENGINEERING">Engineering / Physics / Math</option>
              <option value="COMPUTER_SCIENCE">Computer Science or IT</option>
              <option value="VOCATIONAL">Vocational or Technical Training</option>
              <option value="OTHER">Others</option>
            </select>
          </div>
          <div className="login field">
            <label className="login label">What is your highest level of education?</label>
            <select 
              className="login input"
              value={educationLevel}
              onChange={(e) => setEducationLevel(e.target.value as EducationLevel)}
            >
              <option value="">Please select</option>
              <option value="HIGH_SCHOOL">High School diploma or equivalent</option>
              <option value="VOCATIONAL">Vocational or Technical Certificate</option>
              <option value="BACHELORS">Bachelors degree or equivalent</option>
              <option value="MASTERS_OR_PHD">Master&apos;s degree or Doctoral (Ph.D.) or equivalent</option>
            </select>
          </div>
          <div className="login field">
            <label className="login label">Do you have experience in designing, developing, or building prototypes with hardware parts?</label>
            <select 
              className="login input"
              value={hardwareExperience}
              onChange={(e) => setHardwareExperience(e.target.value as HardwareExperience)}
            >
              <option value="">Please select</option>
              <option value="EXPERIENCED">Yes, with more than 5 projects</option>
              <option value="BEGINNER">Yes, with 5 or fewer projects</option>
              <option value="NO_EXPERIENCE">No, I have no experience</option>
            </select>
          </div>
          <div className="login field">
            <label className="login label">Do you have knowledge about disability and assistive technology?</label>
            <select
              className="login input"
              value={disabilityTechKnowledge}
              onChange={(e) => setDisabilityTechKnowledge(e.target.value as DisabilityTechKnowledge)}
            >
              <option value="">Please select</option>
              <option value="EXTENSIVE_KNOWLEDGE">Yes, with extensive knowledge</option>
              <option value="MODERATE_KNOWLEDGE">Yes, with moderate knowledge</option>
              <option value="SOME_KNOWLEDGE">Yes, with some knowledge</option>
              <option value="LIMITED_KNOWLEDGE">Yes, with limited knowledge</option>
              <option value="NO_KNOWLEDGE">No, I have no knowledge</option>
            </select>
          </div>
          <div className="login button-container">
            <Button
              disabled={!firstname || !lastname || !birthdate || !gender || !educationField || !educationLevel || !hardwareExperience || !disabilityTechKnowledge}
              width="100%"
              onClick={() => doLogin()}
            >
              Login
            </Button>
          </div>
        </div>
      </div>
    </BaseContainer>
  );
};

/**
 * You can get access to the history object's properties via the useLocation, useNavigate, useParams, ... hooks.
 */
export default Login;
