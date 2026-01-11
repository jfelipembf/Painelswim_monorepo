import PropTypes from "prop-types"
import React from "react"

import { connect } from "react-redux"
import { Link } from "react-router-dom"

// Import menuDropdown

import ProfileMenu from "../CommonForBoth/TopbarDropdown/ProfileMenu"

// import megamenuImg from "../../assets/images/megamenu-img.png"
import logoSwim from "../../assets/images/logoSwim.png"

const Header = ({ title, breadcrumbItems }) => {
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
              </div>
            </div>

            {(title || breadcrumbPath) && (
              <div className="ms-3">
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
}

const mapStateToProps = state => {
  const breadcrumb = state.Breadcrumb || {}
  return {
    title: breadcrumb.title || "",
    breadcrumbItems: breadcrumb.breadcrumbItems || [],
  }
}

export default connect(mapStateToProps)(Header)
