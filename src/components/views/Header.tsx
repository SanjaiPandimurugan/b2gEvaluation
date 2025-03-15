import React from "react";
import {ReactLogo} from "../ui/ReactLogo";
import PropTypes from "prop-types";
import "../../styles/views/Header.scss";


const Header = props => (
  <div className="header container" style={{height: props.height}}>
    {/* <h1 className="header title">Evaluation</h1> */}
  </div>
);

Header.propTypes = {
  height: PropTypes.string,
};

/**
 * Don't forget to export your component!
 */
export default Header;
