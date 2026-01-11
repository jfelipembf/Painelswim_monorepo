import React, { useEffect } from "react"
import { Navigate, Route, Routes, useParams } from "react-router-dom"
import { useDispatch } from "react-redux"

import Authmiddleware from "./middleware/Authmiddleware"
import { userRoutes } from "./allRoutes"
import { setTenantContext } from "../store/tenant/actions"

const TenantRouter = ({ Layout }) => {
  const { tenant, branch } = useParams()
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(setTenantContext({ tenant, branch }))
  }, [tenant, branch, dispatch])

  return (
    <Authmiddleware>
      <Layout>
        <Routes>
          {userRoutes
            .filter(route => route.path !== "/")
            .map((route, idx) => {
              const normalizedPath = route.path.startsWith("/")
                ? route.path.substring(1)
                : route.path

              return (
                <Route
                  key={idx}
                  path={normalizedPath}
                  element={route.component}
                />
              )
            })}
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="*" element={<Navigate to="/pages-404" replace />} />
        </Routes>
      </Layout>
    </Authmiddleware>
  )
}

export default TenantRouter
