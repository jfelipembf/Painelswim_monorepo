import PropTypes from "prop-types"
import React from "react"

import { connect } from "react-redux"
import { Link } from "react-router-dom"

// Import menuDropdown

import ProfileMenu from "../CommonForBoth/TopbarDropdown/ProfileMenu"

// import megamenuImg from "../../assets/images/megamenu-img.png"
import logoSwim from "../../assets/images/logoSwim.png"
import logoIcon from "../../assets/images/logoIcon.png"

const Header = ({ title, breadcrumbItems, toggleMenuCallback }) => {
  const items = breadcrumbItems || []
  const breadcrumbPath = items.map(item => item.title).join(" / ")

  return (
    <React.Fragment>
      <header id="page-topbar">
        <div className="navbar-header">
          <div className="d-flex align-items-center flex-wrap">
            <div className="navbar-brand-box">
              <div className="logo">
                <span className="logo-lg">
                  <img src={logoSwim} alt="Swim" className="brand-logo" />
                </span>
                <span className="logo-sm">
                  <img src={logoIcon} alt="Swim" className="brand-logo" style={{ filter: "brightness(0) invert(1)", height: "24px" }} />
                </span>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-sm px-3 font-size-16 header-item waves-effect vertical-menu-btn"
              id="vertical-menu-btn"
              onClick={toggleMenuCallback}
            >
              <i className="fa fa-fw fa-bars" />
            </button>

            {(title || breadcrumbPath) && (
              <div className="ms-3 d-none d-sm-block">
                <h5 className="mb-0 fs-5">{title || breadcrumbPath}</h5>
                {breadcrumbPath && title && <small className="text-muted small">{breadcrumbPath}</small>}
              </div>
            )}

          </div>
          <div className="d-flex">
            <ProfileMenu />

          </div>
        </div>
      </header>
    </React.Fragment>
  )
}

Header.propTypes = {
  breadcrumbItems: PropTypes.array,
  title: PropTypes.string,
  toggleMenuCallback: PropTypes.func,
}

const mapStateToProps = state => {
  const breadcrumb = state.Breadcrumb || {}
  return {
    title: breadcrumb.title || "",
    breadcrumbItems: breadcrumb.breadcrumbItems || [],
  }
}

export default connect(mapStateToProps)(Header)
