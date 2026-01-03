import PropTypes from 'prop-types'
import React from "react"

import { Route, Routes } from "react-router-dom"
import { connect } from "react-redux"

// Import Routes all
import { userRoutes, authRoutes } from "./routes/allRoutes"

// Import all middleware
import Authmiddleware from "./routes/middleware/Authmiddleware"

// layouts Format
import VerticalLayout from "./components/VerticalLayout/"
import HorizontalLayout from "./components/HorizontalLayout/"
import NonAuthLayout from "./components/NonAuthLayout"

// Import scss
import "./assets/scss/theme.scss"

// Import Firebase Configuration file
import { initFirebaseBackend } from "./helpers/firebase_helper"

// Tenant/Branch providers removidos - não são necessários no painel admin


const firebaseConfig = {
  apiKey: process.env.REACT_APP_APIKEY || process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_AUTHDOMAIN || process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_DATABASEURL || process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_PROJECTID || process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGEBUCKET || process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:
    process.env.REACT_APP_MESSAGINGSENDERID || process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APPID || process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_MEASUREMENTID || process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
}

const defaultAuthProvider = process.env.REACT_APP_DEFAULTAUTH || "firebase"
console.log("[Admin App] defaultAuthProvider:", defaultAuthProvider)
console.log("[Admin App] firebaseConfig:", firebaseConfig)

if (defaultAuthProvider === "firebase") {
  console.log("[Admin App] Inicializando Firebase backend...")

  const hasConfig =
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId

  if (!hasConfig) {
    console.error("[Admin App] ❌ Configuração do Firebase incompleta!", firebaseConfig)
  } else {
    initFirebaseBackend(firebaseConfig)
  }
}

const App = props => {
// {alert('hiii')}
//   useEffect(() => {
//     alert('hii')
//     document.getElementsByTagName("html")[0].setAttribute("dir", "rtl");
//   }, [])

  function getLayout() {
    let layoutCls = VerticalLayout
    switch (props.layout.layoutType) {
      case "horizontal":
        layoutCls = HorizontalLayout
        break
      default:
        layoutCls = VerticalLayout
        break
    }
    return layoutCls
  }

  const Layout = getLayout()
  return (
    <React.Fragment>
      <Routes>
        {/* Non-authenticated routes */}
        {authRoutes.map((route, idx) => (
          <Route
            key={idx}
            path={route.path}
            element={
              <NonAuthLayout>
                {route.component}
              </NonAuthLayout>
            }
          />
        ))}

        {/* Authenticated routes - SEM tenant context (rotas normais do sistema) */}
        {userRoutes.map((route, idx) => (
          <Route
            key={idx}
            path={route.path}
            element={
              <Authmiddleware>
                <Layout>{route.component}</Layout>
              </Authmiddleware>              
            }
          />
        ))}
      </Routes>
    </React.Fragment>
  )
}

App.propTypes = {
  layout: PropTypes.any
}

const mapStateToProps = state => {
  return {
    layout: state.Layout,
  }
}

export default connect(mapStateToProps, null)(App)
