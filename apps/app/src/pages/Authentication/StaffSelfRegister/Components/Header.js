import React from "react"
import { Row, Col } from "reactstrap"
import logoSwim from "../../../../assets/images/logoSwim.png"

const Header = () => {
    return (
        <div className="bg-primary">
            <Row className="align-items-center">
                <Col xs={4} className="text-center ps-4">
                    <img
                        src={logoSwim}
                        alt="Logo"
                        className="img-fluid"
                        style={{
                            filter: 'brightness(0) invert(1)',
                            maxHeight: '100px'
                        }}
                    />
                </Col>
                <Col xs={8}>
                    <div className="text-white p-3">
                        <h4 className="text-white font-size-12">Bem-vindo(a)!</h4>
                        <p className="text-white-50 mb-0">Cadastre-se para acessar o Painel.</p>
                    </div>
                </Col>
            </Row>
        </div>
    )
}

export default Header
